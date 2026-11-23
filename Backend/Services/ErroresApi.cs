using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace TiendaMultiplaza.API.Services;
public sealed class ErroresApi(ILogger<ErroresApi> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception ex, CancellationToken ct)
    {
        var pg = ex as PostgresException ?? (ex as DbUpdateException)?.InnerException as PostgresException;
        var (status, title) = ex switch
        {
            ReglaException r => (r.Status, r.Message),
            DbUpdateConcurrencyException => (409, "El registro cambió. Actualiza e intenta otra vez."),
            _ when pg?.SqlState == "23505" => (409, "Ya existe un registro con esos datos."),
            _ when pg?.SqlState == "23503" => (409, "El registro está relacionado con otros datos o la referencia no existe."),
            _ when pg?.SqlState is "23514" or "22001" or "22003" => (400, "Los datos no cumplen las reglas de la base."),
            _ when pg?.SqlState is "40001" or "40P01" => (409, "Otra operación modificó estos datos. Intenta de nuevo con la misma clave de pedido."),
            _ => (500, "No se pudo completar la operación.")
        };
        if (status == 500)
            logger.LogError(ex, "Error de API. TraceId: {TraceId}", context.TraceIdentifier);
        context.Response.StatusCode = status;
        await Results.Problem(statusCode: status, title: title, extensions: new Dictionary<string, object?> { { "traceId", context.TraceIdentifier } }).ExecuteAsync(context);
        return true;
    }
}
