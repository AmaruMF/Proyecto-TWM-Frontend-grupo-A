using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Npgsql;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

var root = Path.GetFullPath(args.FirstOrDefault() ?? Path.Combine(Environment.CurrentDirectory));
if (!File.Exists(Path.Combine(root, "TiendaMultiplaza.API.csproj"))) throw new Exception("Ejecuta las pruebas desde la raíz de TiendaMultiplaza.API.");
var artifacts = Path.Combine(root, "Tests", ".artifacts");
Directory.CreateDirectory(artifacts);
var config = new ConfigurationBuilder().SetBasePath(root).AddJsonFile("appsettings.json").AddJsonFile("appsettings.Development.json", true).AddUserSecrets("ab0cf829-409d-47c9-b5cd-27cd0e878cca").AddEnvironmentVariables().Build();
var original = new NpgsqlConnectionStringBuilder(config.GetConnectionString("DefaultConnection"));
var name = "multiplaza_test_" + Guid.NewGuid().ToString("N");
var test = new NpgsqlConnectionStringBuilder(original.ConnectionString) { Database = name, Pooling = false };
var jwtKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
const string password = "PruebaSegura-4831-local";
var results = new List<object>();
Process? api = null;
bool created = false;
var logs = new System.Collections.Concurrent.ConcurrentQueue<string>();

