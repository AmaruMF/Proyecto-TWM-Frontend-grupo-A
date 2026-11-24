using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Backend_GrupoA.Repositories;
using static Backend_GrupoA.Repositories.StoreRepository;
namespace Backend_GrupoA.Services;
public static class AdminBootstrap {
 public static async Task Run(IServiceProvider services,string contentRoot) {
  using var scope=services.CreateScope();var repo=scope.ServiceProvider.GetRequiredService<StoreRepository>();
  var hasher=scope.ServiceProvider.GetRequiredService<IPasswordHasher<string>>();
  await using var c=await repo.Open(default);await using var tx=await c.BeginTransactionAsync();
  const string id="ADMIN-LOCAL";
  if(await Scalar<bool>(c,"SELECT EXISTS(SELECT 1 FROM usuario WHERE run=@id)",default,("id",id))) { Console.WriteLine("La cuenta local ya existe. No se modificaron sus credenciales."); return; }
  var password="Mp!"+Convert.ToBase64String(RandomNumberGenerator.GetBytes(24))+"8a";
  await Exec(c,"INSERT INTO usuario(run,nombre,clave_acceso,fecha_nacimiento,fecha_registro,tipo) VALUES(@id,'Administrador local','!HASHED!','1990-01-01',CURRENT_DATE,1)",default,("id",id));
  await Exec(c,"INSERT INTO app.usuario(usuario_id,email,admin) VALUES(@id,'admin@multiplaza.local',true)",default,("id",id));
  await Exec(c,"INSERT INTO app.credencial(usuario_id,password_hash) VALUES(@id,@hash)",default,("id",id),("hash",hasher.HashPassword(id,password)));
  var directory=Path.GetFullPath(Path.Combine(contentRoot,"..",".local"));Directory.CreateDirectory(directory);
  var path=Path.Combine(directory,"Acceso-administrador.txt");
  await File.WriteAllTextAsync(path,"Acceso local a Multiplaza\nUsuario: admin@multiplaza.local\nContraseña: "+password+"\n\nCambia la contraseña desde Mi cuenta después del primer acceso.\nEste archivo es privado: no subirlo a Git ni compartirlo.\n");
  await tx.CommitAsync();Console.WriteLine("Administrador creado. Credenciales guardadas en .local/Acceso-administrador.txt; no se imprimen en la terminal.");
 }
}
