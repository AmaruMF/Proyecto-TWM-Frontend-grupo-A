# Multiplaza

Frontend de la tienda, implementado con React, Material UI y Vite a partir del [prototipo de Figma](https://www.figma.com/design/g7mG5IC0YmOLKuEbU8UFC9/Prototipo-Tienda-Ecommerce?node-id=0-1).

El color principal es el naranjo `#FF8400`: barra superior, botones principales, selección de navegación y elementos destacados. El color secundario es el violeta claro `#8FA0D8`: paneles, etiquetas de categoría y acciones secundarias; el tema genera sus tonos claros y oscuros. Se conservan el azul oscuro `#0B0829` para textos y logo, y el crema `#F9DFC6` para fondos. La paleta está en `src/theme/appTheme.js`. El logo original está en `public/LogoAzulOscuro.svg`, junto al título de la cabecera y como favicon. Los recursos originales de Figma utilizados se sirven desde `public/assets/figma/`; no dependen de enlaces temporales.

## Ejecutar

Requiere Node.js 22.12 o posterior.

```powershell
cd frontend
npm install
npm run dev
```

Abrir la dirección que muestre Vite, normalmente `http://localhost:5173`.

Desde **Iniciar sesión** se puede elegir **Entrar como cliente** o **Entrar como vendedor**. También se puede cambiar de vista desde el menú **Mi cuenta**.

```powershell
npm run lint
npm test
npm run build
npm run preview
```

## Alcance

Esta entrega implementa los flujos de frontend con datos de ejemplo. La autenticación, los mensajes, las cotizaciones, las devoluciones y los pagos no están conectados a servicios reales. El backend existente continúa siendo la plantilla inicial de ASP.NET.

Los cambios del catálogo, el perfil, el carrito, las listas, los pedidos y las cotizaciones se conservan en `localStorage` bajo `multiplaza.data`. La sesión y el resumen de compra usan `sessionStorage`; **Mantener sesión activa** conserva la sesión de ejemplo también en `localStorage`. Las contraseñas, el número completo de tarjeta y el CVV no se almacenan. El pago se identifica expresamente como una simulación.

Una compra incluye productos de un solo vendedor. Los de otros vendedores permanecen en el carrito. La simulación registra el pedido y la transacción y descuenta el stock. Los precios ya incluyen IVA: el neto se obtiene dividiendo por 1,19; el IVA es la diferencia y el envío se agrega al final. Las ofertas se aplican únicamente durante su vigencia, según la fecha de Chile.

La mensajería guarda los mensajes localmente; no envía notificaciones ni genera respuestas automáticas. Las imágenes nuevas de publicaciones pueden cargarse como PNG, JPG o WebP de hasta 1 MB. Las publicaciones sin imagen muestran un estado explícito.

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

Las pruebas de `npm test` verifican los totales e IVA, cantidades y stock, compras de un vendedor, conservación del carrito de otros vendedores, exclusión de datos de tarjeta sensibles y fechas/pausa de ofertas. La implementación también se revisó en navegador de escritorio y móvil con carga real de recursos y un recorrido de compra completo.

Para restablecer los datos de muestra se puede usar **Mi cuenta → Eliminar cuenta**, confirmando la eliminación local, o borrar las claves `multiplaza.*` del almacenamiento del navegador.
