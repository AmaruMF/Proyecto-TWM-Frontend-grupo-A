# Tienda Multiplaza API

Backend ASP.NET Core 8 y PostgreSQL que completa el recorrido de la guía de render2web: catálogo, usuarios, JWT, carrito, pedidos, inventario, historial y Swagger. Conserva los modelos y nombres de la base existente.

## Iniciar en este equipo

La configuración y la ampliación de la base ya están instaladas. Desde esta carpeta:

```powershell
dotnet run --launch-profile http
```

Swagger: <http://localhost:5079/swagger>. Salud: <http://localhost:5079/api/salud>.

La cuenta inicial de administración es `ADMINLOCAL`. Su clave aleatoria está en el archivo de acceso local entregado con este trabajo, fuera del código. En Swagger:

1. Ejecutar `POST /api/auth/login` con `run` y `clave`.
2. Copiar `accessToken`.
3. Pulsar **Authorize** y pegar solamente el token.
4. Probar los endpoints. El token dura 30 minutos; se puede volver a iniciar sesión.

`PUT /api/auth/clave` cambia la clave e invalida las sesiones anteriores. `POST /api/auth/logout` también invalida todos los tokens del usuario.

## Configuración en otro equipo

Requiere SDK .NET 8 y PostgreSQL compatible con el esquema existente. Las versiones de paquetes están fijadas en el `.csproj`.

```powershell
dotnet restore
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=TU_BASE;Username=TU_USUARIO;Password=TU_CLAVE"
dotnet build
pwsh -File Scripts/Preparar-Local.ps1
dotnet run --launch-profile http
```

`Preparar-Local.ps1` crea una clave JWT aleatoria y una clave inicial de administrador, las guarda en User Secrets e inicializa la base. Por defecto escribe el acceso inicial en `.local/Acceso-local.txt`, excluido de Git. No restablece contraseñas de cuentas ya creadas.

La conexión también puede configurarse mediante `ConnectionStrings__DefaultConnection`. Para ejecución fuera de Development deben proporcionarse `Jwt__Key`, `Jwt__Issuer` y `Jwt__Audience` mediante configuración segura. El script local está pensado para User Secrets en Windows y PowerShell 7.

El proyecto usa una base existente. No ejecutar `EnsureCreated`, `InitialCreate` ni el script original con `DROP TABLE ... CASCADE` sobre los datos actuales. `Database/001_backend.sql` es una ampliación controlada que ejecuta `InicializarBase`; no debe aplicarse por separado, porque la inicialización también protege las contraseñas y registra la versión.

Una instalación vacía de demostración puede utilizar `Tests/schema-base.sql` para crear las tablas originales, antes de inicializar. Ese archivo contiene solo estructura; no contiene los datos de negocio. Para crear productos se necesitan cotizaciones y vendedores válidos, según las relaciones del modelo original.

## Qué se añadió a la base

- `usuario_acceso`: rol, activación, bloqueo temporal e invalidación de sesiones.
- `carrito` y `carrito_detalle`: carrito persistente por usuario.
- `pedido` y `pedido_detalle`: estado, dirección, idempotencia e instantánea de cada artículo comprado.
- `api_migracion`: control de la ampliación aplicada.
- Secuencias `api_categoria_id`, `api_stock_id`, `api_venta_id`, inicializadas por encima de los ID existentes.
- `usuario.clave_acceso` admite 512 caracteres para almacenar hashes de ASP.NET Core Identity PasswordHasher.

La inicialización transforma las claves existentes en hashes sin cambiar lo que el usuario escribe al iniciar sesión. Todas las cuentas anteriores reciben acceso `Cliente`; no se infieren privilegios administrativos de `Usuario.Tipo`, cuyo significado de negocio se conserva. La cuenta nueva `ADMINLOCAL` tiene rol `Administrador` en `usuario_acceso`.

La inicialización es transaccional y se puede repetir. Comprueba que no haya triggers de negocio sobre las tablas involucradas para evitar duplicar cálculos de stock. La base inspeccionada tenía dos funciones de descuento y ningún trigger de negocio. Los cuatro scripts SQL entregados originalmente siguen siendo archivos independientes y no se reinstalaron.

