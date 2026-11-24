using System.Security.Claims;
using Backend_GrupoA.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_GrupoA.Controllers;

[ApiController, Authorize, Route("api/pedidos")]
public class OrdersController(MultiplazaDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(int page = 1, int pageSize = 25, bool sales = false, CancellationToken ct = default)
    {
        if (page < 1 || page > 10000 || pageSize < 1 || pageSize > 100) return BadRequest();
        var actor = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var source = db.Venta.AsNoTracking().Where(v => v.Usuarios.Any(u => u.Run == actor));
        if (sales) source = db.Venta.AsNoTracking().Where(v => v.Detalles.Any(d => d.Empresa.UsuarioId == actor)
            || v.Estableces.Any(e => e.Empresa.UsuarioId == actor));
        source = source.Where(v => !db.OrderLinks.Any(p => p.SaleId == v.IdVenta));
        var total = await source.CountAsync(ct);
        // En ventas mixtas solo se devuelve el total si toda la operación corresponde
        // a empresas del usuario; no se expone la facturación de otro vendedor.
        var items = await source.OrderByDescending(v => v.IdVenta).Skip((page - 1) * pageSize).Take(pageSize).Select(v => new {
            id = v.IdVenta,
            date = v.VentaDato == null ? (DateOnly?)null : v.VentaDato.Fecha,
            total = v.VentaDato == null || (sales && (v.Detalles.Any(d => d.Empresa.UsuarioId != actor)
                || v.Estableces.Any(e => e.Empresa.UsuarioId != actor))) ? (int?)null : v.VentaDato.PrecioTotal,
            states = v.Generas.Select(g => g.Estado).Distinct().ToArray(),
            products = v.Detalles.Where(d => !sales || d.Empresa.UsuarioId == actor).Select(d => d.Producto.Nombre).ToArray(),
            services = v.Estableces.Where(e => !sales || e.Empresa.UsuarioId == actor).Select(e => e.Servicio.Nombre).ToArray()
        }).ToListAsync(ct);
        return Ok(new { items, total, page, pageSize });
    }
}

