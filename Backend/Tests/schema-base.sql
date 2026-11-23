--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: fn_descuento_producto_vigente(character varying, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_descuento_producto_vigente(p_producto_id character varying, p_fecha date) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_porcentaje NUMERIC;
BEGIN
    SELECT COALESCE(MAX(o.porcentaje), 0) INTO v_porcentaje
    FROM promociona pr, oferta o
    WHERE pr.oferta_id = o.id_oferta
    AND pr.producto_id = p_producto_id
    AND p_fecha >= pr.fecha_inicio
    AND p_fecha <= pr.fecha_fin;

    RETURN COALESCE(v_porcentaje, 0);
END;
$$;


--
-- Name: fn_descuento_servicio_vigente(character varying, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_descuento_servicio_vigente(p_servicio_id character varying, p_fecha date) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_porcentaje NUMERIC;
BEGIN
    SELECT COALESCE(MAX(o.porcentaje), 0) INTO v_porcentaje
    FROM admite ad, oferta o
    WHERE ad.oferta_id = o.id_oferta
    AND ad.servicio_id = p_servicio_id
    AND p_fecha >= ad.fecha_inicio
    AND p_fecha <= ad.fecha_fin;

    RETURN COALESCE(v_porcentaje, 0);
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admite (
    servicio_id character varying(50) NOT NULL,
    oferta_id integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    CONSTRAINT chk_admite_fechas CHECK (((fecha_inicio >= '1995-01-01'::date) AND (fecha_fin >= '1995-01-01'::date))),
    CONSTRAINT chk_admite_ordenfecha CHECK ((fecha_inicio < fecha_fin))
);


--
-- Name: alerta_inventario_critico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerta_inventario_critico (
    id_alerta integer NOT NULL,
    producto_id character varying(50),
    stock_id integer,
    cantidad integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    mensaje text,
    atendida boolean DEFAULT false
);


--
-- Name: alerta_inventario_critico_id_alerta_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alerta_inventario_critico_id_alerta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alerta_inventario_critico_id_alerta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alerta_inventario_critico_id_alerta_seq OWNED BY public.alerta_inventario_critico.id_alerta;


--
-- Name: aniadir; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aniadir (
    producto_id character varying(50) NOT NULL,
    lista_deseos_id character varying(100) NOT NULL
);


--
-- Name: aplica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aplica (
    venta_id integer NOT NULL,
    servicio_id character varying(50) NOT NULL,
    usuario_id character varying(15) NOT NULL,
    precio_original numeric(12,2),
    descuento_oferta numeric(5,2) DEFAULT 0,
    precio_final numeric(12,2)
);


--
-- Name: categoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categoria (
    id_categoria integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo character varying(50) NOT NULL
);


--
-- Name: comenta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comenta (
    usuario_id character varying(15) NOT NULL,
    mensajeria_id character varying(50) NOT NULL,
    servicio_id character varying(50)
);


--
-- Name: comercializa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comercializa (
    empresa_id character varying(15) NOT NULL,
    producto_id character varying(50) NOT NULL
);


--
-- Name: compra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compra (
    usuario character varying(15) NOT NULL,
    venta_id integer NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    descuento_aplicado numeric(5,2) DEFAULT 0,
    nota text
);


--
-- Name: comuna; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comuna (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    superficie integer NOT NULL,
    id_provincia integer NOT NULL
);


--
-- Name: considera; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.considera (
    direccion_id character varying(12) NOT NULL,
    medio_pago_id integer NOT NULL,
    despacho_id integer NOT NULL
);


--
-- Name: consultar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultar (
    usuario_id character varying(15) NOT NULL,
    mensajeria_id character varying(50) NOT NULL,
    medio_pago_id integer NOT NULL
);


--
-- Name: correo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.correo (
    id_correo integer NOT NULL,
    direccion_correo character varying(255) NOT NULL,
    dominio character varying(50) NOT NULL,
    usuario_id character varying(15) NOT NULL,
    empresa_id character varying(15) NOT NULL,
    correo_valido boolean DEFAULT true,
    observacion_validacion text
);


--
-- Name: cotizacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cotizacion (
    id_cotizacion integer NOT NULL,
    fecha date NOT NULL,
    empresa_id character varying(15) NOT NULL,
    usuario_id character varying(15),
    fecha_vencimiento date,
    fecha_eliminacion date,
    estado character varying(30) DEFAULT 'Vigente'::character varying,
    precio_total numeric(12,2) DEFAULT 0,
    CONSTRAINT chk_cotizacion_fecha CHECK ((fecha >= '1995-01-01'::date)),
    CONSTRAINT ck_cotizacion_fecha_valida CHECK ((fecha <= CURRENT_TIMESTAMP))
);


--
-- Name: cotizacion_detalle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cotizacion_detalle (
    id_cotizacion_detalle integer NOT NULL,
    cotizacion_id integer NOT NULL,
    producto_id character varying(50),
    servicio_id character varying(50),
    cantidad integer DEFAULT 1,
    precio_original numeric(12,2),
    descuento_oferta numeric(5,2) DEFAULT 0,
    precio_cotizado numeric(12,2),
    fecha_registro date DEFAULT CURRENT_DATE,
    fecha_ultima_actualizacion date DEFAULT CURRENT_DATE,
    CONSTRAINT chk_cotizacion_detalle_item CHECK ((((producto_id IS NOT NULL) AND (servicio_id IS NULL)) OR ((producto_id IS NULL) AND (servicio_id IS NOT NULL))))
);


--
-- Name: cotizacion_detalle_id_cotizacion_detalle_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cotizacion_detalle_id_cotizacion_detalle_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cotizacion_detalle_id_cotizacion_detalle_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cotizacion_detalle_id_cotizacion_detalle_seq OWNED BY public.cotizacion_detalle.id_cotizacion_detalle;


--
-- Name: crear; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crear (
    usuario_id character varying(15) NOT NULL,
    lista_deseos_id character varying(100) NOT NULL
);


--
-- Name: definir; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.definir (
    producto_id character varying(50) NOT NULL,
    direccion_id character varying(12) NOT NULL,
    despacho_id integer NOT NULL
);


--
-- Name: despacho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.despacho (
    id_despacho integer NOT NULL,
    precio integer NOT NULL,
    fecha date NOT NULL,
    numero_seguimiento integer,
    nombre_empresa_transporte character varying(100),
    estado character varying(30) NOT NULL,
    historial_compra_id integer NOT NULL,
    CONSTRAINT chk_despacho_estado CHECK (((estado)::text = ANY ((ARRAY['En Preparación'::character varying, 'Despachado'::character varying, 'En reparto'::character varying, 'Entregado'::character varying])::text[]))),
    CONSTRAINT chk_despacho_fecha CHECK ((fecha >= '1995-01-01'::date)),
    CONSTRAINT chk_despacho_precio CHECK ((precio >= 0)),
    CONSTRAINT ck_despacho_fecha_valida CHECK ((fecha <= CURRENT_TIMESTAMP))
);


--
-- Name: despacho_datos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.despacho_datos (
    id_despacho integer NOT NULL,
    precio integer NOT NULL,
    fecha date NOT NULL,
    estado character varying(30) NOT NULL,
    historial_compra_id integer NOT NULL,
    ancho numeric(10,2),
    alto numeric(10,2),
    fondo numeric(10,2),
    volumen numeric(14,2),
    costo_envio_proyectado numeric(12,2),
    CONSTRAINT chk_despacho_datos_precio CHECK ((precio >= 0)),
    CONSTRAINT chk_despachodatos_estado CHECK (((estado)::text = ANY ((ARRAY['En Preparación'::character varying, 'Despachado'::character varying, 'En reparto'::character varying, 'Entregado'::character varying])::text[]))),
    CONSTRAINT chk_despachodatos_fecha CHECK ((fecha >= '1995-01-01'::date)),
    CONSTRAINT ck_despachodatos_fecha_valida CHECK ((fecha <= CURRENT_TIMESTAMP))
);


--
-- Name: detalle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle (
    producto_id character varying(50) NOT NULL,
    venta_id integer NOT NULL,
    empresa_id character varying(15) NOT NULL
);


--
-- Name: devolucion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devolucion (
    id_devolucion integer NOT NULL,
    motivo character varying(100) NOT NULL,
    fecha date NOT NULL,
    despacho_id integer NOT NULL,
    estado character varying(30) NOT NULL,
    stock_restaurado boolean DEFAULT false,
    CONSTRAINT chk_devolucion_estado CHECK (((estado)::text = ANY ((ARRAY['En Preparación'::character varying, 'Despachado'::character varying, 'En reparto'::character varying, 'Entregado'::character varying])::text[]))),
    CONSTRAINT chk_devolucion_fecha CHECK ((fecha >= '1995-01-01'::date)),
    CONSTRAINT ck_devolucion_fecha_valida CHECK ((fecha <= CURRENT_TIMESTAMP))
);


--
-- Name: direccion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.direccion (
    codigo_postal character varying(12) NOT NULL,
    comuna_id integer NOT NULL,
    calle character varying(100) NOT NULL,
    numero character varying(12) NOT NULL,
    empresa_id character varying(15) NOT NULL,
    usuario_id character varying(15) NOT NULL
);


--
-- Name: distribuye; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.distribuye (
    empresa_id character varying(15) NOT NULL,
    servicio_id character varying(50) NOT NULL,
    precio integer NOT NULL,
    CONSTRAINT chk_distribuye_precio CHECK ((precio >= 0))
);


--
-- Name: ejerce; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ejerce (
    usuario_id character varying(15) NOT NULL,
    devolucion_id integer NOT NULL,
    medio_pago_id integer NOT NULL,
    estado character varying(30) DEFAULT 'Pendiente'::character varying NOT NULL
);


--
-- Name: empresa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresa (
    run_empresa character varying(15) NOT NULL,
    nombre character varying(100) NOT NULL,
    pagina_web character varying(255),
    usuario_id character varying(15) NOT NULL
);


--
-- Name: establece; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.establece (
    venta_id integer NOT NULL,
    servicio_id character varying(50) NOT NULL,
    empresa_id character varying(15) NOT NULL,
    precio_original numeric(12,2),
    descuento_oferta numeric(5,2) DEFAULT 0,
    precio_final numeric(12,2)
);


--
-- Name: evalua; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evalua (
    resenia_id integer NOT NULL,
    usuario_cliente_id character varying(15) NOT NULL,
    usuario_emprendedor_id character varying(15) NOT NULL
);


--
-- Name: genera; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.genera (
    historial_compra_id integer NOT NULL,
    venta_id integer NOT NULL,
    estado character varying(30) NOT NULL
);


--
-- Name: hablar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hablar (
    usuario_id character varying(15) NOT NULL,
    mensajeria_id character varying(50) NOT NULL
);


--
-- Name: historial_compra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_compra (
    id_historial integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    CONSTRAINT chk_historial_fechas CHECK (((fecha_inicio >= '1995-01-01'::date) AND (fecha_fin >= '1995-01-01'::date))),
    CONSTRAINT chk_historial_ordenfecha CHECK ((fecha_inicio < fecha_fin))
);


--
-- Name: incluye; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incluye (
    producto_id character varying(50) NOT NULL,
    venta_id integer NOT NULL,
    usuario_id character varying(15) NOT NULL,
    cantidad integer DEFAULT 1,
    precio_original numeric(12,2),
    descuento_oferta numeric(5,2) DEFAULT 0,
    precio_final numeric(12,2)
);


--
-- Name: incorpora; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incorpora (
    servicio_id character varying(50) NOT NULL,
    categoria_id character varying(100) NOT NULL
);


--
-- Name: integra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integra (
    lista_deseos_id character varying(100) NOT NULL,
    servicio_id character varying(50) NOT NULL
);


--
-- Name: lista_deseos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lista_deseos (
    id_lista_deseos integer NOT NULL,
    nombre character varying(100) NOT NULL
);


--
-- Name: mensajeria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mensajeria (
    id_mensajeria character varying(50) NOT NULL,
    comentario character varying(500) NOT NULL,
    fecha date NOT NULL,
    usuario_id character varying(15) NOT NULL,
    empresa_id character varying(15) NOT NULL,
    CONSTRAINT chk_mensajeria_fecha CHECK ((fecha >= '1995-01-01'::date)),
    CONSTRAINT ck_mensajeria_fecha_valida CHECK ((fecha <= CURRENT_TIMESTAMP))
);


--
-- Name: oferta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oferta (
    id_oferta integer NOT NULL,
    porcentaje integer NOT NULL
);


--
-- Name: pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pago (
    codigo_transferencia integer NOT NULL,
    medio_pago_id integer NOT NULL,
    ultimos_4_digitos_tarjeta character varying(4) NOT NULL
);


--
-- Name: pertenece; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pertenece (
    producto_id character varying(50) NOT NULL,
    categoria_id character varying(100) NOT NULL
);


--
-- Name: preguntar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preguntar (
    usuario_id character varying(15) NOT NULL,
    mensajeria_id character varying(50) NOT NULL,
    producto_id character varying(50) NOT NULL
);


--
-- Name: producto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.producto (
    sku character varying(50) NOT NULL,
    nombre character varying(100) NOT NULL,
    restriccion_edad boolean NOT NULL,
    marca character varying(50) NOT NULL,
    cotizacion_id integer NOT NULL,
    caracteristica jsonb NOT NULL,
    stock_id integer NOT NULL,
    visible boolean DEFAULT true,
    fecha_ultima_actividad date DEFAULT CURRENT_DATE,
    motivo_oculto text
);


--
-- Name: promociona; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promociona (
    producto_id character varying(50) NOT NULL,
    oferta_id integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    CONSTRAINT chk_promociona_fechas CHECK (((fecha_inicio >= '1995-01-01'::date) AND (fecha_fin >= '1995-01-01'::date))),
    CONSTRAINT chk_promociona_ordenfecha CHECK ((fecha_inicio < fecha_fin))
);


--
-- Name: provee; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provee (
    usuario_id character varying(15) NOT NULL,
    servicio_id character varying(50) NOT NULL,
    precio integer NOT NULL,
    CONSTRAINT chk_provee_precio CHECK ((precio >= 0))
);


--
-- Name: provincia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provincia (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    superficie integer NOT NULL,
    id_region integer NOT NULL
);


--
-- Name: region; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.region (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    superficie integer NOT NULL
);


--
-- Name: resenia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resenia (
    id_resenia integer NOT NULL,
    puntaje integer,
    comentario character varying(500)
);


--
-- Name: reseniar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseniar (
    resenia_id integer NOT NULL,
    usuario_id character varying(15) NOT NULL,
    producto_id character varying(50) NOT NULL
);


--
-- Name: seguimiento_despacho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seguimiento_despacho (
    numero_seguimiento integer NOT NULL,
    nombre_empresa_transporte character varying(100) NOT NULL
);


--
-- Name: servicio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicio (
    sku character varying(50) NOT NULL,
    nombre character varying(100) NOT NULL,
    restriccion_edad boolean NOT NULL,
    tiempo integer NOT NULL,
    cotizacion_id integer NOT NULL,
    caracteristica jsonb NOT NULL,
    visible boolean DEFAULT true,
    fecha_ultima_actividad date DEFAULT CURRENT_DATE,
    motivo_oculto text
);


--
-- Name: stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock (
    id_stock integer NOT NULL,
    cantidad integer NOT NULL,
    CONSTRAINT chk_stock_cantidad CHECK ((cantidad >= 0))
);


--
-- Name: subdivide; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subdivide (
    categoria_padre character varying(100) NOT NULL,
    categoria_hijo character varying(100) NOT NULL
);


--
-- Name: telefono; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telefono (
    id_telefono integer NOT NULL,
    numero integer NOT NULL,
    prefijo integer NOT NULL,
    usuario_id character varying(15) NOT NULL,
    CONSTRAINT chk_telefono_largo CHECK ((numero >= 9999999))
);


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario (
    run character varying(15) NOT NULL,
    nombre character varying(100) NOT NULL,
    clave_acceso character varying(20) NOT NULL,
    fecha_nacimiento date NOT NULL,
    fecha_registro date NOT NULL,
    tipo integer NOT NULL,
    descuento_proxima_compra numeric(5,2) DEFAULT 0,
    descuento_vigente_hasta date,
    ultima_actividad date,
    CONSTRAINT chk_usuario_fechareg CHECK ((fecha_registro >= '1995-01-01'::date)),
    CONSTRAINT chk_usuario_nacimiento CHECK ((fecha_nacimiento >= '1940-01-01'::date)),
    CONSTRAINT ck_usuario_fechas_validas CHECK (((fecha_nacimiento <= (CURRENT_TIMESTAMP - '14 years'::interval)) AND (fecha_registro <= CURRENT_TIMESTAMP)))
);


--
-- Name: valorar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.valorar (
    resenia_id integer NOT NULL,
    usuario_id character varying(15) NOT NULL,
    servicio_id character varying(50) NOT NULL
);


--
-- Name: vende; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vende (
    usuario_id character varying(15) NOT NULL,
    producto_id character varying(50) NOT NULL,
    precio integer NOT NULL,
    CONSTRAINT chk_vende_precio CHECK ((precio >= 0))
);


--
-- Name: venta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venta (
    id_venta integer NOT NULL,
    codigo_transferencia integer NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(30) DEFAULT 'Pendiente'::character varying,
    pagada boolean DEFAULT false
);


--
-- Name: venta_datos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venta_datos (
    id_venta integer NOT NULL,
    cantidad integer NOT NULL,
    total_iva integer NOT NULL,
    precio_sin_iva integer NOT NULL,
    precio_total integer NOT NULL,
    fecha date NOT NULL,
    descuento numeric(12,2) DEFAULT 0,
    total_calculado numeric(12,2),
    CONSTRAINT chk_venta_datos_cantidades CHECK ((cantidad >= 0)),
    CONSTRAINT chk_venta_datos_valores CHECK (((cantidad >= 0) AND (precio_total >= precio_sin_iva) AND (precio_sin_iva >= 0) AND (precio_total >= 0) AND (total_iva >= 0))),
    CONSTRAINT chk_ventadatos_fecha CHECK ((fecha >= '1995-01-01'::date)),
    CONSTRAINT chk_ventadatos_iva CHECK ((precio_total = (precio_sin_iva + ((precio_sin_iva * 19) / 100)))),
    CONSTRAINT ck_ventadatos_fecha_valida CHECK ((fecha <= CURRENT_TIMESTAMP))
);


--
-- Name: alerta_inventario_critico id_alerta; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerta_inventario_critico ALTER COLUMN id_alerta SET DEFAULT nextval('public.alerta_inventario_critico_id_alerta_seq'::regclass);


--
-- Name: cotizacion_detalle id_cotizacion_detalle; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizacion_detalle ALTER COLUMN id_cotizacion_detalle SET DEFAULT nextval('public.cotizacion_detalle_id_cotizacion_detalle_seq'::regclass);


--
-- Name: admite admite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admite
    ADD CONSTRAINT admite_pkey PRIMARY KEY (servicio_id, oferta_id);


--
-- Name: alerta_inventario_critico alerta_inventario_critico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerta_inventario_critico
    ADD CONSTRAINT alerta_inventario_critico_pkey PRIMARY KEY (id_alerta);


--
-- Name: aniadir aniadir_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aniadir
    ADD CONSTRAINT aniadir_pkey PRIMARY KEY (producto_id, lista_deseos_id);


--
-- Name: aplica aplica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aplica
    ADD CONSTRAINT aplica_pkey PRIMARY KEY (venta_id, servicio_id);


--
-- Name: categoria categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_pkey PRIMARY KEY (id_categoria);


--
-- Name: comenta comenta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comenta
    ADD CONSTRAINT comenta_pkey PRIMARY KEY (usuario_id, mensajeria_id);


--
-- Name: comercializa comercializa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comercializa
    ADD CONSTRAINT comercializa_pkey PRIMARY KEY (empresa_id, producto_id);


--
-- Name: compra compra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_pkey PRIMARY KEY (usuario, venta_id);


--
-- Name: comuna comuna_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comuna
    ADD CONSTRAINT comuna_pkey PRIMARY KEY (id);


--
-- Name: considera considera_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.considera
    ADD CONSTRAINT considera_pkey PRIMARY KEY (direccion_id);


--
-- Name: consultar consultar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultar
    ADD CONSTRAINT consultar_pkey PRIMARY KEY (usuario_id, mensajeria_id);


--
-- Name: correo correo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correo
    ADD CONSTRAINT correo_pkey PRIMARY KEY (id_correo);


--
-- Name: cotizacion_detalle cotizacion_detalle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizacion_detalle
    ADD CONSTRAINT cotizacion_detalle_pkey PRIMARY KEY (id_cotizacion_detalle);


--
-- Name: cotizacion cotizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizacion
    ADD CONSTRAINT cotizacion_pkey PRIMARY KEY (id_cotizacion);


--
-- Name: crear crear_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crear
    ADD CONSTRAINT crear_pkey PRIMARY KEY (usuario_id, lista_deseos_id);


--
-- Name: definir definir_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.definir
    ADD CONSTRAINT definir_pkey PRIMARY KEY (producto_id, direccion_id, despacho_id);


--
-- Name: despacho_datos despacho_datos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho_datos
    ADD CONSTRAINT despacho_datos_pkey PRIMARY KEY (id_despacho);


--
-- Name: despacho despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho
    ADD CONSTRAINT despacho_pkey PRIMARY KEY (id_despacho);


--
-- Name: detalle detalle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle
    ADD CONSTRAINT detalle_pkey PRIMARY KEY (producto_id, venta_id);


--
-- Name: devolucion devolucion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devolucion
    ADD CONSTRAINT devolucion_pkey PRIMARY KEY (id_devolucion);


--
-- Name: direccion direccion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direccion
    ADD CONSTRAINT direccion_pkey PRIMARY KEY (codigo_postal);


--
-- Name: distribuye distribuye_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribuye
    ADD CONSTRAINT distribuye_pkey PRIMARY KEY (empresa_id, servicio_id);


--
-- Name: ejerce ejerce_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejerce
    ADD CONSTRAINT ejerce_pkey PRIMARY KEY (usuario_id, devolucion_id);


--
-- Name: empresa empresa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa
    ADD CONSTRAINT empresa_pkey PRIMARY KEY (run_empresa);


--
-- Name: establece establece_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.establece
    ADD CONSTRAINT establece_pkey PRIMARY KEY (venta_id, servicio_id);


--
-- Name: evalua evalua_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evalua
    ADD CONSTRAINT evalua_pkey PRIMARY KEY (resenia_id);


--
-- Name: genera genera_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.genera
    ADD CONSTRAINT genera_pkey PRIMARY KEY (historial_compra_id, venta_id);


--
-- Name: hablar hablar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hablar
    ADD CONSTRAINT hablar_pkey PRIMARY KEY (usuario_id, mensajeria_id);


--
-- Name: historial_compra historial_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_compra
    ADD CONSTRAINT historial_compra_pkey PRIMARY KEY (id_historial);


--
-- Name: incluye incluye_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incluye
    ADD CONSTRAINT incluye_pkey PRIMARY KEY (producto_id, venta_id);


--
-- Name: incorpora incorpora_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incorpora
    ADD CONSTRAINT incorpora_pkey PRIMARY KEY (servicio_id, categoria_id);


--
-- Name: integra integra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integra
    ADD CONSTRAINT integra_pkey PRIMARY KEY (lista_deseos_id, servicio_id);


--
-- Name: lista_deseos lista_deseos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lista_deseos
    ADD CONSTRAINT lista_deseos_pkey PRIMARY KEY (id_lista_deseos);


--
-- Name: mensajeria mensajeria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajeria
    ADD CONSTRAINT mensajeria_pkey PRIMARY KEY (id_mensajeria);


--
-- Name: oferta oferta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oferta
    ADD CONSTRAINT oferta_pkey PRIMARY KEY (id_oferta);


--
-- Name: pago pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_pkey PRIMARY KEY (codigo_transferencia);


--
-- Name: pertenece pertenece_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pertenece
    ADD CONSTRAINT pertenece_pkey PRIMARY KEY (producto_id, categoria_id);


--
-- Name: preguntar preguntar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntar
    ADD CONSTRAINT preguntar_pkey PRIMARY KEY (usuario_id, mensajeria_id);


--
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (sku);


--
-- Name: promociona promociona_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promociona
    ADD CONSTRAINT promociona_pkey PRIMARY KEY (producto_id, oferta_id);


--
-- Name: provee provee_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provee
    ADD CONSTRAINT provee_pkey PRIMARY KEY (usuario_id, servicio_id);


--
-- Name: provincia provincia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provincia
    ADD CONSTRAINT provincia_pkey PRIMARY KEY (id);


--
-- Name: region region_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_pkey PRIMARY KEY (id);


--
-- Name: resenia resenia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenia
    ADD CONSTRAINT resenia_pkey PRIMARY KEY (id_resenia);


--
-- Name: reseniar reseniar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseniar
    ADD CONSTRAINT reseniar_pkey PRIMARY KEY (resenia_id);


--
-- Name: seguimiento_despacho seguimiento_despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguimiento_despacho
    ADD CONSTRAINT seguimiento_despacho_pkey PRIMARY KEY (numero_seguimiento);


--
-- Name: servicio servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT servicio_pkey PRIMARY KEY (sku);


--
-- Name: stock stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_pkey PRIMARY KEY (id_stock);


--
-- Name: subdivide subdivide_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subdivide
    ADD CONSTRAINT subdivide_pkey PRIMARY KEY (categoria_padre, categoria_hijo);


--
-- Name: telefono telefono_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telefono
    ADD CONSTRAINT telefono_pkey PRIMARY KEY (id_telefono);


--
-- Name: categoria uq_categoria_nombre; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT uq_categoria_nombre UNIQUE (nombre);


--
-- Name: correo uq_correo_direccion; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correo
    ADD CONSTRAINT uq_correo_direccion UNIQUE (direccion_correo);


--
-- Name: lista_deseos uq_lista_deseos_nombre; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lista_deseos
    ADD CONSTRAINT uq_lista_deseos_nombre UNIQUE (nombre);


--
-- Name: telefono uq_telefono_numero; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telefono
    ADD CONSTRAINT uq_telefono_numero UNIQUE (numero);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (run);


--
-- Name: valorar valorar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valorar
    ADD CONSTRAINT valorar_pkey PRIMARY KEY (resenia_id);


--
-- Name: vende vende_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vende
    ADD CONSTRAINT vende_pkey PRIMARY KEY (usuario_id, producto_id);


--
-- Name: venta_datos venta_datos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venta_datos
    ADD CONSTRAINT venta_datos_pkey PRIMARY KEY (id_venta);


--
-- Name: venta venta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venta
    ADD CONSTRAINT venta_pkey PRIMARY KEY (id_venta);


--
-- Name: idx_aplica_servicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_aplica_servicio ON public.aplica USING btree (servicio_id);


--
-- Name: idx_comenta_servicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comenta_servicio ON public.comenta USING btree (servicio_id);


--
-- Name: idx_comenta_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comenta_usuario ON public.comenta USING btree (usuario_id);


--
-- Name: idx_comercializa_producto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comercializa_producto ON public.comercializa USING btree (producto_id);


--
-- Name: idx_correo_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_correo_empresa ON public.correo USING btree (empresa_id);


--
-- Name: idx_correo_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_correo_usuario ON public.correo USING btree (usuario_id);


--
-- Name: idx_cotizacion_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cotizacion_empresa ON public.cotizacion USING btree (empresa_id);


--
-- Name: idx_cotizacion_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cotizacion_fecha ON public.cotizacion USING btree (fecha);


--
-- Name: idx_despacho_datos_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_despacho_datos_fecha ON public.despacho_datos USING btree (fecha);


--
-- Name: idx_despacho_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_despacho_fecha ON public.despacho USING btree (fecha);


--
-- Name: idx_detalle_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detalle_empresa ON public.detalle USING btree (empresa_id);


--
-- Name: idx_devolucion_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_devolucion_fecha ON public.devolucion USING btree (fecha);


--
-- Name: idx_direccion_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_direccion_empresa ON public.direccion USING btree (empresa_id);


--
-- Name: idx_direccion_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_direccion_usuario ON public.direccion USING btree (usuario_id);


--
-- Name: idx_distribuye_servicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_distribuye_servicio ON public.distribuye USING btree (servicio_id);


--
-- Name: idx_empresa_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empresa_usuario ON public.empresa USING btree (usuario_id);


--
-- Name: idx_establece_servicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_establece_servicio ON public.establece USING btree (servicio_id);


--
-- Name: idx_incluye_producto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incluye_producto ON public.incluye USING btree (producto_id);


--
-- Name: idx_integra_servicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_integra_servicio ON public.integra USING btree (servicio_id);


--
-- Name: idx_mensajeria_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensajeria_empresa ON public.mensajeria USING btree (empresa_id);


--
-- Name: idx_mensajeria_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensajeria_fecha ON public.mensajeria USING btree (fecha);


--
-- Name: idx_mensajeria_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensajeria_usuario ON public.mensajeria USING btree (usuario_id);


--
-- Name: idx_preguntar_producto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preguntar_producto ON public.preguntar USING btree (producto_id);


--
-- Name: idx_provee_servicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provee_servicio ON public.provee USING btree (servicio_id);


--
-- Name: idx_reseniar_producto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reseniar_producto ON public.reseniar USING btree (producto_id);


--
-- Name: idx_telefono_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_telefono_usuario ON public.telefono USING btree (usuario_id);


--
-- Name: idx_valorar_servicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_valorar_servicio ON public.valorar USING btree (servicio_id);


--
-- Name: idx_vende_producto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vende_producto ON public.vende USING btree (producto_id);


--
-- Name: idx_venta_datos_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_venta_datos_fecha ON public.venta_datos USING btree (fecha);


--
-- Name: admite admite_oferta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admite
    ADD CONSTRAINT admite_oferta_id_fkey FOREIGN KEY (oferta_id) REFERENCES public.oferta(id_oferta);


--
-- Name: admite admite_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admite
    ADD CONSTRAINT admite_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(sku);


--
-- Name: aniadir aniadir_lista_deseos_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aniadir
    ADD CONSTRAINT aniadir_lista_deseos_id_fkey FOREIGN KEY (lista_deseos_id) REFERENCES public.lista_deseos(nombre);


--
-- Name: aniadir aniadir_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aniadir
    ADD CONSTRAINT aniadir_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(sku);


--
-- Name: aplica aplica_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aplica
    ADD CONSTRAINT aplica_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(sku);


--
-- Name: aplica aplica_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aplica
    ADD CONSTRAINT aplica_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: aplica aplica_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aplica
    ADD CONSTRAINT aplica_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.venta(id_venta);


--
-- Name: comenta comenta_mensajeria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comenta
    ADD CONSTRAINT comenta_mensajeria_id_fkey FOREIGN KEY (mensajeria_id) REFERENCES public.mensajeria(id_mensajeria);


--
-- Name: comenta comenta_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comenta
    ADD CONSTRAINT comenta_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(sku);


--
-- Name: comenta comenta_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comenta
    ADD CONSTRAINT comenta_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: comercializa comercializa_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comercializa
    ADD CONSTRAINT comercializa_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(run_empresa);


--
-- Name: comercializa comercializa_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comercializa
    ADD CONSTRAINT comercializa_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(sku);


--
-- Name: compra compra_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_usuario_fkey FOREIGN KEY (usuario) REFERENCES public.usuario(run);


--
-- Name: compra compra_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.venta(id_venta);


--
-- Name: comuna comuna_id_provincia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comuna
    ADD CONSTRAINT comuna_id_provincia_fkey FOREIGN KEY (id_provincia) REFERENCES public.provincia(id) ON UPDATE CASCADE;


--
-- Name: considera considera_despacho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.considera
    ADD CONSTRAINT considera_despacho_id_fkey FOREIGN KEY (despacho_id) REFERENCES public.despacho(id_despacho);


--
-- Name: considera considera_direccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.considera
    ADD CONSTRAINT considera_direccion_id_fkey FOREIGN KEY (direccion_id) REFERENCES public.direccion(codigo_postal);


--
-- Name: consultar consultar_mensajeria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultar
    ADD CONSTRAINT consultar_mensajeria_id_fkey FOREIGN KEY (mensajeria_id) REFERENCES public.mensajeria(id_mensajeria);


--
-- Name: consultar consultar_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultar
    ADD CONSTRAINT consultar_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: correo correo_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correo
    ADD CONSTRAINT correo_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(run_empresa);


--
-- Name: correo correo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correo
    ADD CONSTRAINT correo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: cotizacion cotizacion_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizacion
    ADD CONSTRAINT cotizacion_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(run_empresa);


--
-- Name: crear crear_lista_deseos_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crear
    ADD CONSTRAINT crear_lista_deseos_id_fkey FOREIGN KEY (lista_deseos_id) REFERENCES public.lista_deseos(nombre);


--
-- Name: crear crear_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crear
    ADD CONSTRAINT crear_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: definir definir_despacho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.definir
    ADD CONSTRAINT definir_despacho_id_fkey FOREIGN KEY (despacho_id) REFERENCES public.despacho(id_despacho);


--
-- Name: definir definir_direccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.definir
    ADD CONSTRAINT definir_direccion_id_fkey FOREIGN KEY (direccion_id) REFERENCES public.direccion(codigo_postal);


--
-- Name: definir definir_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.definir
    ADD CONSTRAINT definir_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(sku);


--
-- Name: despacho_datos despacho_datos_historial_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho_datos
    ADD CONSTRAINT despacho_datos_historial_compra_id_fkey FOREIGN KEY (historial_compra_id) REFERENCES public.historial_compra(id_historial);


--
-- Name: despacho_datos despacho_datos_id_despacho_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho_datos
    ADD CONSTRAINT despacho_datos_id_despacho_fkey FOREIGN KEY (id_despacho) REFERENCES public.despacho(id_despacho);


--
-- Name: despacho despacho_historial_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho
    ADD CONSTRAINT despacho_historial_compra_id_fkey FOREIGN KEY (historial_compra_id) REFERENCES public.historial_compra(id_historial);


--
-- Name: detalle detalle_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle
    ADD CONSTRAINT detalle_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(run_empresa);


--
-- Name: detalle detalle_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle
    ADD CONSTRAINT detalle_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(sku);


--
-- Name: detalle detalle_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle
    ADD CONSTRAINT detalle_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.venta(id_venta);


--
-- Name: devolucion devolucion_despacho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devolucion
    ADD CONSTRAINT devolucion_despacho_id_fkey FOREIGN KEY (despacho_id) REFERENCES public.despacho(id_despacho);


--
-- Name: direccion direccion_comuna_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direccion
    ADD CONSTRAINT direccion_comuna_id_fkey FOREIGN KEY (comuna_id) REFERENCES public.comuna(id);


--
-- Name: direccion direccion_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direccion
    ADD CONSTRAINT direccion_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(run_empresa);


--
-- Name: direccion direccion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direccion
    ADD CONSTRAINT direccion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: distribuye distribuye_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribuye
    ADD CONSTRAINT distribuye_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(run_empresa);


--
-- Name: distribuye distribuye_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribuye
    ADD CONSTRAINT distribuye_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(sku);


--
-- Name: ejerce ejerce_devolucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejerce
    ADD CONSTRAINT ejerce_devolucion_id_fkey FOREIGN KEY (devolucion_id) REFERENCES public.devolucion(id_devolucion);


--
-- Name: ejerce ejerce_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejerce
    ADD CONSTRAINT ejerce_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: empresa empresa_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa
    ADD CONSTRAINT empresa_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: establece establece_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.establece
    ADD CONSTRAINT establece_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(run_empresa);


--
-- Name: establece establece_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.establece
    ADD CONSTRAINT establece_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(sku);


--
-- Name: establece establece_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.establece
    ADD CONSTRAINT establece_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.venta(id_venta);


--
-- Name: evalua evalua_resenia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evalua
    ADD CONSTRAINT evalua_resenia_id_fkey FOREIGN KEY (resenia_id) REFERENCES public.resenia(id_resenia);


--
-- Name: evalua evalua_usuario_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evalua
    ADD CONSTRAINT evalua_usuario_cliente_id_fkey FOREIGN KEY (usuario_cliente_id) REFERENCES public.usuario(run);


--
-- Name: evalua evalua_usuario_emprendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evalua
    ADD CONSTRAINT evalua_usuario_emprendedor_id_fkey FOREIGN KEY (usuario_emprendedor_id) REFERENCES public.usuario(run);


--
-- Name: genera genera_historial_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.genera
    ADD CONSTRAINT genera_historial_compra_id_fkey FOREIGN KEY (historial_compra_id) REFERENCES public.historial_compra(id_historial);


--
-- Name: genera genera_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.genera
    ADD CONSTRAINT genera_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.venta(id_venta);


--
-- Name: hablar hablar_mensajeria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hablar
    ADD CONSTRAINT hablar_mensajeria_id_fkey FOREIGN KEY (mensajeria_id) REFERENCES public.mensajeria(id_mensajeria);


--
-- Name: hablar hablar_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hablar
    ADD CONSTRAINT hablar_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: incluye incluye_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incluye
    ADD CONSTRAINT incluye_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(sku);


--
-- Name: incluye incluye_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incluye
    ADD CONSTRAINT incluye_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: incluye incluye_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incluye
    ADD CONSTRAINT incluye_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.venta(id_venta);


--
-- Name: incorpora incorpora_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incorpora
    ADD CONSTRAINT incorpora_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categoria(nombre);


--
-- Name: incorpora incorpora_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incorpora
    ADD CONSTRAINT incorpora_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(sku);


--
-- Name: integra integra_lista_deseos_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integra
    ADD CONSTRAINT integra_lista_deseos_id_fkey FOREIGN KEY (lista_deseos_id) REFERENCES public.lista_deseos(nombre);


--
-- Name: integra integra_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integra
    ADD CONSTRAINT integra_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(sku);


--
-- Name: mensajeria mensajeria_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajeria
    ADD CONSTRAINT mensajeria_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(run_empresa);


--
-- Name: mensajeria mensajeria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajeria
    ADD CONSTRAINT mensajeria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: pago pago_codigo_transferencia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_codigo_transferencia_fkey FOREIGN KEY (codigo_transferencia) REFERENCES public.venta(id_venta);


--
-- Name: pertenece pertenece_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pertenece
    ADD CONSTRAINT pertenece_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categoria(nombre);


--
-- Name: pertenece pertenece_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pertenece
    ADD CONSTRAINT pertenece_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(sku);


--
-- Name: preguntar preguntar_mensajeria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntar
    ADD CONSTRAINT preguntar_mensajeria_id_fkey FOREIGN KEY (mensajeria_id) REFERENCES public.mensajeria(id_mensajeria);


--
-- Name: preguntar preguntar_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntar
    ADD CONSTRAINT preguntar_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(sku);


--
-- Name: preguntar preguntar_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntar
    ADD CONSTRAINT preguntar_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: producto producto_cotizacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_cotizacion_id_fkey FOREIGN KEY (cotizacion_id) REFERENCES public.cotizacion(id_cotizacion);


--
-- Name: producto producto_stock_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.stock(id_stock);


--
-- Name: promociona promociona_oferta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promociona
    ADD CONSTRAINT promociona_oferta_id_fkey FOREIGN KEY (oferta_id) REFERENCES public.oferta(id_oferta);


--
-- Name: promociona promociona_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promociona
    ADD CONSTRAINT promociona_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(sku);


--
-- Name: provee provee_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provee
    ADD CONSTRAINT provee_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(sku);


--
-- Name: provee provee_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provee
    ADD CONSTRAINT provee_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: provincia provincia_id_region_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provincia
    ADD CONSTRAINT provincia_id_region_fkey FOREIGN KEY (id_region) REFERENCES public.region(id) ON UPDATE CASCADE;


--
-- Name: reseniar reseniar_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseniar
    ADD CONSTRAINT reseniar_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(sku);


--
-- Name: reseniar reseniar_resenia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseniar
    ADD CONSTRAINT reseniar_resenia_id_fkey FOREIGN KEY (resenia_id) REFERENCES public.resenia(id_resenia);


--
-- Name: reseniar reseniar_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseniar
    ADD CONSTRAINT reseniar_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: servicio servicio_cotizacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT servicio_cotizacion_id_fkey FOREIGN KEY (cotizacion_id) REFERENCES public.cotizacion(id_cotizacion);


--
-- Name: subdivide subdivide_categoria_hijo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subdivide
    ADD CONSTRAINT subdivide_categoria_hijo_fkey FOREIGN KEY (categoria_hijo) REFERENCES public.categoria(nombre);


--
-- Name: subdivide subdivide_categoria_padre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subdivide
    ADD CONSTRAINT subdivide_categoria_padre_fkey FOREIGN KEY (categoria_padre) REFERENCES public.categoria(nombre);


--
-- Name: telefono telefono_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telefono
    ADD CONSTRAINT telefono_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: valorar valorar_resenia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valorar
    ADD CONSTRAINT valorar_resenia_id_fkey FOREIGN KEY (resenia_id) REFERENCES public.resenia(id_resenia);


--
-- Name: valorar valorar_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valorar
    ADD CONSTRAINT valorar_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(sku);


--
-- Name: valorar valorar_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valorar
    ADD CONSTRAINT valorar_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: vende vende_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vende
    ADD CONSTRAINT vende_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(sku);


--
-- Name: vende vende_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vende
    ADD CONSTRAINT vende_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(run);


--
-- Name: venta_datos venta_datos_id_venta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venta_datos
    ADD CONSTRAINT venta_datos_id_venta_fkey FOREIGN KEY (id_venta) REFERENCES public.venta(id_venta);


--
-- PostgreSQL database dump complete
--


