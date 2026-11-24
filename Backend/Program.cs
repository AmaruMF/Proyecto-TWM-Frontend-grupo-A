using Backend_GrupoA.Data;
using Backend_GrupoA.Repositories;
using Backend_GrupoA.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using System.Threading.RateLimiting;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddSingleton<NpgsqlDataSource>(_ =>
{
    var connection = new NpgsqlConnectionStringBuilder
    {
        Host = builder.Configuration["Postgres:Host"],
        Port = builder.Configuration.GetValue<int>("Postgres:Port", 5432),
        Database = builder.Configuration["Postgres:Database"],
        Username = builder.Configuration["Postgres:Username"],
        Password = builder.Configuration["Postgres:Password"],
        Timeout = 5,
        CommandTimeout = 10
    };
    return NpgsqlDataSource.Create(connection.ConnectionString);
});
builder.Services.AddControllers();
builder.Services.AddDbContext<MultiplazaDbContext>((sp, options) => options.UseNpgsql(sp.GetRequiredService<NpgsqlDataSource>(), postgres => postgres.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));
builder.Services.AddScoped<CatalogRepository>();
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<StoreRepository>();
builder.Services.AddScoped<CommerceService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<IPasswordHasher<string>, PasswordHasher<string>>();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options => {
    options.Cookie.Name = "multiplaza.auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = 401; return Task.CompletedTask; };
    options.Events.OnRedirectToAccessDenied = context => { context.Response.StatusCode = 403; return Task.CompletedTask; };
});
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options => {
    options.RejectionStatusCode = 429;
    options.AddPolicy("login", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "local",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
var app = builder.Build();
if (args.Contains("--bootstrap-admin")) { await AdminBootstrap.Run(app.Services, app.Environment.ContentRootPath); return; }
app.UseExceptionHandler();
app.Use(async (context,next)=>{
 try { await next(); }
 catch(StoreException ex) { context.Response.StatusCode=ex.Status; await context.Response.WriteAsJsonAsync(new {title=ex.Message,status=ex.Status}); }
 catch(PostgresException ex) when(ex.SqlState is "23505" or "23503" or "23514") {
  context.Response.StatusCode=409; await context.Response.WriteAsJsonAsync(new { title="Los datos ya existen o no cumplen las relaciones requeridas. Revisa el formulario.",status=409 });
 }
});
// Las escrituras del navegador requieren un encabezado que un formulario externo
// no puede enviar. No se habilita CORS: React utiliza el proxy del mismo origen.
app.Use(async (context, next) => {
    if (context.Request.Path.StartsWithSegments("/api") &&
        !HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method) &&
        context.Request.Headers["X-Multiplaza-Request"] != "1") {
        context.Response.StatusCode = 403;
        await context.Response.WriteAsJsonAsync(new { title = "Solicitud no permitida." });
        return;
    }
    await next();
});
app.UseRateLimiter();
app.UseAuthentication();
app.Use(async (context,next)=>{
 if(context.User.Identity?.IsAuthenticated==true) {
  var id=context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
  var accounts=context.RequestServices.GetRequiredService<AccountService>();
  if(id==null || await accounts.Profile(id,context.RequestAborted)==null) {
   context.Response.StatusCode=401; return;
  }
 }
 await next();
});
app.UseAuthorization();
app.MapControllers();
// Diagnóstico local. No crea tablas ni ejecuta los scripts SQL.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options => {
        options.SwaggerEndpoint("/openapi/v1.json", "Multiplaza API v1");
        options.UseRequestInterceptor("(request) => { request.headers['X-Multiplaza-Request'] = '1'; return request; }");
    });
    app.MapGet("/api/diagnostico/base-datos", async (NpgsqlDataSource source,
        IConfiguration configuration, CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrEmpty(configuration["Postgres:Password"]))
            return Results.Problem(statusCode: 503, title: "Falta configurar la contraseña local de PostgreSQL.");
        try
        {
            await using var connection = await source.OpenConnectionAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name";
            var tables = new List<string>();
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken)) tables.Add(reader.GetString(0));
            return Results.Ok(new { connected = true, database = connection.Database, tables });
        }
        catch (NpgsqlException)
        {
            return Results.Problem(statusCode: 503, title: "No se pudo acceder a PostgreSQL. Revisa credenciales, base de datos y permisos de conexión.");
        }
    });
}
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.Run();





