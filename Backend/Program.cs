using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TiendaMultiplaza.API.Data;
using TiendaMultiplaza.API.Models;
using TiendaMultiplaza.API.Services;

var builder = WebApplication.CreateBuilder(args);
var connection = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Configura ConnectionStrings:DefaultConnection.");
builder.Services.AddDbContext<TiendaMultiplazaContext>(o => o.UseNpgsql(connection));
builder.Services.AddScoped<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UsuariosService>();
builder.Services.AddScoped<CatalogoService>();
builder.Services.AddScoped<CarritoService>();
builder.Services.AddScoped<PedidosService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddExceptionHandler<ErroresApi>();
builder.Services.AddProblemDetails();
builder.Services.AddSwaggerGen(o =>
{
    o.SwaggerDoc("v1", new OpenApiInfo { Title = "Tienda Multiplaza API", Version = "v1", Description = "Catálogo, acceso, carrito y pedidos. Precios netos CLP; IVA calculado al confirmar. DELETE producto realiza una baja lógica. Confirmado registra una verificación manual de pago; no cobra dinero." });
    o.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", Description = "Pega el accessToken obtenido en /api/auth/login." });
    o.AddSecurityRequirement(new OpenApiSecurityRequirement { { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() } });
});
var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
builder.Services.AddCors(o => o.AddDefaultPolicy(p => { if (origins.Length > 0) p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod(); }));
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = 429;
    o.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "local", _ => new FixedWindowRateLimiterOptions { PermitLimit = 30, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
var key = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(key) || Encoding.UTF8.GetByteCount(key) < 32) throw new InvalidOperationException("Configura Jwt:Key con al menos 32 bytes aleatorios en secretos o variables de entorno.");
var issuer = builder.Configuration["Jwt:Issuer"] ?? "TiendaMultiplaza.API";
var audience = builder.Configuration["Jwt:Audience"] ?? "TiendaMultiplaza.Client";
builder.Configuration["Jwt:Issuer"] = issuer;
builder.Configuration["Jwt:Audience"] = audience;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.MapInboundClaims = false;
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
        ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
        ClockSkew = TimeSpan.FromSeconds(30),
        NameClaimType = "sub",
        RoleClaimType = "role"
    };
    o.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var run = context.Principal?.FindFirstValue("sub");
            var version = context.Principal?.FindFirstValue("ver");
            var db = context.HttpContext.RequestServices.GetRequiredService<TiendaMultiplazaContext>();
            var access = await db.Usuario_Acceso.AsNoTracking().SingleOrDefaultAsync(x => x.UsuarioRun == run, context.HttpContext.RequestAborted);
            if (access is null || !access.Activo || !int.TryParse(version, out var number) || access.VersionToken != number || access.Rol != context.Principal?.FindFirstValue("role"))
                context.Fail("Sesión revocada.");
        }
    };
});
builder.Services.AddAuthorization();
var app = builder.Build();
if (args.Contains("--inicializar-db"))
{
    await using var scope = app.Services.CreateAsyncScope();
    await InicializarBase.Ejecutar(scope.ServiceProvider, app.Environment.ContentRootPath);
    return;
}
app.UseExceptionHandler();
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing")) { app.UseSwagger(); app.UseSwaggerUI(); }
if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing")) app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/api/salud", async (TiendaMultiplazaContext db, CancellationToken ct) => await db.Database.CanConnectAsync(ct) ? Results.Ok(new { estado = "Disponible" }) : Results.Problem(statusCode: 503, title: "Base de datos no disponible")).AllowAnonymous();
if (app.Environment.IsDevelopment()) app.MapGet("/api/prueba-db", async (TiendaMultiplazaContext db, CancellationToken ct) => await db.Database.CanConnectAsync(ct) ? Results.Ok(new { mensaje = "Conexión a PostgreSQL exitosa" }) : Results.Problem(statusCode: 503)).AllowAnonymous();
app.MapControllers();
app.Run();
public partial class Program
{
}
