# Backend Grupo A

ASP.NET Core 10 + EF Core/Npgsql. Base: `SQL-GrupoA`, host `192.168.0.22`, puerto
`5432`, usuario configurado `postgres`. Contraseña en User Secrets (`Postgres:Password`).

Consultar `../README.md` para instalación, alcance y pruebas.

## Endpoints principales

- `GET /api/productos`, `GET /api/productos/{sku}`: catálogo y detalle.
- `POST /api/productos`, `PUT /api/productos/{sku}`, `DELETE /api/productos/{sku}`: gestión propia; eliminación lógica.
- `GET /api/servicios`, `GET /api/categorias`: consulta pública.
- `POST /api/categorias`: administrador.
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- `PUT /api/cuenta`, `PUT /api/cuenta/password`, `POST /api/empresas`.
- `GET /api/inventario`, `PUT /api/inventario/{sku}/stock`: autorización y control optimista del stock.
- `GET /api/carrito`, `POST/PUT/DELETE /api/carrito/{sku}`.
- `POST /api/pedidos`: confirma el carrito de una empresa; requiere RequestId UUID reutilizable en reintentos.
- `GET /api/pedidos/nuevos?sales=false`: pedidos propios nuevos; `sales=true` para ventas propias.
- `PUT /api/pedidos/{id}/estado`: vendedor, transiciones consecutivas.
- `GET /api/pedidos`: historial anterior, paginado.
- `GET /api/admin/usuarios`, `PUT /api/admin/usuarios/{id}/estado`: administrador.
- `GET /api/diagnostico/base-datos`: diagnóstico solo Development.
- `GET /api/health`: vida del proceso; no valida la base.

Swagger: `/swagger/index.html`; especificación: `/openapi/v1.json`, solo Development.
Swagger agrega automáticamente `X-Multiplaza-Request: 1` para probar escrituras.
Usar login antes de probar endpoints privados. Las cookies son HttpOnly y del
mismo origen; Vite dirige `/api` al backend sin habilitar CORS abierto.

`dotnet run -- --bootstrap-admin` crea una cuenta local una sola vez, con clave
aleatoria guardada en `../.local/Acceso-administrador.txt`. No cambia una cuenta
existente ni imprime su contraseña. La cuenta ya fue creada en esta instalación.
