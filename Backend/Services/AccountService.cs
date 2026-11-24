using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Backend_GrupoA.DTOs;
using Backend_GrupoA.Repositories;
using Microsoft.AspNetCore.Identity;
using static Backend_GrupoA.Repositories.StoreRepository;
namespace Backend_GrupoA.Services;

public sealed class StoreException(string message, int status = 400) : Exception(message) { public int Status { get; } = status; }
public class AccountService(StoreRepository repo, IPasswordHasher<string> hasher)
{
 public static DateOnly Today => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow,"America/Santiago"));
 public static string Rut(string input) {
  var s=input.Trim().Replace(".", "").Replace("-", "").ToUpperInvariant();
  if(s.Length<2 || s.Length>9 || !s[..^1].All(char.IsAsciiDigit)) throw new StoreException("RUN/RUT inválido.");
  var sum=0; var factor=2; for(var i=s.Length-2;i>=0;i--) { sum+=(s[i]-'0')*factor; factor=factor==7?2:factor+1; }
  var dv=11-sum%11; var expected=dv==11?"0":dv==10?"K":dv.ToString();
  if(s[^1].ToString()!=expected) throw new StoreException("El dígito verificador del RUN/RUT no es válido.");
  return s[..^1]+"-"+s[^1];
 }
 public static void PasswordValid(string value) { if(value.Length<8 || value.Length>128 || !value.Any(char.IsUpper) || !value.Any(char.IsDigit) || !value.Any(c=>!char.IsLetterOrDigit(c))) throw new StoreException("La contraseña requiere 8 a 128 caracteres, una mayúscula, un número y un símbolo."); }
 public async Task<string?> Authenticate(string identifier,string password,CancellationToken ct) {
  if(string.IsNullOrWhiteSpace(identifier)||string.IsNullOrEmpty(password)||identifier.Length>255||password.Length>128) return null;
  await using var c=await repo.Open(ct);
  var rows=await Json(c,"""
   SELECT coalesce(json_agg(x),'[]')::text FROM (
    SELECT u.run,u.clave_acceso,h.password_hash FROM usuario u
    LEFT JOIN app.usuario a ON a.usuario_id=u.run LEFT JOIN app.credencial h ON h.usuario_id=u.run
    WHERE NOT coalesce(a.disabled,false) AND (replace(replace(upper(u.run),'.',''),'-','')=@run
      OR lower(a.email)=@email OR EXISTS(SELECT 1 FROM correo co WHERE co.usuario_id=u.run AND lower(trim(co.direccion_correo))=@email)) LIMIT 2
   )x
   """,ct,("run",identifier.Trim().Replace(".","").Replace("-","").ToUpperInvariant()),("email",identifier.Trim().ToLowerInvariant()));
  if(rows.GetArrayLength()!=1) return null;
  var user=rows[0]; var id=user.GetProperty("run").GetString()!; var hash=user.GetProperty("password_hash").GetString();
  if(hash!=null) return hasher.VerifyHashedPassword(id,hash,password)!=PasswordVerificationResult.Failed?id:null;
  var legacy=user.GetProperty("clave_acceso").GetString()!;
  if(legacy=="!HASHED!" || !CryptographicOperations.FixedTimeEquals(SHA256.HashData(Encoding.UTF8.GetBytes(password)),SHA256.HashData(Encoding.UTF8.GetBytes(legacy)))) return null;
  await using var tx=await c.BeginTransactionAsync(ct);
  await Exec(c,"INSERT INTO app.credencial(usuario_id,password_hash) VALUES(@id,@hash) ON CONFLICT DO NOTHING",ct,("id",id),("hash",hasher.HashPassword(id,password)));
  await Exec(c,"UPDATE usuario SET clave_acceso='!HASHED!' WHERE run=@id",ct,("id",id));
  await tx.CommitAsync(ct); return id;
 }
 public async Task<object?> Profile(string id,CancellationToken ct) {
  await using var c=await repo.Open(ct);
  var rows=await Json(c,"""
   SELECT coalesce(json_agg(x),'[]')::text FROM (
    SELECT u.run id,u.nombre name,u.fecha_nacimiento birthday,u.fecha_nacimiento<=@adult adult,
      coalesce(a.admin,false) admin,
      (SELECT coalesce(json_agg(email),'[]') FROM (SELECT a.email WHERE a.email IS NOT NULL UNION SELECT direccion_correo FROM correo WHERE usuario_id=u.run) emails) emails,
      (SELECT coalesce(json_agg(comp),'[]') FROM (SELECT run_empresa id,nombre name,pagina_web website FROM empresa WHERE usuario_id=u.run) comp) companies
    FROM usuario u LEFT JOIN app.usuario a ON a.usuario_id=u.run WHERE u.run=@id AND NOT coalesce(a.disabled,false)
   )x
   """,ct,("id",id),("adult",Today.AddYears(-18)));
  return rows.GetArrayLength()==0?null:rows[0].Clone();
 }
 public async Task<string> Register(RegisterDto dto,CancellationToken ct) {
  var id=Rut(dto.Run); PasswordValid(dto.Password);
  if(string.IsNullOrWhiteSpace(dto.Name)||dto.Birthday<Today.AddYears(-110)||dto.Birthday>Today.AddYears(-14)||dto.Birthday<new DateOnly(1940,1,1)) throw new StoreException("Revisa el nombre y la fecha de nacimiento; se requieren al menos 14 años.");
  await using var c=await repo.Open(ct); await using var tx=await c.BeginTransactionAsync(ct);
  await Exec(c,"SELECT pg_advisory_xact_lock(708113)",ct);
  var email=dto.Email.Trim().ToLowerInvariant();
  if(await Scalar<bool>(c,"SELECT EXISTS(SELECT 1 FROM correo WHERE lower(trim(direccion_correo))=@email UNION ALL SELECT 1 FROM app.usuario WHERE email=@email)",ct,("email",email))) throw new StoreException("El correo ya está registrado.",409);
  if(await Scalar<bool>(c,"SELECT EXISTS(SELECT 1 FROM usuario WHERE replace(replace(upper(run),'.',''),'-','')=@run)",ct,("run",id.Replace("-","")))) throw new StoreException("El RUN ya está registrado.",409);
  await Exec(c,"INSERT INTO usuario(run,nombre,clave_acceso,fecha_nacimiento,fecha_registro,tipo) VALUES(@id,@name,'!HASHED!',@birth,CURRENT_DATE,1)",ct,("id",id),("name",dto.Name.Trim()),("birth",dto.Birthday));
  await Exec(c,"INSERT INTO app.usuario(usuario_id,email) VALUES(@id,@email)",ct,("id",id),("email",email));
  await Exec(c,"INSERT INTO app.credencial(usuario_id,password_hash) VALUES(@id,@hash)",ct,("id",id),("hash",hasher.HashPassword(id,dto.Password)));
  await tx.CommitAsync(ct); return id;
 }
 public async Task Edit(string id,ProfileEditDto dto,CancellationToken ct) {
  if(string.IsNullOrWhiteSpace(dto.Name)) throw new StoreException("Escribe tu nombre.");
  await using var c=await repo.Open(ct); await using var tx=await c.BeginTransactionAsync(ct);
  await Exec(c,"SELECT pg_advisory_xact_lock(708113)",ct);
  var email=dto.Email.Trim().ToLowerInvariant();
  if(await Scalar<bool>(c,"SELECT EXISTS(SELECT 1 FROM correo WHERE lower(trim(direccion_correo))=@email AND usuario_id<>@id UNION ALL SELECT 1 FROM app.usuario WHERE email=@email AND usuario_id<>@id)",ct,("email",email),("id",id))) throw new StoreException("El correo ya pertenece a otra cuenta.",409);
  await Exec(c,"UPDATE usuario SET nombre=@name WHERE run=@id",ct,("id",id),("name",dto.Name.Trim()));
  await Exec(c,"INSERT INTO app.usuario(usuario_id,email) VALUES(@id,@email) ON CONFLICT(usuario_id) DO UPDATE SET email=excluded.email",ct,("id",id),("email",email));
  await tx.CommitAsync(ct);
 }
 public async Task ChangePassword(string id,PasswordDto dto,CancellationToken ct) {
  PasswordValid(dto.NewPassword); if(await Authenticate(id,dto.CurrentPassword,ct)!=id) throw new StoreException("La contraseña actual no coincide.",403);
  await using var c=await repo.Open(ct);
  await Exec(c,"UPDATE app.credencial SET password_hash=@hash,actualizado_en=now() WHERE usuario_id=@id",ct,("id",id),("hash",hasher.HashPassword(id,dto.NewPassword)));
 }
 public async Task Company(string id,CompanyDto dto,CancellationToken ct) {
  var rut=Rut(dto.Rut); await using var c=await repo.Open(ct);
  if(!await Scalar<bool>(c,"SELECT EXISTS(SELECT 1 FROM usuario WHERE run=@id AND fecha_nacimiento<=@adult)",ct,("id",id),("adult",Today.AddYears(-18)))) throw new StoreException("Debes tener 18 años para registrar una empresa.",403);
  if(string.IsNullOrWhiteSpace(dto.Name)) throw new StoreException("Escribe el nombre de la empresa.");
  await Exec(c,"INSERT INTO empresa(run_empresa,nombre,usuario_id) VALUES(@rut,@name,@id)",ct,("rut",rut),("name",dto.Name.Trim()),("id",id));
 }
 public async Task<bool> IsAdmin(string id,CancellationToken ct) { await using var c=await repo.Open(ct); return await Scalar<bool>(c,"SELECT EXISTS(SELECT 1 FROM app.usuario WHERE usuario_id=@id AND admin AND NOT disabled)",ct,("id",id)); }
}
