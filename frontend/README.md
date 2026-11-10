# Multiplaza

Frontend de la tienda, implementado con React, Material UI y Vite a partir del [prototipo de Figma](https://www.figma.com/design/g7mG5IC0YmOLKuEbU8UFC9/Prototipo-Tienda-Ecommerce?node-id=0-1).

La descripción general del proyecto y la tabla de funciones RF-01 a RF-32 están en el [README principal](../README.md). Este documento detalla la ejecución y la organización del frontend.

La paleta usa `#FFF8F0` como fondo principal, blanco en las tarjetas y paneles, `#A5B3DF` en sus bordes y elementos secundarios, `#FF8400` en la barra superior, botones y ofertas y `#0B0829` en textos e iconos sobre fondos claros. Los botones secundarios tienen borde naranja y un fondo claro que se intensifica al pasar el cursor. La distribución y los recursos gráficos originales se conservan. El tema está en `src/theme/appTheme.js` y los recursos en `public/assets/figma/`.

## Ejecutar

Requiere Node.js 22.12 o posterior.

Desde la raíz del repositorio:

```powershell
cd frontend
npm install
npm run dev
```

Abrir la dirección que muestre Vite, normalmente `http://localhost:5173`.

Si la terminal ya está dentro de `frontend/`, omitir `cd frontend`. `npm install` se necesita en la primera ejecución y cuando cambien las dependencias. Para las siguientes ejecuciones basta con `npm run dev`. Mantener la terminal abierta y presionar **Ctrl+C** para detener el servidor. Esta versión funciona sin iniciar el backend ni una base de datos.

En **Iniciar sesión** se ingresa el correo o RUN y la contraseña. Las cuentas iniciales de prueba están definidas en `src/data/accounts.json`:

| Correo | Perfil inicial | Contraseña inicial |
| --- | --- | --- |
| `cjesus@gmail.com` | Vendedor de Multiplaza | `Multiplaza2026!` |
| `milla@gmail.com` | Cliente | `Multiplaza2026!` |

Las contraseñas se pueden cambiar desde el perfil y se conservan localmente mediante bcrypt (coste 12) con salt propio por contraseña; las credenciales PBKDF2 anteriores se migran después de un acceso correcto. No hay botones de acceso directo ni cuentas de demostración expuestas en el login. El vendedor puede cambiar a la vista de cliente desde **Mi cuenta**; un cliente mayor de edad puede registrar su empresa para habilitar su vista de vendedor.

```powershell
npm run lint
npm test
npm run build
npm run preview
```

## Alcance

Esta entrega implementa los flujos de frontend con datos de ejemplo. La autenticación, los mensajes, las cotizaciones, las devoluciones y los pagos no están conectados a servicios reales. El backend existente continúa siendo la plantilla inicial de ASP.NET.

Los cambios se conservan como JSON en `localStorage`, bajo `multiplaza.data` (versión 3). Cada cuenta tiene su perfil, direcciones con identificadores estables, teléfonos, carrito y listas propios. Las publicaciones, ventas, ofertas y conversaciones se vinculan a la empresa mediante su identificador. La sesión y los resúmenes de compra por cuenta usan `sessionStorage`; **Mantener sesión activa** conserva la sesión también en `localStorage`. No se almacena la contraseña en texto plano, el número completo de tarjeta ni el CVV. El pago sigue identificado expresamente como una simulación.

La primera carga de datos antiguos de versión 1 conserva una copia en `multiplaza.backup.v1`, migra el catálogo y las operaciones, y crea las dos identidades iniciales. Los datos personales antiguos quedan en esa copia; las operaciones de cliente se asignan a la cuenta inicial de Millaray. Los productos HP y los servicios iniciales quedan asociados a la empresa de `cjesus`; las otras tiendas del catálogo conservan identidades independientes. Cada vendedor gestiona el catálogo completo de su empresa.

Una compra incluye productos de un solo vendedor. Los de otros vendedores permanecen en el carrito. La simulación registra el pedido y la transacción y descuenta el stock. Los precios ya incluyen IVA: el neto se obtiene dividiendo por 1,19; el IVA es la diferencia y el envío se agrega al final. Las ofertas se aplican únicamente durante su vigencia, según la fecha de Chile.

Productos con varias variantes tienen selectores de atributos (color, talla, modelo u otros atributos JSON); cada variante conserva SKU, precio y stock independientes. Una sola variante muestra únicamente cantidad y stock. El mouse inicial incluye dos variantes y el notebook HP una. El editor permite agregar variantes y el inventario muestra cada SKU de la empresa, sin excluir publicaciones por falta de un SKU antiguo.

Desde **Mi cuenta** se editan los datos personales, teléfonos y direcciones, manteniendo al menos uno de cada. El RUN personal es inmutable. **Editar empresa** permite cambiar los datos comerciales, el tipo de oferta (Producto/Servicio/Ambos), la tienda física y las tarifas. Una tarifa de comuna tiene prioridad sobre una regional; en ausencia de coincidencia se usa la tarifa general. Checkout permite seleccionar una dirección guardada y recalcula la tarifa del vendedor.

Las ofertas incluyen productos y servicios. Los descuentos iniciales tienen fechas explícitas del 1 al 30 de noviembre de 2026; después se muestra el precio oficial. Los servicios requieren SKU, nombre, categoría, precio, duración en minutos, descripción y restricción de edad. La edad se valida al adquirir artículos restringidos, solicitar servicios y aceptar su cotización.

En **Historial de ventas**, el vendedor registra transporte y seguimiento y avanza al siguiente estado. El sistema distingue despacho, retiro y prestación de servicios, y conserva el historial de cambios. Las reseñas de producto, servicio y vendedor requieren una adquisición propia finalizada y solo permiten una reseña por destinatario. Las preguntas son públicas y únicamente la empresa de la publicación puede responderlas.

La mensajería guarda autor, empresa, cliente, contexto y hora; cada vista muestra únicamente las conversaciones de su identidad y empresa. No envía notificaciones ni genera respuestas automáticas. Las imágenes nuevas de publicaciones pueden cargarse como PNG, JPG o WebP de hasta 1 MB. Las publicaciones sin imagen muestran un estado explícito. Se mantienen los recursos visuales, el tema y la iconografía originales.

## Organización

```text
public/
  LogoAzulOscuro.svg
  assets/figma/              Recursos originales utilizados
src/
  components/
    catalog/                Tarjetas, grilla y solicitud de cotización
    checkout/               Resumen de importes
    common/                 Marca, iconos, paneles, estados y encabezados
    forms/                  Dirección reutilizable
    layout/                 Cabecera y navegación adaptables
    orders/                 Tarjeta de pedido
    crud/                   Gestión de clientes existente
  context/                  Estado y acciones compartidas
  data/                     Catálogo y datos de ejemplo
  hooks/                    Acceso al estado y navegación por URL
  pages/
    account/                Registro, perfil, listas, cotizaciones y mensajes
    checkout/               Carrito, despacho y pago de ejemplo
    orders/                 Pedidos, seguimiento, postventa e historial
    seller/                 Inventario, publicaciones y ofertas
    storefront/             Inicio público/cliente/vendedor, catálogo y detalle
  theme/                    Tema y paleta existente
  utils/                    Totales, stock, compra y vigencia de ofertas
tests/                      Reglas de compra y dinero con node:test
```

## Pantallas y rutas

Las rutas utilizan `#/` para poder abrirse directamente sin configurar redirecciones en el servidor.

| Pantallas del prototipo | Ruta |
| --- | --- |
| Inicio público, inicio cliente e inicio vendedor | `#/` y `#/inicio` |
| Inicio de sesión | `#/acceso` |
| Registro de cuenta | `#/registro` |
| Registro de empresa | `#/registro-empresa` |
| Perfil de cliente y perfil de vendedor | `#/cuenta`, según la vista activa |
| Catálogo, servicios, ofertas y búsqueda | `#/productos`, `#/servicios`, `#/ofertas`, `#/buscar/HP` |
| Detalle de producto | `#/producto/hp-victus` |
| Detalle de servicio y solicitar cotización | `#/servicio/jardineria` |
| Carrito | `#/carrito` |
| Resumen, despacho y medio de pago (rq 13/14) | `#/resumen` |
| Pago (rq 24) | `#/pago` |
| Mis pedidos | `#/pedidos` |
| Seguimiento de despacho | `#/seguimiento/10541` |
| Postventa | `#/postventa/10678` |
| Devoluciones y reembolsos, ambas variantes | `#/devoluciones`, pestañas de solicitudes y pedidos entregados |
| Historial de transacciones | `#/transacciones` |
| Lista de deseos | `#/deseos` |
| Mensajería antes y después de la venta | `#/mensajes`; conversaciones separadas por vendedor y contexto |
| Cotizaciones del cliente | `#/cotizaciones` |
| Cotizaciones de clientes para el vendedor | `#/gestion` |
| Inventario (rq 17) | `#/inventario` |
| Datos de producto | `#/nuevo-producto` y `#/editar-producto/hp-victus` |
| Datos de servicio | `#/nuevo-servicio` y `#/editar-servicio/jardineria` |
| Oferta | `#/oferta` |
| Gestión de publicaciones y servicios | `#/publicaciones`, `#/servicios-vendedor` |
| Gestión de clientes existente | `#/clientes` |

Para revisar pago se debe seleccionar primero un vendedor en el carrito. Las rutas de cuenta solicitan iniciar la sesión de ejemplo si todavía no existe.

## Verificación

Las pruebas de `npm test` verifican cuentas y permisos, perfiles y contactos, separación por empresa, estados, mensajes, reseñas verificadas, edad, variantes, cantidades y stock, compra y desglose financiero, tarifas y vigencia de ofertas. La revisión en navegador cubre acceso de ambas cuentas, compra con dos variantes, pregunta/respuesta pública, estados con transporte obligatorio, edición comercial persistente y pantallas móviles de 390 px.

**Eliminar cuenta** afecta únicamente a la cuenta activa; conserva el historial comercial anonimizado y no reinicia las otras cuentas. Para reiniciar deliberadamente toda la simulación, borrar las claves `multiplaza.*` del almacenamiento del navegador y recargar. Esto también restablece las contraseñas iniciales.

La siguiente ampliación cubre RF-21 a RF-32:

- Categorías: árbol de 48 nodos con identificadores y relaciones padre-hija, tomado de la página 4 impresa (página 6 del PDF) del enunciado. El editor selecciona categorías concretas; un filtro padre incluye sus descendientes.
- Cotizaciones: el carrito cotiza todos los productos y variantes del vendedor elegido, conservando el resto del carrito. El diálogo de servicios permite incluir varios servicios de la misma empresa. La respuesta del vendedor fija el precio unitario de cada línea; aceptar lleva al resumen y solo el pago completado cambia el estado a Aceptada.
- Vigencia: fecha de emisión separada de la fecha solicitada del servicio, vigencia hasta emisión +15 días inclusive, expiración desde el día 16, ajustes de precios en los días 22, 29, 36 y 43, eliminación desde el día 46. Una cotización aceptada no cambia sus precios; su pedido y pago sobreviven a su eliminación. La simulación aplica las reglas al cargar, operar y cada minuto mientras la página está abierta, además de recuperar el foco.
- Deseos: productos y servicios con referencias tipadas en list.items, conservando compatibilidad con productIds antiguos.
- Recomendaciones: el vendedor selecciona productos activos de su empresa y elige cuál se muestra primero; no hay recomendaciones fijas. La selección y administración de variantes y las respuestas públicas de la primera iteración se mantienen.
- Finanzas: snapshots inmutables con artículos, SKU, cantidades, precios, neto, IVA, envío, total, medio de pago y referencia. El historial filtra por identidad/empresa y permite abrir cada detalle financiero.
- Devoluciones: solicitud de compras propias entregadas, aprobación/rechazo del vendedor y comprobante de reembolso ligado a devolución, pedido y pago. Se devuelve el importe de artículos o servicios, excluyendo envío, sin duplicados ni superar lo pagado. Solo se emite si existe pago completado asociado; los registros históricos incompletos se muestran como tales, sin inventar datos.
- Identidad: correos y teléfonos únicos entre personas, normalizados; los móviles chilenos se reconocen con o sin prefijo internacional. Se conserva al menos un teléfono y una dirección.
- Transporte: la empresa se puede registrar o corregir antes del envío y queda bloqueada desde Enviado. El número de seguimiento puede actualizarse.

Los datos de versión 2 se conservan en multiplaza.backup.v2 antes de migrar a la versión 3. Las migraciones añaden categorías, referencias tipadas de deseos, ciclo de cotizaciones y estructura de reembolsos; no reinician las cuentas ni sus contraseñas. La dependencia nueva para bcrypt es bcryptjs 3.0.3.
