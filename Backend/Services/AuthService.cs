using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TiendaMultiplaza.API.Data;
using TiendaMultiplaza.API.DTOs;
using TiendaMultiplaza.API.Models;

namespace TiendaMultiplaza.API.Services;
public sealed class AuthService(TiendaMultiplazaContext db, IPasswordHasher<Usuario> hasher, IConfiguration config)
{
    // Trabajo equivalente al hash para usuarios inexistentes, sin revelar cuentas.
    private static readonly Usuario Dummy = new() { Run = "dummy" };
    private static readonly string DummyHash = new PasswordHasher<Usuario>().HashPassword(Dummy, "Dummy-account-no-login-71943");

    public async Task<TokenDto> Registrar(RegistroDto dto, CancellationToken ct)
    {
        var run = Reglas.Run(dto.Run);
        Reglas.Clave(dto.Clave);
        if (!Reglas.RutValido(run))
            throw new ReglaException(400, "RUN inválido. Usa el formato 12345678-5 con dígito verificador correcto.");
        if (dto.FechaNacimiento < new DateOnly(1940, 1, 1) || dto.FechaNacimiento > Reglas.Hoy.AddYears(-14))
            throw new ReglaException(400, "La fecha de nacimiento debe ser desde 1940 y la edad mínima es 14 años.");
        if (await db.Usuario.AnyAsync(x => x.Run == run, ct))
            throw new ReglaException(409, "No se puede registrar esa cuenta.");
        var user = new Usuario { Run = run, Nombre = Reglas.Texto(dto.Nombre, "Nombre"), FechaNacimiento = dto.FechaNacimiento, FechaRegistro = Reglas.Hoy, Tipo = 1 };
        user.ClaveAcceso = hasher.HashPassword(user, dto.Clave);
        var access = new Usuario_Acceso { UsuarioRun = run, Usuario = user, ClaveEsHash = true };
        db.Usuario.Add(user);
        db.Usuario_Acceso.Add(access);
        await db.SaveChangesAsync(ct);
        return Token(user, access);
    }
    public async Task<TokenDto> Login(LoginDto dto, CancellationToken ct)
    {
        var run = Reglas.Run(dto.Run);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var access = await db.Usuario_Acceso.FromSqlInterpolated($"SELECT * FROM public.usuario_acceso WHERE usuario_run={run} FOR UPDATE").SingleOrDefaultAsync(ct);
        var user = access is null ? null : await db.Usuario.SingleAsync(x => x.Run == run, ct);
        if (access is null || user is null || !access.Activo || !access.ClaveEsHash || access.BloqueadoHasta > DateTime.UtcNow)
        {
            hasher.VerifyHashedPassword(Dummy, DummyHash, dto.Clave);
            throw new ReglaException(401, "Credenciales inválidas o cuenta temporalmente bloqueada.");
        }
        var verification = hasher.VerifyHashedPassword(user, user.ClaveAcceso, dto.Clave);
        if (verification == PasswordVerificationResult.Failed)
        {
            access.IntentosFallidos++;
            if (access.IntentosFallidos >= 5)
            {
                access.BloqueadoHasta = DateTime.UtcNow.AddMinutes(15);
                access.IntentosFallidos = 0;
            }
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            throw new ReglaException(401, "Credenciales inválidas o cuenta temporalmente bloqueada.");
        }
        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
            user.ClaveAcceso = hasher.HashPassword(user, dto.Clave);
        access.IntentosFallidos = 0;
        access.BloqueadoHasta = null;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Token(user, access);
    }
    public async Task<UsuarioDto> Perfil(string run, CancellationToken ct)
    {
        var access = await db.Usuario_Acceso.AsNoTracking().Include(x => x.Usuario).SingleAsync(x => x.UsuarioRun == run, ct);
        return Map(access.Usuario, access);
    }
    public async Task CambiarClave(string run, ClaveDto dto, CancellationToken ct)
    {
        Reglas.Clave(dto.ClaveNueva);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await DbOperaciones.BloquearUsuario(db, run, ct);
        var user = await db.Usuario.SingleAsync(x => x.Run == run, ct);
        if (hasher.VerifyHashedPassword(user, user.ClaveAcceso, dto.ClaveActual) == PasswordVerificationResult.Failed)
            throw new ReglaException(400, "La clave actual no es correcta.");
        user.ClaveAcceso = hasher.HashPassword(user, dto.ClaveNueva);
        var access = await db.Usuario_Acceso.SingleAsync(x => x.UsuarioRun == run, ct);
        access.VersionToken++;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }
    public async Task CerrarSesiones(string run, CancellationToken ct)
    {
        await db.Usuario_Acceso.Where(x => x.UsuarioRun == run).ExecuteUpdateAsync(s => s.SetProperty(x => x.VersionToken, x => x.VersionToken + 1), ct);
    }

    private TokenDto Token(Usuario user, Usuario_Acceso access)
    {
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(30);
        var claims = new[] { new Claim(JwtRegisteredClaimNames.Sub, user.Run), new Claim("role", access.Rol), new Claim("ver", access.VersionToken.ToString(CultureInfo.InvariantCulture)), new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) };
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!)), SecurityAlgorithms.HmacSha256);
        var jwt = new JwtSecurityToken(config["Jwt:Issuer"], config["Jwt:Audience"], claims, now, expires, credentials);
        return new TokenDto(new JwtSecurityTokenHandler().WriteToken(jwt), expires, Map(user, access));
    }
    public static UsuarioDto Map(Usuario user, Usuario_Acceso access) => new(user.Run, user.Nombre, user.FechaNacimiento, access.Rol, access.Activo);
}
