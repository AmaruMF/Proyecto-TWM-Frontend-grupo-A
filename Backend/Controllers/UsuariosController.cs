using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TiendaMultiplaza.API.DTOs;
using TiendaMultiplaza.API.Services;
namespace TiendaMultiplaza.API.Controllers;
[ApiController, Route("api/usuarios"), Authorize]
public sealed class UsuariosController(UsuariosService users) : ControllerBase
{
    [HttpGet, Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Listar(CancellationToken ct, int pagina = 1, int tamano = 20) => Ok(await users.Listar(pagina, tamano, ct));
    [HttpPut("me")]
    public async Task<IActionResult> Perfil(PerfilDto dto, CancellationToken ct)
    {
        await users.Perfil(User.Usuario(), dto, ct);
        return NoContent();
    }
    [HttpPut("{run}/acceso"), Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Acceso(string run, AccesoDto dto, CancellationToken ct)
    {
        await users.Acceso(User.Usuario(), run, dto, ct);
        return NoContent();
    }
}
