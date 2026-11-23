using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaMultiplaza.API.Data;
using TiendaMultiplaza.API.Services;
namespace TiendaMultiplaza.API.Controllers;
[ApiController, Route("api/referencias"), Authorize(Roles = "Administrador")]
public sealed class ReferenciasController(TiendaMultiplazaContext db) : ControllerBase
{
    [HttpGet("cotizaciones")]
    public async Task<IActionResult> Cotizaciones(CancellationToken ct, int pagina = 1, int tamano = 20)
    {
        var offset = Reglas.Offset(pagina, tamano);
        return Ok(await db.Cotizacion.AsNoTracking().OrderByDescending(x => x.IdCotizacion).Skip(offset).Take(tamano).Select(x => new { x.IdCotizacion, x.Fecha, x.EmpresaId }).ToListAsync(ct));
    }
    [HttpGet("vendedores")]
    public async Task<IActionResult> Vendedores(CancellationToken ct, int pagina = 1, int tamano = 20)
    {
        var offset = Reglas.Offset(pagina, tamano);
        return Ok(await db.Usuario_Acceso.AsNoTracking().Where(x => x.Activo).OrderBy(x => x.UsuarioRun).Skip(offset).Take(tamano).Select(x => new { Run = x.UsuarioRun, x.Usuario.Nombre }).ToListAsync(ct));
    }
}
