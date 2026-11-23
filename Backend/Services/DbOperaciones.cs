using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;
using TiendaMultiplaza.API.Data;

namespace TiendaMultiplaza.API.Services;
public static class DbOperaciones
{
    public static async Task<int> SiguienteId(TiendaMultiplazaContext db, string entidad, CancellationToken ct)
    {
        var sequence = entidad switch
        {
            "categoria" => "public.api_categoria_id",
            "stock" => "public.api_stock_id",
            "venta" => "public.api_venta_id",
            _ => throw new ArgumentException("Secuencia desconocida.")
        };
        await db.Database.OpenConnectionAsync(ct);
        await using var command = new NpgsqlCommand("SELECT nextval(@sequence::regclass)", (NpgsqlConnection)db.Database.GetDbConnection(), (NpgsqlTransaction?)db.Database.CurrentTransaction?.GetDbTransaction());
        command.Parameters.AddWithValue("sequence", sequence);
        return checked((int)(long)(await command.ExecuteScalarAsync(ct))!);
    }
    public static async Task BloquearUsuario(TiendaMultiplazaContext db, string run, CancellationToken ct)
    {
        // El mismo cerrojo serializa cambios de carrito, checkout y credenciales por usuario.
        var access = await db.Usuario_Acceso.FromSqlInterpolated($"SELECT * FROM public.usuario_acceso WHERE usuario_run = {run} FOR UPDATE").SingleOrDefaultAsync(ct);
        if (access is null || !access.Activo)
            throw new ReglaException(403, "Usuario inactivo.");
    }
}
