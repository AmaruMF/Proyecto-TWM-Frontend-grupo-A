# Multiplaza — Plataforma de compra y venta

Proyecto académico del Grupo A para conectar a emprendedores de una comunidad escolar con clientes que buscan productos y servicios. Multiplaza permite explorar publicaciones, comunicarse con los vendedores, solicitar cotizaciones, comprar y consultar el seguimiento de las operaciones.

Los emprendedores pueden administrar su empresa, publicaciones, variantes, inventario, ofertas, ventas y solicitudes de sus clientes. Una misma persona puede actuar como cliente y habilitar su perfil de vendedor al registrar una empresa.

## Estado actual del proyecto

Actualmente se desarrolla el **frontend**, construido con React, Material UI y Vite. Las cuentas y operaciones se simulan mediante datos JSON y almacenamiento del navegador (`localStorage` y `sessionStorage`).

**Todavía no existe conexión con una base de datos ni con servicios reales de autenticación, pago, transporte o mensajería.** Los pagos y reembolsos son simulaciones y no mueven dinero. La carpeta `backend/` contiene la plantilla inicial de ASP.NET para una integración posterior.

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| React | Componentes, pantallas y estado de la interfaz. |
| Material UI y Emotion | Componentes visuales, estilos y diseño adaptable. |
| Vite | Servidor de desarrollo y compilación de producción. |
| bcryptjs | Hash de contraseñas de las cuentas simuladas. |
| Node.js y npm | Instalación de dependencias, comandos y pruebas automatizadas. |
| ESLint y `node:test` | Revisión del código y pruebas de reglas de negocio. |

## Cómo ejecutar el servidor de desarrollo

### 1. Requisitos

- Tener instalado **Node.js 22.12 o posterior**, con npm.
- Abrir una terminal, por ejemplo PowerShell o la terminal integrada de Visual Studio Code.

Para comprobar la instalación:

```powershell
node --version
npm --version
```

### 2. Entrar a la carpeta del frontend

Si la terminal está en la raíz de `Proyecto-TWM-Frontend-grupo-A`, ejecutar:

```powershell
cd frontend
```

Los comandos de npm deben ejecutarse dentro de `frontend/`, donde está el archivo `package.json`.

### 3. Instalar las dependencias

La primera vez, o después de actualizar las dependencias del proyecto:

```powershell
npm install
```

### 4. Iniciar el servidor

```powershell
npm run dev
```

Vite mostrará una dirección local, normalmente:

```text
http://localhost:5173/
```

Abrir esa dirección en el navegador. Si el puerto está ocupado, utilizar la dirección que Vite indique en la terminal.

Mantener la terminal abierta mientras se utiliza la aplicación. Los cambios guardados en el código se reflejan automáticamente en el navegador. Para detener el servidor, presionar **Ctrl+C** en esa terminal.

En ejecuciones posteriores, normalmente basta con:

```powershell
cd frontend
npm run dev
```

No es necesario iniciar el backend ni una base de datos para probar esta versión.

## Cuentas iniciales para probar

| Correo | Perfil inicial | Contraseña inicial |
| --- | --- | --- |
| `cjesus@gmail.com` | Vendedor de Multiplaza | `Multiplaza2026!` |
| `milla@gmail.com` | Cliente | `Multiplaza2026!` |

El inicio de sesión acepta correo o RUN. También se pueden crear cuentas desde el registro. Las cuentas iniciales están definidas en `frontend/src/data/accounts.json`; las modificaciones y las cuentas nuevas se guardan en el navegador.

La contraseña puede cambiarse desde el perfil. Se conserva mediante bcrypt con salt individual; las credenciales antiguas con PBKDF2 se migran después de un acceso correcto. Desde **Mi cuenta**, un vendedor puede cambiar a la vista de cliente; un cliente mayor de edad puede registrar su empresa para habilitar la vista de vendedor.

## Funciones según los requerimientos

La siguiente tabla utiliza la numeración **RF-01 a RF-32 del informe de requisitos**. Describe las funciones disponibles en la simulación frontend.

