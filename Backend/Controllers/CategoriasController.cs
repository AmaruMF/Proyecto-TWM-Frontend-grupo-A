using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TiendaMultiplaza.API.DTOs;
using TiendaMultiplaza.API.Services;
namespace TiendaMultiplaza.API.Controllers;
[ApiController, Route("api/categorias")]
public sealed class CategoriasController(CatalogoService catalogo) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> Listar(CancellationToken ct) => Ok(await catalogo.Categorias(ct));
    [HttpGet("{id:int}"), AllowAnonymous]
    public async Task<IActionResult> Obtener(int id, CancellationToken ct)
    {
        var item = (await catalogo.Categorias(ct)).SingleOrDefault(x => x.IdCategoria == id);
        return item is null ? NotFound() : Ok(item);
    }
    [HttpPost, Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear(CategoriaGuardarDto dto, CancellationToken ct)
    {
        var item = await catalogo.GuardarCategoria(null, dto, ct);
        return CreatedAtAction(nameof(Obtener), new
        {
            id = item.IdCategoria
        }, item);
    }
    [HttpPut("{id:int}"), Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Editar(int id, CategoriaGuardarDto dto, CancellationToken ct) => Ok(await catalogo.GuardarCategoria(id, dto, ct));
    [HttpDelete("{id:int}"), Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        await catalogo.EliminarCategoria(id, ct);
        return NoContent();
    }
}
