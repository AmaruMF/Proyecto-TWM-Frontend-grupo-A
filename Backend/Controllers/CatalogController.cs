using Backend_GrupoA.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Backend_GrupoA.Controllers;

[ApiController]
[Route("api")]
public class CatalogController(CatalogRepository catalog) : ControllerBase
{
    [HttpGet("productos")]
    public async Task<IActionResult> Products(int page = 1, int pageSize = 48, string? search = null, CancellationToken ct = default)
    {
        if (page < 1 || page > 10000 || pageSize < 1 || pageSize > 100 || search?.Length > 100) return BadRequest(new { title = "Paginación o búsqueda inválida." });
        return Ok(await catalog.Products(page, pageSize, search, null, ct));
    }
    [HttpGet("servicios")]
    public async Task<IActionResult> Services(int page = 1, int pageSize = 48, string? search = null, CancellationToken ct = default)
    {
        if (page < 1 || page > 10000 || pageSize < 1 || pageSize > 100 || search?.Length > 100) return BadRequest(new { title = "Paginación o búsqueda inválida." });
        return Ok(await catalog.Services(page, pageSize, search, ct));
    }
    [HttpGet("categorias")]
    public async Task<IActionResult> Categories(CancellationToken ct) => Ok(await catalog.Categories(ct));
}