## Rutas

| Operación | Acceso | Función |
| --- | --- | --- |
| `POST /api/auth/registro` | Público | Registrar cliente con RUN válido y edad desde 14 años |
| `POST /api/auth/login` | Público | Obtener JWT |
| `GET /api/auth/me` | Usuario | Consultar perfil propio |
| `PUT /api/auth/clave` | Usuario | Cambiar contraseña y revocar sesiones |
| `POST /api/auth/logout` | Usuario | Revocar sesiones |
| `GET /api/productos` | Público | Listar con página, tamaño, búsqueda y categoría |
| `GET /api/productos/{sku}` | Público | Ver detalle, categorías y precios por vendedor |
| `POST /api/productos` | Administrador | Crear producto, stock y precio |
| `PUT /api/productos/{sku}` | Administrador | Editar producto y precio del vendedor indicado |
| `DELETE /api/productos/{sku}` | Administrador | Ocultar producto conservando su historial |
| `PUT /api/productos/{sku}/stock` | Administrador | Ajustar cantidad disponible |
| `GET /api/categorias` | Público | Listar categorías |
| `GET /api/categorias/{id}` | Público | Consultar categoría |
| `POST /api/categorias` | Administrador | Crear categoría |
| `PUT /api/categorias/{id}` | Administrador | Editar categoría |
| `DELETE /api/categorias/{id}` | Administrador | Eliminar si no tiene referencias |
| `GET /api/carrito` | Usuario | Carrito propio e importes actuales |
| `PUT /api/carrito/items` | Usuario | Añadir o reemplazar una línea |
| `PUT /api/carrito/items/{sku}/cantidad` | Usuario | Cambiar cantidad |
| `DELETE /api/carrito/items/{sku}` | Usuario | Quitar línea |
| `DELETE /api/carrito` | Usuario | Vaciar carrito |
| `POST /api/pedidos` | Usuario | Confirmar carrito en una transacción |
| `GET /api/pedidos` | Usuario | Historial propio, incluidas ventas anteriores |
| `GET /api/pedidos/{id}` | Propietario o administrador | Detalle |
| `POST /api/pedidos/{id}/cancelar` | Propietario o administrador | Cancelar pendiente y devolver stock |
| `GET /api/pedidos/administracion` | Administrador | Historial general |
| `PUT /api/pedidos/{id}/estado` | Administrador | Avanzar estado |
| `GET /api/usuarios` | Administrador | Listar usuarios sin contraseñas |
| `PUT /api/usuarios/me` | Usuario | Cambiar nombre propio |
| `PUT /api/usuarios/{run}/acceso` | Administrador | Cambiar rol o activación |
| `GET /api/referencias/cotizaciones` | Administrador | Obtener cotizaciones válidas para crear productos |
| `GET /api/referencias/vendedores` | Administrador | Obtener usuarios activos para asociar precios |

`GET /api/productos` devuelve `{ datos, pagina, tamano, total }`; la versión inicial devolvía un arreglo. El consumidor debe leer `datos`. El detalle ahora incluye `precios` y `categorias`. El archivo `TiendaMultiplaza.API.http` contiene ejemplos.

## Reglas aplicadas

