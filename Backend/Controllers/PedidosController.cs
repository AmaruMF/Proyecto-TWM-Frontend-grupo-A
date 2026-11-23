using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TiendaMultiplaza.API.DTOs;
using TiendaMultiplaza.API.Services;
namespace TiendaMultiplaza.API.Controllers;
[ApiController, Route("api/pedidos"), Authorize]
public sealed class PedidosController(PedidosService pedidos) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Confirmar(ConfirmarPedidoDto dto, CancellationToken ct)
    {
        var order = await pedidos.Confirmar(User.Usuario(), dto, ct);
        return CreatedAtAction(nameof(Obtener), new
        {
            id = order.IdVenta
        }, order);
    }
    [HttpGet]
    public async Task<IActionResult> Listar(CancellationToken ct, int pagina = 1, int tamano = 20) => Ok(await pedidos.Listar(User.Usuario(), false, pagina, tamano, ct));
    [HttpGet("administracion"), Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Administracion(CancellationToken ct, int pagina = 1, int tamano = 20) => Ok(await pedidos.Listar(User.Usuario(), true, pagina, tamano, ct));
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id, CancellationToken ct) => Ok(await pedidos.Obtener(id, User.Usuario(), User.IsInRole("Administrador"), ct));
    [HttpPost("{id:int}/cancelar")]
    public async Task<IActionResult> Cancelar(int id, CancellationToken ct) => Ok(await pedidos.CambiarEstado(id, User.Usuario(), User.IsInRole("Administrador"), "Cancelado", ct));
    [HttpPut("{id:int}/estado"), Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Estado(int id, EstadoPedidoDto dto, CancellationToken ct) => Ok(await pedidos.CambiarEstado(id, User.Usuario(), true, dto.Estado, ct));
}
