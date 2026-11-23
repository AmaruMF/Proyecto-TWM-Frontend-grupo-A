using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TiendaMultiplaza.API.DTOs;
using TiendaMultiplaza.API.Services;
namespace TiendaMultiplaza.API.Controllers;
[ApiController, Route("api/auth")]
public sealed class AuthController(AuthService auth) : ControllerBase
{
    [HttpPost("registro"), AllowAnonymous, EnableRateLimiting("auth")]
    public async Task<IActionResult> Registro(RegistroDto dto, CancellationToken ct) => StatusCode(201, await auth.Registrar(dto, ct));
    [HttpPost("login"), AllowAnonymous, EnableRateLimiting("auth")]
    public async Task<IActionResult> Login(LoginDto dto, CancellationToken ct) => Ok(await auth.Login(dto, ct));
    [HttpGet("me"), Authorize]
    public async Task<IActionResult> Me(CancellationToken ct) => Ok(await auth.Perfil(User.Usuario(), ct));
    [HttpPut("clave"), Authorize]
    public async Task<IActionResult> CambiarClave(ClaveDto dto, CancellationToken ct)
    {
        await auth.CambiarClave(User.Usuario(), dto, ct);
        return NoContent();
    }
    [HttpPost("logout"), Authorize]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        await auth.CerrarSesiones(User.Usuario(), ct);
        return NoContent();
    }
}