| Requisito | Función |
| --- | --- |
| RF-01 | Registrar y editar empresas: razón social, RUT, correo, web, teléfonos, tienda física, dirección y datos del emprendedor. |
| RF-02 | Registrar clientes con nombre, RUN, teléfono, correo, dirección de despacho y fecha de nacimiento. |
| RF-03 | Validar mayoría de edad para vender y para adquirir productos o servicios restringidos. |
| RF-04 | Agregar, editar y eliminar direcciones identificadas individualmente, conservando al menos una. Seleccionarlas durante la compra. |
| RF-05 | Editar el perfil, contactos y contraseña de la cuenta. El RUN personal permanece inmutable. |
| RF-06 | Permitir que una persona participe como cliente y emprendedor mediante sus vistas correspondientes. |
| RF-07 | Gestionar posteriormente si la empresa ofrece productos, servicios o ambos. |
| RF-08 | Publicar productos con nombre, categoría, tamaño, peso, color y material principal, además de precio, SKU y variantes. |
| RF-09 | Publicar servicios con nombre, categoría, restricción etaria y duración; incluye SKU, precio y descripción. |
| RF-10 | Crear, editar y pausar ofertas de productos y servicios con fechas de inicio y término. |
| RF-11 | Buscar productos y servicios, explorar sus detalles y filtrar el catálogo. El vendedor administra sus publicaciones. |
| RF-12 | Comprar uno o varios productos de un mismo vendedor, controlando cantidades y stock por variante. |
| RF-13 | Asociar cada compra con cliente y vendedor e indicar si requiere despacho. |
| RF-14 | Configurar tarifas de envío por comuna y región, con una tarifa general de respaldo, y calcularlas durante la compra. |
| RF-15 | Gestionar los estados del pedido y consultar su historial. Se distinguen despacho, retiro y prestación de servicios. |
| RF-16 | Puntuar y reseñar productos, servicios y vendedores después de una adquisición propia finalizada. |
| RF-17 | Administrar el inventario completo de la empresa y el stock independiente de cada SKU o variante. |
| RF-18 | Añadir, editar y eliminar teléfonos y direcciones después del registro, manteniendo al menos uno de cada. |
| RF-19 | Enviar y recibir mensajes internos con autor, empresa, cliente, contexto y fecha; cada identidad accede a sus conversaciones. |
| RF-20 | Registrar transportista y número de seguimiento y consultar el avance del despacho. |
| RF-21 | Utilizar un árbol de 48 categorías del enunciado, con relaciones padre-hija. Un filtro padre incluye sus descendientes. |
| RF-22 | Cotizar productos y variantes desde el carrito o varios servicios desde su diálogo, siempre de una sola empresa por solicitud. |
| RF-23 | Aplicar vigencia de cotizaciones, ajustes semanales de precios y eliminación después de 45 días. |
| RF-24 | Gestionar cotizaciones solicitadas, respondidas, aceptadas y expiradas. El vendedor responde precios por artículo. |
| RF-25 | Conservar el detalle de pago: fecha, artículos, neto, IVA, envío, total, medio, últimos cuatro dígitos o referencia de transferencia. |
| RF-26 | Crear y gestionar listas de deseos con productos y servicios. |
| RF-27 | Publicar preguntas en productos o servicios y permitir que su vendedor responda públicamente. |
| RF-28 | Seleccionar y administrar variantes con atributos JSON, SKU, precio y stock independientes. |
| RF-29 | Elegir productos relacionados de la propia empresa y definir la recomendación principal que aparecerá primero. |
| RF-30 | Consultar el historial financiero propio con filtros, búsqueda y detalle por operación. |
| RF-31 | Solicitar devoluciones, aprobarlas o rechazarlas y registrar reembolsos con comprobante vinculado al pedido y pago original. |
| RF-32 | Validar correos y teléfonos únicos entre personas, considerando su formato normalizado. |

## Requerimientos no funcionales y alcance

| Requisito | Tratamiento en esta etapa |
| --- | --- |
| RNF-01: acceso web y móvil y persistencia relacional | La interfaz web es adaptable a distintos tamaños de pantalla. La base de datos relacional y una aplicación móvil independiente corresponden a etapas posteriores. |
| RNF-02: protección de credenciales | Se usan hashes bcrypt y se excluyen las credenciales de los datos expuestos a los componentes. La autenticación sigue siendo local y simulada. |
| RNF-03: minimización de datos de pago | No se guarda el número completo de tarjeta ni el CVV. Se conserva únicamente la información necesaria para identificar el medio simulado y su referencia. |

