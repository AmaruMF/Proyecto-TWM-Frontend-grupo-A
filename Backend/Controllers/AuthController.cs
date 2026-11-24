using System.Security.Claims;
using Backend_GrupoA.DTOs;
using Backend_GrupoA.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Backend_GrupoA.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AccountService accounts) : ControllerBase
{
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login(LoginDto dto, CancellationToken ct)
    {
        var id = await accounts.Authenticate(dto.Identifier, dto.Password, ct);
        if (id == null) return Unauthorized(new { title = "El correo/RUN o la contraseña no son correctos." });
        var principal = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id)], CookieAuthenticationDefaults.AuthenticationScheme));
        await HttpContext.SignInAsync(principal, new AuthenticationProperties { IsPersistent = dto.Remember });
        return Ok(await accounts.Profile(id, ct));
    }
    [Authorize, HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var profile = await accounts.Profile(User.FindFirstValue(ClaimTypes.NameIdentifier)!, ct);
        return profile == null ? Unauthorized() : Ok(profile);
    }
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync();
        return NoContent();
    }
}
