-- Ampliación del esquema existente. La aplicación ejecuta este archivo en una transacción.
-- No elimina tablas ni modifica los identificadores originales.
ALTER TABLE public.usuario ALTER COLUMN clave_acceso TYPE varchar(512);

CREATE TABLE public.usuario_acceso (
    usuario_run varchar(15) PRIMARY KEY REFERENCES public.usuario(run),
    rol varchar(20) NOT NULL DEFAULT 'Cliente' CHECK (rol IN ('Cliente','Administrador')),
    activo boolean NOT NULL DEFAULT true,
    version_token integer NOT NULL DEFAULT 1,
    intentos_fallidos integer NOT NULL DEFAULT 0,
    bloqueado_hasta timestamptz,
    clave_es_hash boolean NOT NULL DEFAULT false
);
INSERT INTO public.usuario_acceso(usuario_run) SELECT run FROM public.usuario;

CREATE TABLE public.carrito (
    usuario_run varchar(15) PRIMARY KEY REFERENCES public.usuario(run),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.carrito_detalle (
    usuario_run varchar(15) NOT NULL REFERENCES public.carrito(usuario_run) ON DELETE CASCADE,
    producto_id varchar(50) NOT NULL REFERENCES public.producto(sku),
    vendedor_run varchar(15) NOT NULL,
    cantidad integer NOT NULL CHECK (cantidad BETWEEN 1 AND 1000),
    PRIMARY KEY (usuario_run,producto_id),
    FOREIGN KEY (vendedor_run,producto_id) REFERENCES public.vende(usuario_id,producto_id)
);

CREATE TABLE public.pedido (
    venta_id integer PRIMARY KEY REFERENCES public.venta(id_venta),
    usuario_run varchar(15) NOT NULL REFERENCES public.usuario(run),
    clave_idempotencia uuid NOT NULL,
    estado varchar(25) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Confirmado','EnPreparacion','Despachado','Entregado','Cancelado')),
    direccion_entrega varchar(500) NOT NULL,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now(),
    UNIQUE (usuario_run,clave_idempotencia)
);
CREATE INDEX ix_pedido_usuario_fecha ON public.pedido(usuario_run,creado_en DESC);
CREATE TABLE public.pedido_detalle (
    venta_id integer NOT NULL REFERENCES public.pedido(venta_id),
    producto_id varchar(50) NOT NULL REFERENCES public.producto(sku),
    vendedor_run varchar(15) NOT NULL REFERENCES public.usuario(run),
    nombre varchar(100) NOT NULL,
    cantidad integer NOT NULL CHECK (cantidad > 0),
    precio_unitario integer NOT NULL CHECK (precio_unitario >= 0),
    PRIMARY KEY (venta_id,producto_id)
);

-- Secuencias independientes para los INSERT de esta API; los ID anteriores se conservan.
CREATE SEQUENCE public.api_categoria_id;
SELECT setval('public.api_categoria_id', COALESCE((SELECT max(id_categoria)::bigint + 1 FROM public.categoria),1),false);
CREATE SEQUENCE public.api_stock_id;
SELECT setval('public.api_stock_id', COALESCE((SELECT max(id_stock)::bigint + 1 FROM public.stock),1),false);
CREATE SEQUENCE public.api_venta_id;
SELECT setval('public.api_venta_id', COALESCE((SELECT max(id_venta)::bigint + 1 FROM public.venta),1),false);