- Moneda de trabajo: CLP enteros. `Vende.Precio` se interpreta como precio neto. Se aplica la mayor oferta vigente, sin acumular descuentos; el resultado unitario se redondea al entero más cercano.
- IVA: 19 % del subtotal neto, truncado a entero para respetar el CHECK original de `Venta_Datos`. Total = neto + IVA. No se pretende emitir documentación tributaria.
- El servidor calcula precios e importes. El cliente envía SKU, vendedor, cantidad y dirección; no decide el total.
- El carrito admite hasta 100 productos, cantidades de 1 a 1000 y un vendedor por SKU. Los productos restringidos requieren 18 años.
- Agregar al carrito no reserva stock. El checkout vuelve a comprobar la disponibilidad, bloquea filas y descuenta stock dentro de la transacción.
- El checkout guarda `Venta`, `Venta_Datos`, `Compra`, `Incluye`, `Pedido` y `Pedido_Detalle`, y vacía el carrito. Ante un fallo, se revierten todas las escrituras.
- `claveIdempotencia` es un UUID generado una vez por operación. Reutilizarlo al reintentar devuelve el mismo pedido. Para una compra nueva debe utilizarse otro UUID.
- Los nombres y precios de los artículos comprados quedan almacenados en `Pedido_Detalle`; cambios posteriores del catálogo no alteran el historial.
- Estados: `Pendiente → Confirmado → EnPreparacion → Despachado → Entregado`. Un pedido `Pendiente` también puede pasar a `Cancelado`, devolviendo stock una sola vez.
- `Confirmado` registra una verificación manual de pago por administración y marca `Venta.Pagada`. No se conecta a una pasarela, no cobra tarjetas y no genera transferencias bancarias. `CodigoTransferencia` se utiliza como referencia interna de la venta nueva.
- Las ventas anteriores se muestran como `Historico`; sus importes de cabecera se conservan. Cuando no existen precios de línea históricos se muestran como cero, sin inventar el precio comprado. No se les aplican las transiciones de los pedidos nuevos.
- Las bajas de producto son lógicas. Las categorías referenciadas no se eliminan; renombrar una categoría usada como clave en `Subdivide` también puede producir conflicto de referencia.
- Los roles de acceso son `Cliente` y `Administrador`. Registro público siempre crea `Cliente`. No es posible desactivar o degradar la propia cuenta desde administración.
- JWT valida firma, emisor, audiencia, caducidad y versión de sesión. Cambiar contraseña, rol, activación o cerrar sesión revoca los tokens correspondientes.
- Cinco intentos de contraseña fallidos bloquean la cuenta durante 15 minutos. Login y registro tienen un límite adicional de 30 solicitudes por minuto y dirección IP.
- CORS permite los orígenes locales configurados en `appsettings.json`. La API usa servicios y DTOs; no devuelve entidades con claves ni grafos de navegación.

## Pruebas reproducibles

```powershell
dotnet run --project Tests/Backend.Integration.csproj
```

El ejecutor crea una base PostgreSQL temporal con nombre aleatorio, instala solo estructura y datos sintéticos, inicia una instancia aislada de la API y ejecuta las comprobaciones HTTP. Al finalizar detiene esa instancia y elimina únicamente la base temporal creada por esa ejecución. La conexión configurada debe tener permiso para crear bases de prueba.

Los resultados se guardan en `Tests/.artifacts/results.json`; el log está en `integration.log`. Las pruebas cubren CRUD, registro y JWT, autorización, ofertas e IVA, aislamiento entre usuarios, stock, concurrencia por la última unidad, reversión de un fallo después de enviar escrituras a PostgreSQL, idempotencia, estados, cancelación, revocación de sesiones, CORS y límite de peticiones.

## Estructura

`Controllers` recibe solicitudes y aplica autorización; `Services` implementa reglas y transacciones; `DTOs` define entradas y respuestas; `Data` contiene el contexto; `Models` conserva las entidades originales y las ampliaciones; `Database` contiene la ampliación versionada; `Scripts` contiene la preparación local; `Tests` verifica el flujo completo.

Se usa DbContext directamente desde servicios, como permite la guía. No se añadió un repositorio genérico que duplicara EF Core. No regenerar los modelos con `--force` sobre el avance actual. Para una regeneración de revisión, usar `--no-pluralize` y comparar los resultados en una carpeta separada.

## Alcance de la entrega

Backend local ejecutable y probado para el recorrido de la guía. No incluye una interfaz de tienda nueva, despliegue público, pasarela de pagos, correo de recuperación, facturación electrónica ni una reimplementación completa de las reglas adicionales de los scripts académicos. Las diferencias entre la base actual y esos scripts se mantienen documentadas en la revisión anterior.

Fuentes: [guía de render2web](https://render2web.com/net/como-crear-un-backend-completo-para-una-tienda-online-con-net/), [JWT en ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication?view=aspnetcore-8.0), [transacciones en EF Core](https://learn.microsoft.com/en-us/ef/core/saving/transactions).