void Check(bool condition, string label)
{
    if (!condition)
        throw new Exception(label);
    results.Add(new
    {
        prueba = label,
        resultado = "OK"
    });
    Console.WriteLine("OK " + label);
}
Process Start(string executable, IEnumerable<string> arguments, bool env = false)
{
    var start = new ProcessStartInfo(executable) { WorkingDirectory = root, UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
    foreach (var a in arguments)
        start.ArgumentList.Add(a);
    if (env)
    {
        start.Environment["ConnectionStrings__DefaultConnection"] = test.ConnectionString;
        start.Environment["Jwt__Key"] = jwtKey;
        start.Environment["Bootstrap__Clave"] = password;
        start.Environment["Bootstrap__Run"] = "ADMINLOCAL";
        start.Environment["ASPNETCORE_ENVIRONMENT"] = "Testing";
        start.Environment["Logging__LogLevel__Default"] = "Warning";
    }
    var p = new Process { StartInfo = start };
    p.OutputDataReceived += (_, e) => { if (e.Data != null) logs.Enqueue(e.Data); };
    p.ErrorDataReceived += (_, e) => { if (e.Data != null) logs.Enqueue(e.Data); };
    p.Start();
    p.BeginOutputReadLine();
    p.BeginErrorReadLine();
    return p;
}
async Task Run(string executable, string[] arguments, bool env = false)
{
    using var p = Start(executable, arguments, env);
    await p.WaitForExitAsync();
    if (p.ExitCode != 0)
        throw new Exception($"Falló {executable}: código {p.ExitCode}. Ver integration.log.");
}
async Task Sql(string sql)
{
    await using var c = new NpgsqlConnection(test.ConnectionString);
    await c.OpenAsync();
    await using var cmd = new NpgsqlCommand(sql, c) { CommandTimeout = 120 };
    await cmd.ExecuteNonQueryAsync();
}
async Task<long> Scalar(string sql)
{
    await using var c = new NpgsqlConnection(test.ConnectionString);
    await c.OpenAsync();
    await using var cmd = new NpgsqlCommand(sql, c);
    return Convert.ToInt64(await cmd.ExecuteScalarAsync());
}

try
{
    var appDir = Path.Combine(artifacts, "app");
    await Run("dotnet", ["build", Path.Combine(root, "TiendaMultiplaza.API.csproj"), "-o", appDir, "--nologo"]);
    await using (var c = new NpgsqlConnection(original.ConnectionString))
    {
        await c.OpenAsync();
        await using var cmd = new NpgsqlCommand($"CREATE DATABASE \"{name}\"", c);
        await cmd.ExecuteNonQueryAsync();
        created = true;
    }
    await Sql(await File.ReadAllTextAsync(Path.Combine(root, "Tests", "schema-base.sql")));
    await Sql("INSERT INTO public.usuario(run,nombre,clave_acceso,fecha_nacimiento,fecha_registro,tipo) VALUES ('LEGACY','Cuenta de prueba','Anterior-4821','1990-01-01',CURRENT_DATE,1)");
    var dll = Path.Combine(appDir, "TiendaMultiplaza.API.dll");
    await Run("dotnet", [dll, "--inicializar-db"], true);
    Check(await Scalar("SELECT count(*) FROM public.usuario u JOIN public.usuario_acceso a ON a.usuario_run=u.run WHERE u.run='LEGACY' AND a.clave_es_hash AND length(u.clave_acceso)>20") == 1, "Migración protege la clave anterior con hash");
    await Run("dotnet", [dll, "--inicializar-db"], true);
    Check(await Scalar("SELECT count(*) FROM public.api_migracion") == 1, "Inicialización repetible sin duplicar versión");
    await Sql("INSERT INTO public.empresa(run_empresa,nombre,usuario_id) VALUES ('EMPRESA-TEST','Empresa prueba','ADMINLOCAL'); INSERT INTO public.cotizacion(id_cotizacion,fecha,empresa_id) VALUES (1,CURRENT_DATE,'EMPRESA-TEST');");
    var listener = new TcpListener(IPAddress.Loopback, 0);
    listener.Start();
    var port = ((IPEndPoint)listener.LocalEndpoint).Port;
    listener.Stop();
    api = Start("dotnet", [dll, "--urls", $"http://127.0.0.1:{port}"], true);
    using var http = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}"), Timeout = TimeSpan.FromSeconds(30) };
    for (var i = 0; i < 100; i++)
    {
        try
        {
            if ((await http.GetAsync("/api/salud")).IsSuccessStatusCode)
                break;
        }
        catch (HttpRequestException) { }
        if (api.HasExited)
            throw new Exception("La API no inició.");
        await Task.Delay(100);
    }
    async Task<JsonElement> Request(string method, string path, object? body, int status, string label, string? token = null)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), path);
        if (token != null)
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (body != null)
            request.Content = JsonContent.Create(body);
        using var response = await http.SendAsync(request);
        var text = await response.Content.ReadAsStringAsync();
        if ((int)response.StatusCode != status)
            throw new Exception($"{label}: esperado {status}, recibido {(int)response.StatusCode}: {text[..Math.Min(text.Length, 1200)]}");
        Check(true, label);
        return string.IsNullOrWhiteSpace(text) ? default : JsonSerializer.Deserialize<JsonElement>(text);
    }
    async Task<string> Login(string run, string clave, string label)
    {
        var data = await Request("POST", "/api/auth/login", new
        {
            run,
            clave
        }, 200, label);
        return data.GetProperty("accessToken").GetString()!;
    }
    var legacy = await Login("LEGACY", "Anterior-4821", "La cuenta anterior conserva su acceso después de migrar");
    var admin = await Login("ADMINLOCAL", password, "Login del administrador");
    await Request("GET", "/api/usuarios", null, 401, "Administración requiere autenticación");
    await Request("GET", "/swagger/v1/swagger.json", null, 200, "OpenAPI válido y disponible");
    await Request("POST", "/api/auth/registro", new
    {
        run = "12345678-0",
        nombre = "Cliente",
        fechaNacimiento = "1990-01-01",
        clave = password
    }, 400, "Registro rechaza RUN inválido");
    await Request("POST", "/api/auth/registro", new
    {
        run = "12345678-5",
        nombre = "Cliente",
        fechaNacimiento = "1990-01-01",
        clave = "corta"
    }, 400, "Registro rechaza clave débil");
    await Request("POST", "/api/auth/registro", new
    {
        run = "12345678-5",
        nombre = "Cliente",
        fechaNacimiento = DateTime.UtcNow.ToString("yyyy-MM-dd"),
        clave = password
    }, 400, "Registro rechaza edad menor de 14");
    var registered = await Request("POST", "/api/auth/registro", new
    {
        run = "12.345.678-5",
        nombre = "Cliente Uno",
        fechaNacimiento = "1990-01-01",
        clave = password,
        rol = "Administrador"
    }, 201, "Registro normaliza RUN y crea cliente");
    var client = registered.GetProperty("accessToken").GetString()!;
    Check(registered.GetProperty("usuario").GetProperty("rol").GetString() == "Cliente", "El registro no permite elevar privilegios");
    var second = await Request("POST", "/api/auth/registro", new
    {
        run = "11111111-1",
        nombre = "Cliente Dos",
        fechaNacimiento = "1990-01-01",
        clave = password
    }, 201, "Registro de segundo cliente");
    var client2 = second.GetProperty("accessToken").GetString()!;
    var minorResult = await Request("POST", "/api/auth/registro", new
    {
        run = "22222222-2",
        nombre = "Cliente Menor",
        fechaNacimiento = DateTime.UtcNow.AddYears(-16).ToString("yyyy-MM-dd"),
        clave = password
    }, 201, "Registro de cliente de 16 años");
    var minor = minorResult.GetProperty("accessToken").GetString()!;
    await Request("POST", "/api/auth/registro", new
    {
        run = "12345678-5",
        nombre = "Duplicado",
        fechaNacimiento = "1990-01-01",
        clave = password
    }, 409, "Registro duplicado devuelve conflicto");
    await Request("GET", "/api/usuarios", null, 403, "Cliente no puede administrar usuarios", client);
    var me = await Request("GET", "/api/auth/me", null, 200, "Perfil propio", client);
    Check(!me.TryGetProperty("claveAcceso", out _), "Perfil no expone contraseña ni hash");
    await Request("GET", "/api/auth/me", null, 401, "JWT manipulado es rechazado", client[..^8] + "abcdefgh");
    string InvalidJwt(string issuer, string audience, bool expired)
    {
        var now = DateTime.UtcNow;
        var token = new JwtSecurityToken(issuer, audience, [new Claim("sub", "12345678-5"), new Claim("role", "Cliente"), new Claim("ver", "1")], now.AddHours(-2), expired ? now.AddHours(-1) : now.AddMinutes(10), new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    await Request("GET", "/api/auth/me", null, 401, "JWT expirado es rechazado", InvalidJwt("TiendaMultiplaza.API", "TiendaMultiplaza.Client", true));
    await Request("GET", "/api/auth/me", null, 401, "JWT con emisor distinto es rechazado", InvalidJwt("OtroEmisor", "TiendaMultiplaza.Client", false));
    await Request("GET", "/api/auth/me", null, 401, "JWT con audiencia distinta es rechazado", InvalidJwt("TiendaMultiplaza.API", "OtraAudiencia", false));
    await Request("POST", "/api/categorias", new
    {
        nombre = "Categoría prueba",
        tipo = "Producto"
    }, 403, "Cliente no puede crear categorías", client);
    var category = await Request("POST", "/api/categorias", new
    {
        nombre = "Categoría prueba",
        tipo = "Producto"
    }, 201, "Crear categoría", admin);
    var cid = category.GetProperty("idCategoria").GetInt32();
    await Request("PUT", $"/api/categorias/{cid}", new
    {
        nombre = "Categoría editada",
        tipo = "Producto"
    }, 200, "Editar categoría", admin);
    var temporaryCategory = await Request("POST", "/api/categorias", new
    {
        nombre = "Categoría temporal",
        tipo = "Producto"
    }, 201, "Crear categoría sin relaciones", admin);
    await Request("DELETE", "/api/categorias/" + temporaryCategory.GetProperty("idCategoria").GetInt32(), null, 204, "Eliminar categoría sin relaciones", admin);
    await Request("POST", "/api/categorias", new
    {
        nombre = "Categoría editada",
        tipo = "Producto"
    }, 409, "Categoría duplicada devuelve conflicto", admin);
    object Product(string sku, int stock = 10, int price = 1000, bool restricted = false) => new
    {
        sku,
        nombre = "Producto " + sku,
        marca = "Prueba",
        restriccionEdad = restricted,
        cotizacionId = 1,
        caracteristica = new
        {
            color = "azul"
        },
        stock,
        visible = true,
        vendedorRun = "ADMINLOCAL",
        precio = price,
        categorias = new[] { cid }
    };
    await Request("POST", "/api/productos", Product("PRUEBA-A"), 201, "Crear producto con stock y precio", admin);
    await Request("POST", "/api/productos", Product("PRUEBA-B"), 201, "Crear segundo producto", admin);
    await Request("POST", "/api/productos", Product("PRUEBA-EDAD", restricted: true), 201, "Crear producto con restricción de edad", admin);
    await Request("POST", "/api/productos", Product("PRUEBA-A"), 409, "SKU duplicado devuelve conflicto", admin);
    await Request("PUT", "/api/productos/PRUEBA-A", Product("PRUEBA-A", price: 2000), 200, "Editar catálogo", admin);
    await Request("GET", "/api/productos?pagina=0", null, 400, "Paginación inválida devuelve 400");
    await Request("GET", "/api/productos?pagina=2147483647&tamano=100", null, 400, "Paginación no desborda enteros");
    await Request("GET", "/api/productos/INEXISTENTE", null, 404, "SKU inexistente devuelve 404");
    var listing = await Request("GET", $"/api/productos?categoria={cid}&tamano=2", null, 200, "Filtro y paginación de productos");
    Check(listing.GetProperty("datos").GetArrayLength() == 2 && listing.GetProperty("total").GetInt32() == 3, "Paginación devuelve datos y total correctos");
    await Sql("INSERT INTO public.oferta VALUES(1,10); INSERT INTO public.promociona VALUES('PRUEBA-A',1,CURRENT_DATE-1,CURRENT_DATE+1);");
    var discounted = await Request("GET", "/api/productos/PRUEBA-A", null, 200, "Detalle del producto con oferta");
    Check(discounted.GetProperty("precios")[0].GetProperty("precioFinal").GetInt32() == 1800, "La oferta vigente se aplica al precio");
    await Request("DELETE", $"/api/categorias/{cid}", null, 409, "No elimina categoría usada por productos", admin);
    await Request("PUT", "/api/carrito/items", new
    {
        sku = "PRUEBA-EDAD",
        vendedorRun = "ADMINLOCAL",
        cantidad = 1
    }, 403, "Menor no puede comprar producto restringido", minor);
    await Request("PUT", "/api/carrito/items", new
    {
        sku = "PRUEBA-A",
        vendedorRun = "ADMINLOCAL",
        cantidad = 11
    }, 409, "Carrito rechaza stock insuficiente", client);
    await Request("PUT", "/api/carrito/items", new
    {
        sku = "PRUEBA-A",
        vendedorRun = "ADMINLOCAL",
        cantidad = -1
    }, 400, "Carrito rechaza cantidades negativas", client);
    await Request("PUT", "/api/carrito/items", new
    {
        sku = "PRUEBA-A",
        vendedorRun = "LEGACY",
        cantidad = 1
    }, 400, "Carrito rechaza vendedor sin oferta de venta", client);
    await Request("PUT", "/api/carrito/items", new
    {
        sku = "PRUEBA-A",
        vendedorRun = "ADMINLOCAL",
        cantidad = 2,
        precio = 1
    }, 200, "Agregar producto al carrito", client);
    var cart = await Request("GET", "/api/carrito", null, 200, "Consultar carrito", client);
    Check(cart.GetProperty("subtotal").GetInt64() == 3600 && cart.GetProperty("iva").GetInt64() == 684, "Los importes se calculan en servidor con IVA");
    var otherCart = await Request("GET", "/api/carrito", null, 200, "Carrito de otro usuario", client2);
    Check(otherCart.GetProperty("items").GetArrayLength() == 0, "Los carritos están aislados por usuario");
    await Request("PUT", "/api/carrito/items/PRUEBA-A/cantidad", new
    {
        cantidad = 3
    }, 200, "Modificar cantidad de carrito", client);
    await Request("PUT", "/api/carrito/items/PRUEBA-A/cantidad", new
    {
        cantidad = 2
    }, 200, "Restablecer cantidad de carrito", client);
    var operation = Guid.NewGuid();
    var checkout = new
    {
        claveIdempotencia = operation,
        direccionEntrega = "Calle de Prueba 123, Santiago"
    };
    var order = await Request("POST", "/api/pedidos", checkout, 201, "Confirmar pedido", client);
    var orderId = order.GetProperty("idVenta").GetInt32();
    Check(order.GetProperty("total").GetInt64() == 4284, "Pedido conserva total con oferta e IVA");
    Check(await Scalar($"SELECT precio_original FROM public.incluye WHERE venta_id={orderId} AND producto_id='PRUEBA-A'") == 2000, "Incluye conserva precio antes de descuento");
    await Request("PUT", "/api/productos/PRUEBA-A", Product("PRUEBA-A", stock: 8, price: 3000), 200, "Cambiar precio después de comprar", admin);
    var historic = await Request("GET", $"/api/pedidos/{orderId}", null, 200, "Consultar precio histórico", client);
    Check(historic.GetProperty("items")[0].GetProperty("precioUnitario").GetInt32() == 1800, "Cambiar catálogo no altera el precio comprado");
    Check(await Scalar("SELECT s.cantidad FROM public.stock s JOIN public.producto p ON p.stock_id=s.id_stock WHERE p.sku='PRUEBA-A'") == 8, "Compra descuenta stock exactamente una vez");
    var repeat = await Request("POST", "/api/pedidos", checkout, 201, "Reintento idempotente", client);
    Check(repeat.GetProperty("idVenta").GetInt32() == orderId && await Scalar("SELECT count(*) FROM public.pedido") == 1, "Reintento no duplica venta");
    await Request("POST", "/api/pedidos", new
    {
        claveIdempotencia = operation,
        direccionEntrega = "Otra dirección 456, Santiago"
    }, 409, "Clave idempotente no admite otra dirección", client);
    Check((await Request("GET", "/api/carrito", null, 200, "Carrito tras checkout", client)).GetProperty("items").GetArrayLength() == 0, "Checkout vacía carrito");
    await Request("GET", $"/api/pedidos/{orderId}", null, 404, "No se puede leer el pedido de otra persona", client2);
    await Request("POST", $"/api/pedidos/{orderId}/cancelar", null, 404, "No se puede cancelar el pedido de otra persona", client2);
    await Request("POST", $"/api/pedidos/{orderId}/cancelar", null, 200, "Cancelar pedido pendiente", client);
    await Request("POST", $"/api/pedidos/{orderId}/cancelar", null, 200, "Cancelar nuevamente es idempotente", client);
    Check(await Scalar("SELECT s.cantidad FROM public.stock s JOIN public.producto p ON p.stock_id=s.id_stock WHERE p.sku='PRUEBA-A'") == 10, "Cancelar devuelve stock solo una vez");
    await Request("POST", "/api/pedidos", new
    {
        claveIdempotencia = Guid.NewGuid(),
        direccionEntrega = "Dirección válida 123"
    }, 409, "Carrito vacío no crea pedido", client);

    // Fallo en la segunda línea: la transacción debe revertir también la primera.
    foreach (var sku in new[] { "PRUEBA-A", "PRUEBA-B" })
        await Request("PUT", "/api/carrito/items", new
        {
            sku,
            vendedorRun = "ADMINLOCAL",
            cantidad = 2
        }, 200, "Preparar línea " + sku, client);
    await Request("PUT", "/api/productos/PRUEBA-B/stock", new
    {
        cantidad = 0
    }, 204, "Actualizar stock desde administración", admin);
    var countBefore = await Scalar("SELECT count(*) FROM public.venta");
    await Request("POST", "/api/pedidos", new
    {
        claveIdempotencia = Guid.NewGuid(),
        direccionEntrega = "Dirección válida 123"
    }, 409, "Checkout rechaza un stock que se agotó", client);
    Check(await Scalar("SELECT count(*) FROM public.venta") == countBefore && await Scalar("SELECT s.cantidad FROM public.stock s JOIN public.producto p ON p.stock_id=s.id_stock WHERE p.sku='PRUEBA-A'") == 10, "Fallo revierte venta y descuento de otras líneas");
    await Request("DELETE", "/api/carrito", null, 204, "Vaciar carrito", client);

    await Request("PUT", "/api/carrito/items", new
    {
        sku = "PRUEBA-A",
        vendedorRun = "ADMINLOCAL",
        cantidad = 1
    }, 200, "Preparar prueba de rollback de base", client);
    await Sql("CREATE FUNCTION public.test_fail_pedido() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo inducido solo en base temporal'; END $$; CREATE TRIGGER test_fail BEFORE INSERT ON public.pedido FOR EACH ROW EXECUTE FUNCTION public.test_fail_pedido();");
    var rejected = await Request("POST", "/api/pedidos", new
    {
        claveIdempotencia = Guid.NewGuid(),
        direccionEntrega = "Dirección rollback 123"
    }, 500, "Fallo tardío de base devuelve error controlado", client);
    Check(!rejected.ToString().Contains("Fallo inducido"), "La respuesta no filtra el error interno de PostgreSQL");
    Check(await Scalar("SELECT count(*) FROM public.venta") == countBefore && await Scalar("SELECT s.cantidad FROM public.stock s JOIN public.producto p ON p.stock_id=s.id_stock WHERE p.sku='PRUEBA-A'") == 10, "Rollback revierte escrituras ya enviadas a PostgreSQL");
    await Sql("DROP TRIGGER test_fail ON public.pedido; DROP FUNCTION public.test_fail_pedido();");
    await Request("DELETE", "/api/carrito", null, 204, "Limpiar carrito después de rollback", client);

    // Dos clientes compiten por la última unidad.
    await Request("PUT", "/api/productos/PRUEBA-B/stock", new
    {
        cantidad = 1
    }, 204, "Preparar última unidad", admin);
    foreach (var token in new[] { client, client2 })
        await Request("PUT", "/api/carrito/items", new
        {
            sku = "PRUEBA-B",
            vendedorRun = "ADMINLOCAL",
            cantidad = 1
        }, 200, "Preparar compra concurrente", token);
    async Task<(int Status, JsonElement Body)> Concurrent(string token)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/pedidos") { Content = JsonContent.Create(new { claveIdempotencia = Guid.NewGuid(), direccionEntrega = "Dirección concurrencia 123" }) };
        req.Headers.Authorization = new("Bearer", token);
        using var response = await http.SendAsync(req);
        return ((int)response.StatusCode, JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync()));
    }
    var concurrent = await Task.WhenAll(Concurrent(client), Concurrent(client2));
    Check(concurrent.Count(x => x.Status == 201) == 1 && concurrent.Count(x => x.Status == 409) == 1, "Concurrencia: una sola compra obtiene la última unidad");
    Check(await Scalar("SELECT s.cantidad FROM public.stock s JOIN public.producto p ON p.stock_id=s.id_stock WHERE p.sku='PRUEBA-B'") == 0, "Stock nunca queda negativo");
    var winner = concurrent.Single(x => x.Status == 201).Body.GetProperty("idVenta").GetInt32();
    await Request("PUT", $"/api/pedidos/{winner}/estado", new
    {
        estado = "Entregado"
    }, 409, "No se saltan estados de pedido", admin);
    foreach (var state in new[] { "Confirmado", "EnPreparacion", "Despachado", "Entregado" })
        await Request("PUT", $"/api/pedidos/{winner}/estado", new
        {
            estado = state
        }, 200, "Transición " + state, admin);
    await Request("POST", $"/api/pedidos/{winner}/cancelar", null, 409, "Pedido entregado no se cancela", admin);
    await Request("GET", "/api/pedidos", null, 200, "Historial de compras del cliente", client);
    await Request("GET", "/api/pedidos/administracion", null, 200, "Administración de pedidos", admin);
    await Request("DELETE", "/api/productos/PRUEBA-A", null, 204, "Baja lógica de producto", admin);
    await Request("GET", "/api/productos/PRUEBA-A", null, 404, "Producto oculto no es público");
    await Request("GET", $"/api/pedidos/{orderId}", null, 200, "Historial se conserva al ocultar producto", client);
    await Request("GET", "/api/productos/PRUEBA-A", null, 200, "Administrador puede consultar producto oculto", admin);
    await Request("PUT", "/api/usuarios/me", new
    {
        nombre = "Nombre editado"
    }, 204, "Editar perfil propio", client);
    await Request("PUT", "/api/usuarios/ADMINLOCAL/acceso", new
    {
        rol = "Cliente",
        activo = false
    }, 409, "Administrador no puede desactivarse a sí mismo", admin);
    await Request("PUT", "/api/usuarios/11111111-1/acceso", new
    {
        rol = "Cliente",
        activo = false
    }, 204, "Desactivar usuario", admin);
    await Request("GET", "/api/auth/me", null, 401, "Desactivar revoca tokens vigentes", client2);
    await Request("PUT", "/api/auth/clave", new
    {
        claveActual = password,
        claveNueva = "ClaveNuevaSegura-7831"
    }, 204, "Cambiar contraseña", client);
    await Request("GET", "/api/auth/me", null, 401, "Cambiar contraseña revoca sesión anterior", client);
    client = await Login("12345678-5", "ClaveNuevaSegura-7831", "Login con nueva contraseña");
    await Request("POST", "/api/auth/logout", null, 204, "Cerrar sesiones", client);
    await Request("GET", "/api/auth/me", null, 401, "Logout invalida JWT", client);
    for (var i = 0; i < 5; i++)
        await Request("POST", "/api/auth/login", new
        {
            run = "LEGACY",
            clave = "incorrecta"
        }, 401, "Intento fallido controlado " + (i + 1));
    await Request("POST", "/api/auth/login", new
    {
        run = "LEGACY",
        clave = "Anterior-4821"
    }, 401, "Bloqueo temporal después de cinco intentos");
    Check(await Scalar("SELECT count(*) FROM public.usuario WHERE length(clave_acceso)<=20") == 0, "No quedan claves de texto plano en cuentas de prueba");
    using (var preflight = new HttpRequestMessage(HttpMethod.Options, "/api/carrito"))
    {
        preflight.Headers.Add("Origin", "http://localhost:5173");
        preflight.Headers.Add("Access-Control-Request-Method", "PUT");
        preflight.Headers.Add("Access-Control-Request-Headers", "authorization,content-type");
        using var response = await http.SendAsync(preflight);
        Check(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var allowed) && allowed.Contains("http://localhost:5173"), "CORS permite el frontend local configurado");
    }
    var throttled = false;
    for (var i = 0; i < 35; i++)
    {
        using var response = await http.PostAsJsonAsync("/api/auth/login", new
        {
            run = "NOEXISTE",
            clave = "incorrecta"
        });
        if ((int)response.StatusCode == 429)
        {
            throttled = true;
            break;
        }
    }
    Check(throttled, "La limitación de peticiones protege el login");
    Console.WriteLine($"PRUEBAS COMPLETADAS: {results.Count}");
}
catch (Exception ex) { Console.Error.WriteLine(ex.Message); results.Add(new { prueba = "Ejecución", resultado = "ERROR", detalle = ex.Message }); Environment.ExitCode = 1; }
finally
{
    if (api is not null)
    {
        if (!api.HasExited)
            api.Kill(entireProcessTree: true);
        await api.WaitForExitAsync();
        api.Dispose();
    }
    await File.WriteAllTextAsync(Path.Combine(artifacts, "integration.log"), string.Join(Environment.NewLine, logs));
    await File.WriteAllTextAsync(Path.Combine(artifacts, "results.json"), JsonSerializer.Serialize(results, new JsonSerializerOptions { WriteIndented = true }));
    if (created)
    {
        if (!name.StartsWith("multiplaza_test_") || name == original.Database)
            throw new Exception("Nombre de base de pruebas inválido.");
        NpgsqlConnection.ClearAllPools();
        await using var c = new NpgsqlConnection(original.ConnectionString);
        await c.OpenAsync();
        await using var cmd = new NpgsqlCommand($"DROP DATABASE \"{name}\" WITH (FORCE)", c);
        await cmd.ExecuteNonQueryAsync();
        Console.WriteLine("Base temporal de pruebas eliminada.");
    }
}
