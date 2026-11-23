using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;
using TiendaMultiplaza.API.Data;
using TiendaMultiplaza.API.Models;

namespace TiendaMultiplaza.API.Services;
public static class InicializarBase
{
    public static async Task Ejecutar(IServiceProvider services, string root, CancellationToken ct = default)
    {
        var db = services.GetRequiredService<TiendaMultiplazaContext>();
        var hasher = services.GetRequiredService<IPasswordHasher<Usuario>>();
        var config = services.GetRequiredService<IConfiguration>();
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(740020)", ct);
        await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS public.api_migracion (version integer PRIMARY KEY, aplicada_en timestamptz NOT NULL DEFAULT now())", ct);
        await using var command = new NpgsqlCommand("SELECT EXISTS(SELECT 1 FROM public.api_migracion WHERE version=1)", (NpgsqlConnection)db.Database.GetDbConnection(), (NpgsqlTransaction)tx.GetDbTransaction());
        var exists = (bool)(await command.ExecuteScalarAsync(ct))!;
        if (!exists)
        {
            command.CommandText = "SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal AND c.relname IN ('usuario','producto','stock','venta','venta_datos','compra','incluye')";
            if ((long)(await command.ExecuteScalarAsync(ct))! > 0)
                throw new InvalidOperationException("Hay triggers de negocio activos. Revisar su coordinación con los servicios antes de instalar esta ampliación.");
            await db.Database.ExecuteSqlRawAsync(await File.ReadAllTextAsync(Path.Combine(root, "Database", "001_backend.sql"), ct), ct);
            await db.Database.ExecuteSqlRawAsync("INSERT INTO public.api_migracion(version) VALUES (1)", ct);
        }
        // El marcador impide volver a cifrar hashes al reejecutar la inicialización.
        var pending = await db.Usuario_Acceso.Include(x => x.Usuario).Where(x => !x.ClaveEsHash).ToListAsync(ct);
        foreach (var access in pending)
        {
            access.Usuario.ClaveAcceso = hasher.HashPassword(access.Usuario, access.Usuario.ClaveAcceso);
            access.ClaveEsHash = true;
        }
        var adminRun = Reglas.Run(config["Bootstrap:Run"] ?? "ADMINLOCAL");
        if (!await db.Usuario_Acceso.AnyAsync(x => x.Rol == "Administrador" && x.Activo, ct))
        {
            var password = config["Bootstrap:Clave"] ?? throw new InvalidOperationException("Configura Bootstrap:Clave para crear el administrador inicial.");
            Reglas.Clave(password);
            if (await db.Usuario.AnyAsync(x => x.Run == adminRun, ct))
                throw new InvalidOperationException("El RUN del administrador inicial ya existe. Selecciona otro Bootstrap:Run.");
            var user = new Usuario { Run = adminRun, Nombre = "Administrador local", FechaNacimiento = new DateOnly(1990, 1, 1), FechaRegistro = Reglas.Hoy, Tipo = 1 };
            user.ClaveAcceso = hasher.HashPassword(user, password);
            db.Usuario.Add(user);
            db.Usuario_Acceso.Add(new Usuario_Acceso { UsuarioRun = adminRun, Usuario = user, Rol = "Administrador", ClaveEsHash = true });
        }
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        Console.WriteLine($"Base inicializada. Cuentas existentes protegidas con hash: {pending.Count}.");
    }
}
