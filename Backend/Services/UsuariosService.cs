using Microsoft.EntityFrameworkCore;
using TiendaMultiplaza.API.Data;
using TiendaMultiplaza.API.DTOs;

namespace TiendaMultiplaza.API.Services;
public sealed class UsuariosService(TiendaMultiplazaContext db)
{
    public async Task<PaginaDto<UsuarioDto>> Listar(int pagina, int tamano, CancellationToken ct)
    {
        var offset = Reglas.Offset(pagina, tamano);
        var query = db.Usuario_Acceso.AsNoTracking();
        var total = await query.CountAsync(ct);
        var data = await query.OrderBy(x => x.UsuarioRun).Skip(offset).Take(tamano)
            .Select(x => new UsuarioDto(x.UsuarioRun, x.Usuario.Nombre, x.Usuario.FechaNacimiento, x.Rol, x.Activo)).ToListAsync(ct);
        return new(data, pagina, tamano, total);
    }
    public async Task Perfil(string run, PerfilDto dto, CancellationToken ct)
    {
        var user = await db.Usuario.SingleAsync(x => x.Run == run, ct);
        user.Nombre = Reglas.Texto(dto.Nombre, "Nombre");
        await db.SaveChangesAsync(ct);
    }
    public async Task Acceso(string actor, string run, AccesoDto dto, CancellationToken ct)
    {
        run = Reglas.Run(run);
        if (dto.Rol is not ("Cliente" or "Administrador"))
            throw new ReglaException(400, "Rol inválido.");
        if (run == actor)
            throw new ReglaException(409, "No puedes cambiar tu propio rol ni desactivar tu cuenta desde administración.");
        // Serializa administración de roles para preservar al menos un administrador activo.
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(740021)", ct);
        var actorAccess = await db.Usuario_Acceso.AsNoTracking().SingleAsync(x => x.UsuarioRun == actor, ct);
        if (!actorAccess.Activo || actorAccess.Rol != "Administrador")
            throw new ReglaException(403, "Se requiere administración.");
        var access = await db.Usuario_Acceso.SingleOrDefaultAsync(x => x.UsuarioRun == run, ct) ?? throw new ReglaException(404, "Usuario no encontrado.");
        if (access.Rol == "Administrador" && access.Activo && (!dto.Activo || dto.Rol != "Administrador") && await db.Usuario_Acceso.CountAsync(x => x.Rol == "Administrador" && x.Activo, ct) <= 1)
            throw new ReglaException(409, "Debe existir un administrador activo.");
        access.Rol = dto.Rol;
        access.Activo = dto.Activo;
        access.VersionToken++;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }
}
