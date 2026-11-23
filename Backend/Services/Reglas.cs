using System.Security.Claims;

namespace TiendaMultiplaza.API.Services;
public sealed class ReglaException(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}
public static class Reglas
{
    public static DateOnly Hoy => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "America/Santiago"));
    public static string Run(string value) => value.Trim().Replace(".", "").ToUpperInvariant();
    public static bool RutValido(string value)
    {
        var parts = Run(value).Split('-');
        if (parts.Length != 2 || parts[0].Length is < 7 or > 8 || !parts[0].All(char.IsAsciiDigit) || parts[0].All(c => c == '0'))
            return false;
        var sum = 0;
        var factor = 2;
        for (var i = parts[0].Length - 1; i >= 0; i--)
        {
            sum += (parts[0][i] - '0') * factor;
            factor = factor == 7 ? 2 : factor + 1;
        }
        var dv = 11 - sum % 11;
        var expected = dv == 11 ? "0" : dv == 10 ? "K" : dv.ToString();
        return parts[1] == expected;
    }
    public static string Texto(string value, string field) => string.IsNullOrWhiteSpace(value) ? throw new ReglaException(400, $"{field} es obligatorio.") : value.Trim();
    public static void Clave(string value)
    {
        if (value.Length is < 12 or > 128 || !value.Any(char.IsLetter) || !value.Any(char.IsDigit))
            throw new ReglaException(400, "La clave debe tener de 12 a 128 caracteres, letras y números.");
    }
    public static int Offset(int pagina, int tamano)
    {
        if (pagina < 1 || tamano is < 1 or > 100 || ((long)pagina - 1) * tamano > int.MaxValue)
            throw new ReglaException(400, "Paginación inválida: página desde 1 y tamaño entre 1 y 100.");
        return (pagina - 1) * tamano;
    }
    public static string Usuario(this ClaimsPrincipal user) => user.FindFirstValue("sub") ?? throw new ReglaException(401, "Inicia sesión.");
}
