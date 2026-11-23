using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TiendaMultiplaza.API.DTOs;
using TiendaMultiplaza.API.Services;
namespace TiendaMultiplaza.API.Controllers;
[ApiController, Route("api/productos")]
public sealed class ProductosController(CatalogoService catalogo) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> Listar(CancellationToken ct, int pagina = 1, int tamano = 20, string? buscar = null, int? categoria = null, bool incluirOcultos = false)
    {
        if (incluirOcultos && !User.IsInRole("Administrador"))
            return Forbid();
        return Ok(await catalogo.Listar(pagina, tamano, buscar, categoria, incluirOcultos, ct));
    }
    [HttpGet("{sku}"), AllowAnonymous]
    public async Task<IActionResult> Obtener(string sku, CancellationToken ct) => Ok(await catalogo.Obtener(sku, User.IsInRole("Administrador"), ct));
    [HttpPost, Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear(ProductoGuardarDto dto, CancellationToken ct)
    {
        var p = await catalogo.Guardar(null, dto, ct);
        return CreatedAtAction(nameof(Obtener), new
        {
            sku = p.Sku
        }, p);
    }
    [HttpPut("{sku}"), Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Editar(string sku, ProductoGuardarDto dto, CancellationToken ct) => Ok(await catalogo.Guardar(sku, dto, ct));
    [HttpDelete("{sku}"), Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(string sku, CancellationToken ct)
    {
        await catalogo.Ocultar(sku, ct);
        return NoContent();
    }
    [HttpPut("{sku}/stock"), Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Stock(string sku, StockDto dto, CancellationToken ct)
    {
        await catalogo.Stock(sku, dto.Cantidad, ct);
        return NoContent();
    }
}
