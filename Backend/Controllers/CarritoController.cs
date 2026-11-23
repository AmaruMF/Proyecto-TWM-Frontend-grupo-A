using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TiendaMultiplaza.API.DTOs;
using TiendaMultiplaza.API.Services;
namespace TiendaMultiplaza.API.Controllers;
[ApiController, Route("api/carrito"), Authorize]
public sealed class CarritoController(CarritoService carrito) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Obtener(CancellationToken ct) => Ok(await carrito.Obtener(User.Usuario(), ct));
    [HttpPut("items")]
    public async Task<IActionResult> Guardar(CarritoItemDto dto, CancellationToken ct)
    {
        await carrito.Guardar(User.Usuario(), dto, ct);
        return Ok(await carrito.Obtener(User.Usuario(), ct));
    }
    [HttpPut("items/{sku}/cantidad")]
    public async Task<IActionResult> Cantidad(string sku, CantidadDto dto, CancellationToken ct)
    {
        await carrito.Cantidad(User.Usuario(), sku, dto.Cantidad, ct);
        return Ok(await carrito.Obtener(User.Usuario(), ct));
    }
    [HttpDelete("items/{sku}")]
    public async Task<IActionResult> Eliminar(string sku, CancellationToken ct)
    {
        await carrito.Eliminar(User.Usuario(), sku, ct);
        return NoContent();
    }
    [HttpDelete]
    public async Task<IActionResult> Vaciar(CancellationToken ct)
    {
        await carrito.Eliminar(User.Usuario(), null, ct);
        return NoContent();
    }
}