## Reglas importantes de los flujos

- **Compra y cotización:** una operación contiene artículos de un solo vendedor. Los artículos de otras empresas permanecen en el carrito.
- **Variantes:** cada variante tiene su propio SKU, precio y stock. Si hay varias, aparecen selectores de atributos; si solo hay una, se muestra la cantidad disponible para elegir.
- **Envío:** una tarifa de comuna tiene prioridad sobre una regional; si no existe coincidencia se utiliza la tarifa general. El retiro no tiene costo de envío.
- **Transporte:** el vendedor debe registrar transportista y seguimiento antes de enviar. La empresa de transporte queda bloqueada desde el estado Enviado.
- **Cotizaciones:** la vigencia termina en emisión +15 días inclusive; desde el día 16 no pueden aceptarse. Las expiradas ajustan precios en los días 22, 29, 36 y 43 y se eliminan desde el día 46.
- **Aceptación:** aceptar una cotización abre el resumen de compra. Solo un pago simulado completado la marca como aceptada. Los valores pactados se conservan durante su vigencia y el pedido mantiene su historial aunque la cotización se elimine.
- **Procesos temporales:** se evalúan al cargar, operar, recuperar el foco y cada minuto mientras la página está abierta. Al volver a abrirla se procesa el tiempo transcurrido; no hay un servidor ejecutando tareas con el navegador cerrado.
- **Reseñas:** requieren una adquisición propia finalizada y permiten una reseña por destinatario.
- **Reembolsos:** requieren devolución aprobada y pago completado asociado. Se reintegra el importe de artículos o servicios, excluyendo envío, sin duplicados ni superar el saldo pagado. Los históricos incompletos se identifican sin inventar comprobantes.

## Organización del repositorio

```text
Proyecto-TWM-Frontend-grupo-A/
├── frontend/
│   ├── public/             Logo, imágenes e iconos
│   ├── src/
│   │   ├── components/     Componentes reutilizables
│   │   ├── context/        Estado compartido y acciones de la simulación
│   │   ├── data/           Cuentas, catálogo y árbol de categorías
│   │   ├── hooks/          Acceso al estado y navegación
│   │   ├── pages/          Pantallas de cliente y vendedor
│   │   ├── theme/          Tema de Material UI
│   │   └── utils/          Validaciones y reglas de negocio
│   ├── tests/              Pruebas automatizadas
│   └── package.json        Dependencias y comandos
├── backend/                Plantilla inicial de ASP.NET
└── Minutas/                Documentación de reuniones
```

Las rutas del frontend utilizan `#/`, por ejemplo `#/productos`, `#/cuenta`, `#/carrito` y `#/inventario`. El detalle de rutas y almacenamiento está en [la documentación del frontend](frontend/README.md).

## Otros comandos

Ejecutar desde `frontend/`:

| Comando | Uso |
| --- | --- |
| `npm run dev` | Iniciar el servidor de desarrollo. |
| `npm run lint` | Revisar el código con ESLint. |
| `npm test` | Ejecutar las pruebas automatizadas. |
| `npm run build` | Generar los archivos de producción en `dist/`. |
| `npm run preview` | Revisar localmente la compilación generada; ejecutar antes `npm run build`. |

## Datos guardados

La simulación guarda su estado en `localStorage` bajo `multiplaza.data` (versión 3). La sesión y los resúmenes de compra utilizan `sessionStorage`; la opción Mantener sesión activa conserva también una referencia de sesión en `localStorage`. Los datos son propios del navegador y origen utilizados y no se sincronizan entre equipos.

Las migraciones conservan las cuentas y operaciones existentes e intentan respaldar versiones anteriores en `multiplaza.backup.v1` o `multiplaza.backup.v2`. **Eliminar cuenta** afecta a la identidad activa y conserva registros comerciales anonimizados; no reinicia las demás cuentas.

Para reiniciar deliberadamente toda la simulación, borrar las claves `multiplaza.*` del almacenamiento de ese sitio y recargar. Esto elimina los cambios locales y restablece las cuentas iniciales.
