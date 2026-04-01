--
-- PostgreSQL database dump
--

\restrict nAtc8lZE4PoVpLC94hMCA5ht9JzBGhD6Y9hwZ7bomWwLgiuSCngUOSOzamNHfmH

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2026-04-01 17:12:11

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
-- TOC entry 952 (class 1247 OID 53190)
-- Name: estado_animal; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_animal AS ENUM (
    'ACTIVO',
    'VENDIDO',
    'MUERTO',
    'TRANSFERIDO'
);


ALTER TYPE public.estado_animal OWNER TO postgres;

--
-- TOC entry 961 (class 1247 OID 53214)
-- Name: estado_calendario; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_calendario AS ENUM (
    'PENDIENTE',
    'COMPLETADO',
    'CANCELADO'
);


ALTER TYPE public.estado_calendario OWNER TO postgres;

--
-- TOC entry 949 (class 1247 OID 53183)
-- Name: estado_registro; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_registro AS ENUM (
    'PENDIENTE',
    'APROBADO',
    'RECHAZADO'
);


ALTER TYPE public.estado_registro OWNER TO postgres;

--
-- TOC entry 958 (class 1247 OID 53206)
-- Name: estado_solicitud; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_solicitud AS ENUM (
    'PENDIENTE',
    'APROBADA',
    'RECHAZADA'
);


ALTER TYPE public.estado_solicitud OWNER TO postgres;

--
-- TOC entry 955 (class 1247 OID 53200)
-- Name: tipo_movimiento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_movimiento AS ENUM (
    'ENTRADA',
    'SALIDA'
);


ALTER TYPE public.tipo_movimiento OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 259 (class 1259 OID 53345)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 52744)
-- Name: animales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.animales (
    id_animal integer NOT NULL,
    numero_arete character varying(50) NOT NULL,
    fecha_ingreso date NOT NULL,
    peso_inicial numeric(65,30) NOT NULL,
    id_raza integer NOT NULL,
    procedencia character varying(100),
    edad_estimada integer,
    estado_sanitario_inicial text,
    estado_actual public.estado_animal DEFAULT 'ACTIVO'::public.estado_animal NOT NULL,
    motivo_baja text,
    fecha_baja date
);


ALTER TABLE public.animales OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 52743)
-- Name: animales_id_animal_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.animales_id_animal_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.animales_id_animal_seq OWNER TO postgres;

--
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 231
-- Name: animales_id_animal_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.animales_id_animal_seq OWNED BY public.animales.id_animal;


--
-- TOC entry 224 (class 1259 OID 52704)
-- Name: bitacora; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bitacora (
    id_bitacora integer NOT NULL,
    id_usuario integer NOT NULL,
    accion character varying(50) NOT NULL,
    tabla_afectada character varying(50) NOT NULL,
    id_registro integer NOT NULL,
    fecha_accion timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    detalles jsonb
);


ALTER TABLE public.bitacora OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 52703)
-- Name: bitacora_id_bitacora_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bitacora_id_bitacora_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bitacora_id_bitacora_seq OWNER TO postgres;

--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 223
-- Name: bitacora_id_bitacora_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bitacora_id_bitacora_seq OWNED BY public.bitacora.id_bitacora;


--
-- TOC entry 236 (class 1259 OID 52787)
-- Name: calendario_sanitario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendario_sanitario (
    id_calendario integer NOT NULL,
    id_animal integer NOT NULL,
    id_tipo_evento integer NOT NULL,
    fecha_programada date NOT NULL,
    fecha_alerta date,
    programado_por integer NOT NULL,
    estado public.estado_calendario DEFAULT 'PENDIENTE'::public.estado_calendario NOT NULL
);


ALTER TABLE public.calendario_sanitario OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 52786)
-- Name: calendario_sanitario_id_calendario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calendario_sanitario_id_calendario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calendario_sanitario_id_calendario_seq OWNER TO postgres;

--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 235
-- Name: calendario_sanitario_id_calendario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calendario_sanitario_id_calendario_seq OWNED BY public.calendario_sanitario.id_calendario;


--
-- TOC entry 254 (class 1259 OID 52986)
-- Name: compras_realizadas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compras_realizadas (
    id_compra integer NOT NULL,
    id_solicitud integer NOT NULL,
    fecha_compra date NOT NULL,
    realizada_por integer NOT NULL,
    total_real numeric(65,30) NOT NULL
);


ALTER TABLE public.compras_realizadas OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 52985)
-- Name: compras_realizadas_id_compra_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compras_realizadas_id_compra_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compras_realizadas_id_compra_seq OWNER TO postgres;

--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 253
-- Name: compras_realizadas_id_compra_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compras_realizadas_id_compra_seq OWNED BY public.compras_realizadas.id_compra;


--
-- TOC entry 256 (class 1259 OID 53006)
-- Name: detalle_compra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_compra (
    id_detalle_compra integer NOT NULL,
    id_compra integer NOT NULL,
    id_insumo integer NOT NULL,
    cantidad_real numeric(65,30) NOT NULL,
    precio_unitario numeric(65,30) NOT NULL,
    subtotal numeric(65,30) NOT NULL
);


ALTER TABLE public.detalle_compra OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 53005)
-- Name: detalle_compra_id_detalle_compra_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_compra_id_detalle_compra_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_compra_id_detalle_compra_seq OWNER TO postgres;

--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 255
-- Name: detalle_compra_id_detalle_compra_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_compra_id_detalle_compra_seq OWNED BY public.detalle_compra.id_detalle_compra;


--
-- TOC entry 252 (class 1259 OID 52966)
-- Name: detalle_solicitud_compra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_solicitud_compra (
    id_detalle integer NOT NULL,
    id_solicitud integer NOT NULL,
    id_insumo integer NOT NULL,
    cantidad numeric(65,30) NOT NULL,
    precio_estimado numeric(65,30) NOT NULL,
    subtotal_estimado numeric(65,30) NOT NULL
);


ALTER TABLE public.detalle_solicitud_compra OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 52965)
-- Name: detalle_solicitud_compra_id_detalle_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_solicitud_compra_id_detalle_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_solicitud_compra_id_detalle_seq OWNER TO postgres;

--
-- TOC entry 5325 (class 0 OID 0)
-- Dependencies: 251
-- Name: detalle_solicitud_compra_id_detalle_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_solicitud_compra_id_detalle_seq OWNED BY public.detalle_solicitud_compra.id_detalle;


--
-- TOC entry 244 (class 1259 OID 52884)
-- Name: eventos_reproductivos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eventos_reproductivos (
    id_evento_reproductivo integer NOT NULL,
    id_animal integer NOT NULL,
    id_lote integer NOT NULL,
    tipo_evento character varying(50) NOT NULL,
    fecha_evento date NOT NULL,
    observaciones text,
    registrado_por integer NOT NULL,
    estado_validacion public.estado_registro DEFAULT 'PENDIENTE'::public.estado_registro NOT NULL,
    validado_por integer
);


ALTER TABLE public.eventos_reproductivos OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 52883)
-- Name: eventos_reproductivos_id_evento_reproductivo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eventos_reproductivos_id_evento_reproductivo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eventos_reproductivos_id_evento_reproductivo_seq OWNER TO postgres;

--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 243
-- Name: eventos_reproductivos_id_evento_reproductivo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eventos_reproductivos_id_evento_reproductivo_seq OWNED BY public.eventos_reproductivos.id_evento_reproductivo;


--
-- TOC entry 234 (class 1259 OID 52762)
-- Name: eventos_sanitarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eventos_sanitarios (
    id_evento integer NOT NULL,
    id_animal integer NOT NULL,
    id_tipo_evento integer NOT NULL,
    fecha_evento date NOT NULL,
    diagnostico text,
    medicamento character varying(100),
    dosis character varying(50),
    estado_aprobacion public.estado_registro DEFAULT 'PENDIENTE'::public.estado_registro NOT NULL,
    autorizado_por integer
);


ALTER TABLE public.eventos_sanitarios OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 52761)
-- Name: eventos_sanitarios_id_evento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eventos_sanitarios_id_evento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eventos_sanitarios_id_evento_seq OWNER TO postgres;

--
-- TOC entry 5327 (class 0 OID 0)
-- Dependencies: 233
-- Name: eventos_sanitarios_id_evento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eventos_sanitarios_id_evento_seq OWNED BY public.eventos_sanitarios.id_evento;


--
-- TOC entry 246 (class 1259 OID 52914)
-- Name: insumos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.insumos (
    id_insumo integer NOT NULL,
    nombre_insumo character varying(100) NOT NULL,
    id_tipo_insumo integer NOT NULL,
    unidad_medida character varying(20) NOT NULL,
    descripcion text,
    stock_actual numeric(65,30) DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.insumos OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 52913)
-- Name: insumos_id_insumo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.insumos_id_insumo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.insumos_id_insumo_seq OWNER TO postgres;

--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 245
-- Name: insumos_id_insumo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.insumos_id_insumo_seq OWNED BY public.insumos.id_insumo;


--
-- TOC entry 238 (class 1259 OID 52810)
-- Name: lote_validacion_productiva; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lote_validacion_productiva (
    id_lote integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    creado_por integer NOT NULL,
    fecha_creacion timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado public.estado_registro DEFAULT 'PENDIENTE'::public.estado_registro NOT NULL
);


ALTER TABLE public.lote_validacion_productiva OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 52809)
-- Name: lote_validacion_productiva_id_lote_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lote_validacion_productiva_id_lote_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lote_validacion_productiva_id_lote_seq OWNER TO postgres;

--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 237
-- Name: lote_validacion_productiva_id_lote_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lote_validacion_productiva_id_lote_seq OWNED BY public.lote_validacion_productiva.id_lote;


--
-- TOC entry 248 (class 1259 OID 52931)
-- Name: movimientos_inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimientos_inventario (
    id_movimiento integer NOT NULL,
    id_insumo integer NOT NULL,
    tipo_movimiento public.tipo_movimiento NOT NULL,
    cantidad numeric(65,30) NOT NULL,
    fecha_movimiento date NOT NULL,
    referencia_compra integer,
    registrado_por integer NOT NULL
);


ALTER TABLE public.movimientos_inventario OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 52930)
-- Name: movimientos_inventario_id_movimiento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movimientos_inventario_id_movimiento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movimientos_inventario_id_movimiento_seq OWNER TO postgres;

--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 247
-- Name: movimientos_inventario_id_movimiento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movimientos_inventario_id_movimiento_seq OWNED BY public.movimientos_inventario.id_movimiento;


--
-- TOC entry 242 (class 1259 OID 52854)
-- Name: produccion_leche; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.produccion_leche (
    id_produccion integer NOT NULL,
    id_animal integer NOT NULL,
    id_lote integer NOT NULL,
    litros_producidos numeric(65,30) NOT NULL,
    fecha_registro date NOT NULL,
    registrado_por integer NOT NULL,
    estado_validacion public.estado_registro DEFAULT 'PENDIENTE'::public.estado_registro NOT NULL,
    validado_por integer
);


ALTER TABLE public.produccion_leche OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 52853)
-- Name: produccion_leche_id_produccion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.produccion_leche_id_produccion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.produccion_leche_id_produccion_seq OWNER TO postgres;

--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 241
-- Name: produccion_leche_id_produccion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.produccion_leche_id_produccion_seq OWNED BY public.produccion_leche.id_produccion;


--
-- TOC entry 226 (class 1259 OID 52718)
-- Name: razas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.razas (
    id_raza integer NOT NULL,
    nombre_raza character varying(50) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.razas OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 52717)
-- Name: razas_id_raza_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.razas_id_raza_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.razas_id_raza_seq OWNER TO postgres;

--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 225
-- Name: razas_id_raza_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.razas_id_raza_seq OWNED BY public.razas.id_raza;


--
-- TOC entry 258 (class 1259 OID 53283)
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id_refresh_token integer NOT NULL,
    id_usuario integer NOT NULL,
    token character varying(500) NOT NULL,
    fecha_expiracion timestamp(3) without time zone NOT NULL,
    revocado boolean DEFAULT false NOT NULL,
    fecha_creacion timestamp(3) without time zone DEFAULT now() NOT NULL,
    ip_origen character varying(45),
    user_agent character varying(255)
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 53282)
-- Name: refresh_tokens_id_refresh_token_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_refresh_token_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_refresh_token_seq OWNER TO postgres;

--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 257
-- Name: refresh_tokens_id_refresh_token_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_refresh_token_seq OWNED BY public.refresh_tokens.id_refresh_token;


--
-- TOC entry 240 (class 1259 OID 52824)
-- Name: registro_peso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registro_peso (
    id_registro_peso integer NOT NULL,
    id_animal integer NOT NULL,
    id_lote integer NOT NULL,
    peso numeric(65,30) NOT NULL,
    fecha_registro date NOT NULL,
    registrado_por integer NOT NULL,
    estado_validacion public.estado_registro DEFAULT 'PENDIENTE'::public.estado_registro NOT NULL,
    validado_por integer
);


ALTER TABLE public.registro_peso OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 52823)
-- Name: registro_peso_id_registro_peso_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.registro_peso_id_registro_peso_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.registro_peso_id_registro_peso_seq OWNER TO postgres;

--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 239
-- Name: registro_peso_id_registro_peso_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.registro_peso_id_registro_peso_seq OWNED BY public.registro_peso.id_registro_peso;


--
-- TOC entry 220 (class 1259 OID 52673)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id_rol integer NOT NULL,
    nombre_rol character varying(50) NOT NULL,
    descripcion text
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 52672)
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_rol_seq OWNER TO postgres;

--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_rol_seq OWNED BY public.roles.id_rol;


--
-- TOC entry 250 (class 1259 OID 52946)
-- Name: solicitudes_compra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitudes_compra (
    id_solicitud integer NOT NULL,
    fecha_solicitud date NOT NULL,
    solicitada_por integer NOT NULL,
    estado_solicitud public.estado_solicitud DEFAULT 'PENDIENTE'::public.estado_solicitud NOT NULL,
    aprobada_por integer,
    fecha_aprobacion timestamp(3) without time zone,
    observaciones text
);


ALTER TABLE public.solicitudes_compra OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 52945)
-- Name: solicitudes_compra_id_solicitud_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.solicitudes_compra_id_solicitud_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.solicitudes_compra_id_solicitud_seq OWNER TO postgres;

--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 249
-- Name: solicitudes_compra_id_solicitud_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.solicitudes_compra_id_solicitud_seq OWNED BY public.solicitudes_compra.id_solicitud;


--
-- TOC entry 230 (class 1259 OID 52736)
-- Name: tipos_evento_sanitario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipos_evento_sanitario (
    id_tipo_evento integer NOT NULL,
    nombre_tipo character varying(50) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.tipos_evento_sanitario OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 52735)
-- Name: tipos_evento_sanitario_id_tipo_evento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipos_evento_sanitario_id_tipo_evento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipos_evento_sanitario_id_tipo_evento_seq OWNER TO postgres;

--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 229
-- Name: tipos_evento_sanitario_id_tipo_evento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipos_evento_sanitario_id_tipo_evento_seq OWNED BY public.tipos_evento_sanitario.id_tipo_evento;


--
-- TOC entry 228 (class 1259 OID 52726)
-- Name: tipos_insumo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipos_insumo (
    id_tipo_insumo integer NOT NULL,
    nombre_tipo character varying(50) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.tipos_insumo OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 52725)
-- Name: tipos_insumo_id_tipo_insumo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipos_insumo_id_tipo_insumo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipos_insumo_id_tipo_insumo_seq OWNER TO postgres;

--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 227
-- Name: tipos_insumo_id_tipo_insumo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipos_insumo_id_tipo_insumo_seq OWNED BY public.tipos_insumo.id_tipo_insumo;


--
-- TOC entry 222 (class 1259 OID 52684)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nombre_completo character varying(100) NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    id_rol integer NOT NULL,
    estado boolean DEFAULT true NOT NULL,
    fecha_creacion timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    bloqueado_hasta timestamp(3) without time zone,
    intentos_fallidos integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 52683)
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;


--
-- TOC entry 4983 (class 2604 OID 52747)
-- Name: animales id_animal; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.animales ALTER COLUMN id_animal SET DEFAULT nextval('public.animales_id_animal_seq'::regclass);


--
-- TOC entry 4975 (class 2604 OID 52707)
-- Name: bitacora id_bitacora; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora ALTER COLUMN id_bitacora SET DEFAULT nextval('public.bitacora_id_bitacora_seq'::regclass);


--
-- TOC entry 4987 (class 2604 OID 52790)
-- Name: calendario_sanitario id_calendario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendario_sanitario ALTER COLUMN id_calendario SET DEFAULT nextval('public.calendario_sanitario_id_calendario_seq'::regclass);


--
-- TOC entry 5005 (class 2604 OID 52989)
-- Name: compras_realizadas id_compra; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras_realizadas ALTER COLUMN id_compra SET DEFAULT nextval('public.compras_realizadas_id_compra_seq'::regclass);


--
-- TOC entry 5006 (class 2604 OID 53009)
-- Name: detalle_compra id_detalle_compra; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compra ALTER COLUMN id_detalle_compra SET DEFAULT nextval('public.detalle_compra_id_detalle_compra_seq'::regclass);


--
-- TOC entry 5004 (class 2604 OID 52969)
-- Name: detalle_solicitud_compra id_detalle; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_solicitud_compra ALTER COLUMN id_detalle SET DEFAULT nextval('public.detalle_solicitud_compra_id_detalle_seq'::regclass);


--
-- TOC entry 4996 (class 2604 OID 52887)
-- Name: eventos_reproductivos id_evento_reproductivo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_reproductivos ALTER COLUMN id_evento_reproductivo SET DEFAULT nextval('public.eventos_reproductivos_id_evento_reproductivo_seq'::regclass);


--
-- TOC entry 4985 (class 2604 OID 52765)
-- Name: eventos_sanitarios id_evento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_sanitarios ALTER COLUMN id_evento SET DEFAULT nextval('public.eventos_sanitarios_id_evento_seq'::regclass);


--
-- TOC entry 4998 (class 2604 OID 52917)
-- Name: insumos id_insumo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insumos ALTER COLUMN id_insumo SET DEFAULT nextval('public.insumos_id_insumo_seq'::regclass);


--
-- TOC entry 4989 (class 2604 OID 52813)
-- Name: lote_validacion_productiva id_lote; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lote_validacion_productiva ALTER COLUMN id_lote SET DEFAULT nextval('public.lote_validacion_productiva_id_lote_seq'::regclass);


--
-- TOC entry 5001 (class 2604 OID 52934)
-- Name: movimientos_inventario id_movimiento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario ALTER COLUMN id_movimiento SET DEFAULT nextval('public.movimientos_inventario_id_movimiento_seq'::regclass);


--
-- TOC entry 4994 (class 2604 OID 52857)
-- Name: produccion_leche id_produccion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produccion_leche ALTER COLUMN id_produccion SET DEFAULT nextval('public.produccion_leche_id_produccion_seq'::regclass);


--
-- TOC entry 4977 (class 2604 OID 52721)
-- Name: razas id_raza; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.razas ALTER COLUMN id_raza SET DEFAULT nextval('public.razas_id_raza_seq'::regclass);


--
-- TOC entry 5007 (class 2604 OID 53286)
-- Name: refresh_tokens id_refresh_token; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id_refresh_token SET DEFAULT nextval('public.refresh_tokens_id_refresh_token_seq'::regclass);


--
-- TOC entry 4992 (class 2604 OID 52827)
-- Name: registro_peso id_registro_peso; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registro_peso ALTER COLUMN id_registro_peso SET DEFAULT nextval('public.registro_peso_id_registro_peso_seq'::regclass);


--
-- TOC entry 4970 (class 2604 OID 52676)
-- Name: roles id_rol; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id_rol SET DEFAULT nextval('public.roles_id_rol_seq'::regclass);


--
-- TOC entry 5002 (class 2604 OID 52949)
-- Name: solicitudes_compra id_solicitud; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_compra ALTER COLUMN id_solicitud SET DEFAULT nextval('public.solicitudes_compra_id_solicitud_seq'::regclass);


--
-- TOC entry 4981 (class 2604 OID 52739)
-- Name: tipos_evento_sanitario id_tipo_evento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_evento_sanitario ALTER COLUMN id_tipo_evento SET DEFAULT nextval('public.tipos_evento_sanitario_id_tipo_evento_seq'::regclass);


--
-- TOC entry 4979 (class 2604 OID 52729)
-- Name: tipos_insumo id_tipo_insumo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_insumo ALTER COLUMN id_tipo_insumo SET DEFAULT nextval('public.tipos_insumo_id_tipo_insumo_seq'::regclass);


--
-- TOC entry 4971 (class 2604 OID 52687)
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


--
-- TOC entry 5314 (class 0 OID 53345)
-- Dependencies: 259
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f13124bf-1945-4eed-a445-c54ba4ad8b33	99b37c5face69c1e1598ee063faef1b3542c8ee840d30c308c3fd1ff69385123	2026-03-31 22:21:14.285371-06	0001_baseline		\N	2026-03-31 22:21:14.285371-06	0
e02c7d4a-f30e-40ad-8ca4-9fb79c9dbda7	dbae48bfcaeb49415cdd00f4167e7173959e268e1cbc6e59aebbeaeb9f1927f7	2026-03-31 22:23:05.077946-06	0002_align_prompt_columns_and_models	\N	\N	2026-03-31 22:23:05.037479-06	1
\.


--
-- TOC entry 5287 (class 0 OID 52744)
-- Dependencies: 232
-- Data for Name: animales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.animales (id_animal, numero_arete, fecha_ingreso, peso_inicial, id_raza, procedencia, edad_estimada, estado_sanitario_inicial, estado_actual, motivo_baja, fecha_baja) FROM stdin;
1	TEST-001	2024-01-15	350.500000000000000000000000000000	1	\N	\N	\N	VENDIDO	Venta programada para prueba	2024-06-15
2	SANI-001	2024-01-01	400.000000000000000000000000000000	2	\N	\N	\N	ACTIVO	\N	\N
3	TEST-1775011588982	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	\N	VENDIDO	Venta programada para prueba	2024-06-15
4	SANI-1775011588982	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	\N	\N	ACTIVO	\N	\N
5	TEST-1775013507206	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	\N	VENDIDO	Venta programada para prueba	2024-06-15
6	SANI-1775013507206	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	\N	\N	ACTIVO	\N	\N
7	TEST-1775013659387	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	\N	VENDIDO	Venta programada para prueba	2024-06-15
8	SANI-1775013659387	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	\N	\N	ACTIVO	\N	\N
9	PROD-1775013659387	2024-01-01	300.000000000000000000000000000000	1	\N	\N	\N	ACTIVO	\N	\N
10	TEST-1775013746174	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	\N	VENDIDO	Venta programada para prueba	2024-06-15
11	SANI-1775013746174	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	\N	\N	ACTIVO	\N	\N
12	PROD-1775013746174	2024-01-01	300.000000000000000000000000000000	1	\N	\N	\N	ACTIVO	\N	\N
13	TEST-1775015900124	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	\N	VENDIDO	Venta programada para prueba	2024-06-15
14	SANI-1775015900124	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	\N	\N	ACTIVO	\N	\N
15	PROD-1775015900124	2024-01-01	300.000000000000000000000000000000	1	\N	\N	\N	ACTIVO	\N	\N
16	TEST-1775016608592	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	\N	VENDIDO	Venta programada para prueba	2024-06-15
17	SANI-1775016608592	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	\N	\N	ACTIVO	\N	\N
18	PROD-1775016608592	2024-01-01	300.000000000000000000000000000000	1	\N	\N	\N	ACTIVO	\N	\N
19	UPD-1775016642663	2024-01-10	300.000000000000000000000000000000	1	\N	\N	\N	ACTIVO	\N	\N
20	TEST-1775016691619	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	\N	VENDIDO	Venta programada para prueba	2024-06-15
21	SANI-1775016691619	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	\N	\N	ACTIVO	\N	\N
22	PROD-1775016691619	2024-01-01	300.000000000000000000000000000000	1	\N	\N	\N	ACTIVO	\N	\N
23	TEST-1775017499888	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	\N	VENDIDO	Venta programada para prueba	2024-06-15
24	SANI-1775017499888	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	\N	\N	ACTIVO	\N	\N
25	PROD-1775017499888	2024-01-01	300.000000000000000000000000000000	1	\N	\N	\N	ACTIVO	\N	\N
26	TEST-1775018587366	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	\N	VENDIDO	Venta programada para prueba	2024-06-15
27	SANI-1775018587366	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	\N	\N	ACTIVO	\N	\N
28	PROD-1775018587366	2024-01-01	300.000000000000000000000000000000	1	\N	\N	\N	ACTIVO	\N	\N
29	F3-PROD-1775018590422	2024-01-01	320.000000000000000000000000000000	1	Rancho Test Fase 3	\N	\N	ACTIVO	\N	\N
30	TEST-1775020269120	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	Sano al ingreso	VENDIDO	Venta programada para prueba	2024-06-15
31	SANI-1775020269120	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	26	Sin signos clinicos	ACTIVO	\N	\N
32	PROD-1775020269120	2024-01-01	300.000000000000000000000000000000	1	Modulo productivo	20	Apto para produccion	ACTIVO	\N	\N
33	F3-PROD-1775020272201	2024-01-01	320.000000000000000000000000000000	1	Rancho Test Fase 3	22	Apto para manejo	ACTIVO	\N	\N
34	TEST-1775020335618	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	Sano al ingreso	VENDIDO	Venta programada para prueba	2024-06-15
35	SANI-1775020335618	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	26	Sin signos clinicos	ACTIVO	\N	\N
36	PROD-1775020335618	2024-01-01	300.000000000000000000000000000000	1	Modulo productivo	20	Apto para produccion	ACTIVO	\N	\N
37	F3-PROD-1775020338685	2024-01-01	320.000000000000000000000000000000	1	Rancho Test Fase 3	22	Apto para manejo	ACTIVO	\N	\N
38	TEST-1775020408204	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	Sano al ingreso	VENDIDO	Venta programada para prueba	2024-06-15
39	SANI-1775020408204	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	26	Sin signos clinicos	ACTIVO	\N	\N
40	PROD-1775020408204	2024-01-01	300.000000000000000000000000000000	1	Modulo productivo	20	Apto para produccion	ACTIVO	\N	\N
41	F3-PROD-1775020411120	2024-01-01	320.000000000000000000000000000000	1	Rancho Test Fase 3	22	Apto para manejo	ACTIVO	\N	\N
42	TEST-1775021443296	2024-01-15	350.500000000000000000000000000000	1	Rancho Los Alpes - Sector Norte	24	Sano al ingreso	VENDIDO	Venta programada para prueba	2024-06-15
43	SANI-1775021443296	2024-01-01	400.000000000000000000000000000000	2	Potrero Este	26	Sin signos clinicos	ACTIVO	\N	\N
44	PROD-1775021443296	2024-01-01	300.000000000000000000000000000000	1	Modulo productivo	20	Apto para produccion	ACTIVO	\N	\N
45	F3-PROD-1775021446347	2024-01-01	320.000000000000000000000000000000	1	Rancho Test Fase 3	22	Apto para manejo	ACTIVO	\N	\N
\.


--
-- TOC entry 5279 (class 0 OID 52704)
-- Dependencies: 224
-- Data for Name: bitacora; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bitacora (id_bitacora, id_usuario, accion, tabla_afectada, id_registro, fecha_accion, detalles) FROM stdin;
1	1	LOGIN	usuarios	1	2026-03-31 22:21:31.325	null
2	1	LOGIN	usuarios	1	2026-03-31 22:25:11.124	null
3	1	CREAR	usuarios	2	2026-03-31 22:25:11.655	{"rol": "Médico Veterinario", "username": "vet_test", "nombreCompleto": "Dr. Veterinario Test"}
4	1	MODIFICAR	usuarios	2	2026-03-31 22:25:11.673	{"antes": {"idRol": 3, "username": "vet_test", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
5	1	DESACTIVAR	usuarios	2	2026-03-31 22:25:11.685	{"antes": {"activo": true}, "despues": {"activo": false}}
6	1	ACTIVAR	usuarios	2	2026-03-31 22:25:11.696	{"antes": {"activo": false}, "despues": {"activo": true}}
7	2	LOGIN	usuarios	2	2026-03-31 22:25:12.156	null
8	1	CREAR	razas	9	2026-03-31 22:25:12.18	{"nombreRaza": "TestRaza"}
9	1	LOGOUT	usuarios	1	2026-03-31 22:25:12.328	null
10	1	LOGIN	usuarios	1	2026-03-31 22:27:07.979	null
11	2	LOGIN	usuarios	2	2026-03-31 22:27:08.963	null
12	1	CREAR	razas	10	2026-03-31 22:27:08.989	{"nombreRaza": "TestRaza"}
13	1	CREAR	animales	1	2026-03-31 22:27:09.016	{"raza": "Holstein", "numeroArete": "TEST-001"}
14	1	BAJA	animales	1	2026-03-31 22:27:09.062	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-001", "estadoAnterior": "ACTIVO"}
15	1	CREAR	animales	2	2026-03-31 22:27:09.079	{"raza": "Simmental", "numeroArete": "SANI-001"}
16	2	CREAR	eventos_sanitarios	1	2026-03-31 22:27:09.104	{"tipo": "Vacuna", "animal": "SANI-001"}
17	1	APROBAR	eventos_sanitarios	1	2026-03-31 22:27:09.195	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
18	2	CREAR	calendario_sanitario	1	2026-03-31 22:27:09.227	{"tipo": "Enfermedad", "fecha": "2026-04-05", "animal": "SANI-001"}
19	2	COMPLETAR	calendario_sanitario	1	2026-03-31 22:27:09.266	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
20	1	LOGOUT	usuarios	1	2026-03-31 22:27:09.283	null
21	1	LOGIN	usuarios	1	2026-04-01 02:46:29.602	null
22	1	CREAR	usuarios	6	2026-04-01 02:46:30.155	{"rol": "Médico Veterinario", "username": "vet_1775011588982", "nombreCompleto": "Dr. Veterinario Test"}
23	1	MODIFICAR	usuarios	6	2026-04-01 02:46:30.182	{"antes": {"idRol": 3, "username": "vet_1775011588982", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
24	1	DESACTIVAR	usuarios	6	2026-04-01 02:46:30.192	{"antes": {"activo": true}, "despues": {"activo": false}}
25	1	ACTIVAR	usuarios	6	2026-04-01 02:46:30.204	{"antes": {"activo": false}, "despues": {"activo": true}}
26	6	LOGIN	usuarios	6	2026-04-01 02:46:30.679	null
27	1	CREAR	razas	11	2026-04-01 02:46:30.765	{"nombreRaza": "TestRaza"}
28	1	CREAR	animales	3	2026-04-01 02:46:30.928	{"raza": "Holstein", "numeroArete": "TEST-1775011588982"}
29	1	MODIFICAR	animales	3	2026-04-01 02:46:30.969	{"antes": {"idRaza": 1, "idAnimal": 3, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775011588982", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": null, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": null}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
30	1	BAJA	animales	3	2026-04-01 02:46:30.99	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775011588982", "estadoAnterior": "ACTIVO"}
31	1	CREAR	animales	4	2026-04-01 02:46:31.008	{"raza": "Simmental", "numeroArete": "SANI-1775011588982"}
32	6	CREAR	eventos_sanitarios	2	2026-04-01 02:46:31.041	{"tipo": "Vacuna", "animal": "SANI-1775011588982"}
33	1	APROBAR	eventos_sanitarios	2	2026-04-01 02:46:31.153	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
34	6	CREAR	calendario_sanitario	2	2026-04-01 02:46:31.24	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775011588982"}
35	6	COMPLETAR	calendario_sanitario	2	2026-04-01 02:46:31.28	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
36	1	LOGOUT	usuarios	1	2026-04-01 02:46:31.302	null
37	1	LOGIN	usuarios	1	2026-04-01 03:18:27.634	null
38	1	CREAR	usuarios	8	2026-04-01 03:18:28.131	{"rol": "Médico Veterinario", "username": "vet_1775013507206", "nombreCompleto": "Dr. Veterinario Test"}
39	1	MODIFICAR	usuarios	8	2026-04-01 03:18:28.148	{"antes": {"idRol": 3, "username": "vet_1775013507206", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
40	1	DESACTIVAR	usuarios	8	2026-04-01 03:18:28.158	{"antes": {"activo": true}, "despues": {"activo": false}}
41	1	ACTIVAR	usuarios	8	2026-04-01 03:18:28.166	{"antes": {"activo": false}, "despues": {"activo": true}}
42	8	LOGIN	usuarios	8	2026-04-01 03:18:28.611	null
43	1	CREAR	razas	12	2026-04-01 03:18:28.63	{"nombreRaza": "TestRaza"}
44	1	CREAR	animales	5	2026-04-01 03:18:28.652	{"raza": "Holstein", "numeroArete": "TEST-1775013507206"}
45	1	MODIFICAR	animales	5	2026-04-01 03:18:28.679	{"antes": {"idRaza": 1, "idAnimal": 5, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775013507206", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": null, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": null}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
46	1	BAJA	animales	5	2026-04-01 03:18:28.696	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775013507206", "estadoAnterior": "ACTIVO"}
47	1	CREAR	animales	6	2026-04-01 03:18:28.71	{"raza": "Simmental", "numeroArete": "SANI-1775013507206"}
48	8	CREAR	eventos_sanitarios	3	2026-04-01 03:18:28.732	{"tipo": "Vacuna", "animal": "SANI-1775013507206"}
49	1	APROBAR	eventos_sanitarios	3	2026-04-01 03:18:28.911	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
50	8	CREAR	calendario_sanitario	3	2026-04-01 03:18:28.945	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775013507206"}
51	8	COMPLETAR	calendario_sanitario	3	2026-04-01 03:18:28.987	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
52	1	LOGOUT	usuarios	1	2026-04-01 03:18:29.006	null
53	1	LOGIN	usuarios	1	2026-04-01 03:20:59.765	null
54	1	CREAR	usuarios	10	2026-04-01 03:21:00.267	{"rol": "Médico Veterinario", "username": "vet_1775013659387", "nombreCompleto": "Dr. Veterinario Test"}
55	1	MODIFICAR	usuarios	10	2026-04-01 03:21:00.289	{"antes": {"idRol": 3, "username": "vet_1775013659387", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
56	1	DESACTIVAR	usuarios	10	2026-04-01 03:21:00.302	{"antes": {"activo": true}, "despues": {"activo": false}}
57	1	ACTIVAR	usuarios	10	2026-04-01 03:21:00.314	{"antes": {"activo": false}, "despues": {"activo": true}}
58	10	LOGIN	usuarios	10	2026-04-01 03:21:00.754	null
59	1	CREAR	razas	13	2026-04-01 03:21:00.775	{"nombreRaza": "TestRaza"}
60	1	CREAR	animales	7	2026-04-01 03:21:00.798	{"raza": "Holstein", "numeroArete": "TEST-1775013659387"}
61	1	MODIFICAR	animales	7	2026-04-01 03:21:00.826	{"antes": {"idRaza": 1, "idAnimal": 7, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775013659387", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": null, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": null}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
62	1	BAJA	animales	7	2026-04-01 03:21:00.842	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775013659387", "estadoAnterior": "ACTIVO"}
63	1	CREAR	animales	8	2026-04-01 03:21:00.858	{"raza": "Simmental", "numeroArete": "SANI-1775013659387"}
64	10	CREAR	eventos_sanitarios	4	2026-04-01 03:21:00.879	{"tipo": "Vacuna", "animal": "SANI-1775013659387"}
65	1	APROBAR	eventos_sanitarios	4	2026-04-01 03:21:00.955	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
66	10	CREAR	calendario_sanitario	4	2026-04-01 03:21:00.995	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775013659387"}
67	10	COMPLETAR	calendario_sanitario	4	2026-04-01 03:21:01.032	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
68	1	CREAR	tipos_insumo	1	2026-04-01 03:21:01.053	{"nombreTipo": "Medicamentos", "descripcion": "Medicamentos veterinarios"}
69	1	CREAR	tipos_insumo	2	2026-04-01 03:21:01.058	{"nombreTipo": "Alimento"}
70	1	CREAR	insumos	1	2026-04-01 03:21:01.077	{"nombre": "Ivermectina 1%"}
71	1	MODIFICAR	insumos	1	2026-04-01 03:21:01.1	{"descripcion": "Antiparasitario inyectable actualizado"}
72	1	CREAR	insumos	2	2026-04-01 03:21:01.114	{"nombre": "Sal Mineral"}
73	1	SALIDA_INVENTARIO	movimientos_inventario	1	2026-04-01 03:21:01.138	{"insumo": "Sal Mineral", "cantidad": 25, "stockAntes": 100}
74	1	CREAR	usuarios	12	2026-04-01 03:21:01.368	{"rol": "Almacén", "username": "almacen_1775013659387", "nombreCompleto": "Encargado Almacén"}
75	12	LOGIN	usuarios	12	2026-04-01 03:21:01.582	null
76	12	CREAR	solicitudes_compra	1	2026-04-01 03:21:01.608	{"fecha": "2024-07-01", "numDetalles": 2}
77	1	APROBAR	solicitudes_compra	1	2026-04-01 03:21:01.673	{"nuevoEstado": "APROBADA", "estadoAnterior": "PENDIENTE"}
78	12	CREAR	solicitudes_compra	2	2026-04-01 03:21:01.688	{"fecha": "2024-07-02", "numDetalles": 1}
79	1	RECHAZAR	solicitudes_compra	2	2026-04-01 03:21:01.7	{"nuevoEstado": "RECHAZADA", "estadoAnterior": "PENDIENTE"}
80	1	CREAR	compras_realizadas	1	2026-04-01 03:21:01.742	{"totalReal": 1225, "idSolicitud": 1, "numDetalles": 2}
81	1	CREAR	lote_validacion_productiva	1	2026-04-01 03:21:01.784	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
82	1	CREAR	animales	9	2026-04-01 03:21:01.818	{"raza": "Holstein", "numeroArete": "PROD-1775013659387"}
83	1	APROBAR	lote_validacion_productiva	1	2026-04-01 03:21:01.885	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
84	1	LOGOUT	usuarios	1	2026-04-01 03:21:02.024	null
85	1	LOGIN	usuarios	1	2026-04-01 03:22:26.579	null
86	1	CREAR	usuarios	13	2026-04-01 03:22:27.074	{"rol": "Médico Veterinario", "username": "vet_1775013746174", "nombreCompleto": "Dr. Veterinario Test"}
87	1	MODIFICAR	usuarios	13	2026-04-01 03:22:27.089	{"antes": {"idRol": 3, "username": "vet_1775013746174", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
88	1	DESACTIVAR	usuarios	13	2026-04-01 03:22:27.098	{"antes": {"activo": true}, "despues": {"activo": false}}
89	1	ACTIVAR	usuarios	13	2026-04-01 03:22:27.107	{"antes": {"activo": false}, "despues": {"activo": true}}
90	13	LOGIN	usuarios	13	2026-04-01 03:22:27.54	null
91	1	CREAR	razas	14	2026-04-01 03:22:27.559	{"nombreRaza": "TestRaza"}
92	1	CREAR	animales	10	2026-04-01 03:22:27.576	{"raza": "Holstein", "numeroArete": "TEST-1775013746174"}
93	1	MODIFICAR	animales	10	2026-04-01 03:22:27.604	{"antes": {"idRaza": 1, "idAnimal": 10, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775013746174", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": null, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": null}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
94	1	BAJA	animales	10	2026-04-01 03:22:27.619	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775013746174", "estadoAnterior": "ACTIVO"}
95	1	CREAR	animales	11	2026-04-01 03:22:27.633	{"raza": "Simmental", "numeroArete": "SANI-1775013746174"}
96	13	CREAR	eventos_sanitarios	5	2026-04-01 03:22:27.656	{"tipo": "Vacuna", "animal": "SANI-1775013746174"}
97	1	APROBAR	eventos_sanitarios	5	2026-04-01 03:22:27.757	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
98	13	CREAR	calendario_sanitario	5	2026-04-01 03:22:27.783	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775013746174"}
99	13	COMPLETAR	calendario_sanitario	5	2026-04-01 03:22:27.819	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
100	1	CREAR	tipos_insumo	3	2026-04-01 03:22:27.839	{"nombreTipo": "Medicamentos", "descripcion": "Medicamentos veterinarios"}
101	1	CREAR	tipos_insumo	4	2026-04-01 03:22:27.845	{"nombreTipo": "Alimento"}
102	1	CREAR	insumos	3	2026-04-01 03:22:27.861	{"nombre": "Ivermectina 1%"}
103	1	MODIFICAR	insumos	3	2026-04-01 03:22:27.879	{"descripcion": "Antiparasitario inyectable actualizado"}
104	1	CREAR	insumos	4	2026-04-01 03:22:27.892	{"nombre": "Sal Mineral"}
105	1	SALIDA_INVENTARIO	movimientos_inventario	4	2026-04-01 03:22:27.908	{"insumo": "Sal Mineral", "cantidad": 25, "stockAntes": 100}
106	1	CREAR	usuarios	15	2026-04-01 03:22:28.136	{"rol": "Almacén", "username": "almacen_1775013746174", "nombreCompleto": "Encargado Almacén"}
107	15	LOGIN	usuarios	15	2026-04-01 03:22:28.352	null
108	15	CREAR	solicitudes_compra	3	2026-04-01 03:22:28.377	{"fecha": "2024-07-01", "numDetalles": 2}
110	15	CREAR	solicitudes_compra	4	2026-04-01 03:22:28.461	{"fecha": "2024-07-02", "numDetalles": 1}
109	1	APROBAR	solicitudes_compra	3	2026-04-01 03:22:28.447	{"nuevoEstado": "APROBADA", "estadoAnterior": "PENDIENTE"}
111	1	RECHAZAR	solicitudes_compra	4	2026-04-01 03:22:28.473	{"nuevoEstado": "RECHAZADA", "estadoAnterior": "PENDIENTE"}
114	1	CREAR	animales	12	2026-04-01 03:22:28.59	{"raza": "Holstein", "numeroArete": "PROD-1775013746174"}
119	1	CREAR	eventos_reproductivos	1	2026-04-01 03:22:28.699	{"arete": "PROD-1775013746174", "fecha": "2024-06-15", "tipoEvento": "PARTO"}
120	1	APROBAR	eventos_reproductivos	1	2026-04-01 03:22:28.722	{"nuevoEstado": "APROBADO"}
122	1	LOGOUT	usuarios	1	2026-04-01 03:22:28.859	null
112	1	CREAR	compras_realizadas	2	2026-04-01 03:22:28.513	{"totalReal": 1225, "idSolicitud": 3, "numDetalles": 2}
113	1	CREAR	lote_validacion_productiva	2	2026-04-01 03:22:28.557	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
115	1	CREAR	registro_peso	1	2026-04-01 03:22:28.607	{"peso": 350, "arete": "PROD-1775013746174", "fecha": "2024-06-10"}
116	1	APROBAR	registro_peso	1	2026-04-01 03:22:28.639	{"nuevoEstado": "APROBADO"}
117	1	CREAR	produccion_leche	1	2026-04-01 03:22:28.662	{"arete": "PROD-1775013746174", "fecha": "2024-06-10", "litros": 18.5}
118	1	APROBAR	produccion_leche	1	2026-04-01 03:22:28.68	{"nuevoEstado": "APROBADO"}
121	1	APROBAR	lote_validacion_productiva	2	2026-04-01 03:22:28.737	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
123	1	LOGIN	usuarios	1	2026-04-01 03:58:20.851	null
124	1	CREAR	usuarios	16	2026-04-01 03:58:21.577	{"rol": "Médico Veterinario", "username": "vet_1775015900124", "nombreCompleto": "Dr. Veterinario Test"}
125	1	MODIFICAR	usuarios	16	2026-04-01 03:58:21.602	{"antes": {"idRol": 3, "username": "vet_1775015900124", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
126	1	DESACTIVAR	usuarios	16	2026-04-01 03:58:21.616	{"antes": {"activo": true}, "despues": {"activo": false}}
127	1	ACTIVAR	usuarios	16	2026-04-01 03:58:21.629	{"antes": {"activo": false}, "despues": {"activo": true}}
128	16	LOGIN	usuarios	16	2026-04-01 03:58:22.277	null
129	1	CREAR	razas	15	2026-04-01 03:58:22.3	{"nombreRaza": "TestRaza"}
130	1	CREAR	animales	13	2026-04-01 03:58:22.327	{"raza": "Holstein", "numeroArete": "TEST-1775015900124"}
131	1	MODIFICAR	animales	13	2026-04-01 03:58:22.363	{"antes": {"idRaza": 1, "idAnimal": 13, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775015900124", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": null, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": null}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
132	1	BAJA	animales	13	2026-04-01 03:58:22.389	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775015900124", "estadoAnterior": "ACTIVO"}
133	1	CREAR	animales	14	2026-04-01 03:58:22.408	{"raza": "Simmental", "numeroArete": "SANI-1775015900124"}
134	16	CREAR	eventos_sanitarios	6	2026-04-01 03:58:22.437	{"tipo": "Vacuna", "animal": "SANI-1775015900124"}
135	1	APROBAR	eventos_sanitarios	6	2026-04-01 03:58:22.528	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
136	16	CREAR	calendario_sanitario	6	2026-04-01 03:58:22.559	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775015900124"}
137	16	COMPLETAR	calendario_sanitario	6	2026-04-01 03:58:22.608	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
138	1	CREAR	tipos_insumo	5	2026-04-01 03:58:22.631	{"nombreTipo": "Medicamentos", "descripcion": "Medicamentos veterinarios"}
139	1	CREAR	tipos_insumo	6	2026-04-01 03:58:22.638	{"nombreTipo": "Alimento"}
140	1	CREAR	insumos	5	2026-04-01 03:58:22.658	{"nombre": "Ivermectina 1%"}
141	1	MODIFICAR	insumos	5	2026-04-01 03:58:22.686	{"descripcion": "Antiparasitario inyectable actualizado"}
142	1	CREAR	insumos	6	2026-04-01 03:58:22.703	{"nombre": "Sal Mineral"}
143	1	SALIDA_INVENTARIO	movimientos_inventario	7	2026-04-01 03:58:22.723	{"insumo": "Sal Mineral", "cantidad": 25, "stockAntes": 100}
144	1	CREAR	usuarios	18	2026-04-01 03:58:23.054	{"rol": "Almacén", "username": "almacen_1775015900124", "nombreCompleto": "Encargado Almacén"}
145	18	LOGIN	usuarios	18	2026-04-01 03:58:23.37	null
146	18	CREAR	solicitudes_compra	5	2026-04-01 03:58:23.405	{"fecha": "2024-07-01", "numDetalles": 2}
147	1	APROBAR	solicitudes_compra	5	2026-04-01 03:58:23.488	{"nuevoEstado": "APROBADA", "estadoAnterior": "PENDIENTE"}
148	18	CREAR	solicitudes_compra	6	2026-04-01 03:58:23.509	{"fecha": "2024-07-02", "numDetalles": 1}
149	1	RECHAZAR	solicitudes_compra	6	2026-04-01 03:58:23.524	{"nuevoEstado": "RECHAZADA", "estadoAnterior": "PENDIENTE"}
150	1	CREAR	compras_realizadas	3	2026-04-01 03:58:23.577	{"totalReal": 1225, "idSolicitud": 5, "numDetalles": 2}
151	1	CREAR	lote_validacion_productiva	3	2026-04-01 03:58:23.627	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
152	1	CREAR	animales	15	2026-04-01 03:58:23.662	{"raza": "Holstein", "numeroArete": "PROD-1775015900124"}
153	1	CREAR	registro_peso	2	2026-04-01 03:58:23.683	{"peso": 350, "arete": "PROD-1775015900124", "fecha": "2024-06-10"}
154	1	APROBAR	registro_peso	2	2026-04-01 03:58:23.719	{"nuevoEstado": "APROBADO"}
155	1	CREAR	produccion_leche	2	2026-04-01 03:58:23.746	{"arete": "PROD-1775015900124", "fecha": "2024-06-10", "litros": 18.5}
156	1	APROBAR	produccion_leche	2	2026-04-01 03:58:23.777	{"nuevoEstado": "APROBADO"}
157	1	CREAR	eventos_reproductivos	2	2026-04-01 03:58:23.799	{"arete": "PROD-1775015900124", "fecha": "2024-06-15", "tipoEvento": "PARTO"}
158	1	APROBAR	eventos_reproductivos	2	2026-04-01 03:58:23.83	{"nuevoEstado": "APROBADO"}
159	1	APROBAR	lote_validacion_productiva	3	2026-04-01 03:58:23.852	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
160	1	LOGOUT	usuarios	1	2026-04-01 03:58:24.004	null
161	1	LOGIN	usuarios	1	2026-04-01 04:10:09.098	null
162	1	CREAR	usuarios	19	2026-04-01 04:10:09.774	{"rol": "Médico Veterinario", "username": "vet_1775016608592", "nombreCompleto": "Dr. Veterinario Test"}
163	1	MODIFICAR	usuarios	19	2026-04-01 04:10:09.795	{"antes": {"idRol": 3, "username": "vet_1775016608592", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
164	1	DESACTIVAR	usuarios	19	2026-04-01 04:10:09.806	{"antes": {"activo": true}, "despues": {"activo": false}}
165	1	ACTIVAR	usuarios	19	2026-04-01 04:10:09.818	{"antes": {"activo": false}, "despues": {"activo": true}}
166	19	LOGIN	usuarios	19	2026-04-01 04:10:10.446	null
167	1	CREAR	razas	16	2026-04-01 04:10:10.468	{"nombreRaza": "TestRaza"}
168	1	CREAR	animales	16	2026-04-01 04:10:10.489	{"raza": "Holstein", "numeroArete": "TEST-1775016608592"}
223	1	BAJA	animales	20	2026-04-01 04:11:33.621	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775016691619", "estadoAnterior": "ACTIVO"}
224	1	CREAR	animales	21	2026-04-01 04:11:33.64	{"raza": "Simmental", "numeroArete": "SANI-1775016691619"}
169	1	MODIFICAR	animales	16	2026-04-01 04:10:10.521	{"antes": {"idRaza": 1, "idAnimal": 16, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775016608592", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": null, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": null}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
170	1	BAJA	animales	16	2026-04-01 04:10:10.543	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775016608592", "estadoAnterior": "ACTIVO"}
171	1	CREAR	animales	17	2026-04-01 04:10:10.561	{"raza": "Simmental", "numeroArete": "SANI-1775016608592"}
172	19	CREAR	eventos_sanitarios	7	2026-04-01 04:10:10.587	{"tipo": "Vacuna", "animal": "SANI-1775016608592"}
173	1	APROBAR	eventos_sanitarios	7	2026-04-01 04:10:10.668	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
174	19	CREAR	calendario_sanitario	7	2026-04-01 04:10:10.697	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775016608592"}
175	19	COMPLETAR	calendario_sanitario	7	2026-04-01 04:10:10.74	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
176	1	CREAR	tipos_insumo	7	2026-04-01 04:10:10.765	{"nombreTipo": "Medicamentos", "descripcion": "Medicamentos veterinarios"}
177	1	CREAR	tipos_insumo	8	2026-04-01 04:10:10.772	{"nombreTipo": "Alimento"}
178	1	CREAR	insumos	7	2026-04-01 04:10:10.788	{"nombre": "Ivermectina 1%"}
179	1	MODIFICAR	insumos	7	2026-04-01 04:10:10.812	{"descripcion": "Antiparasitario inyectable actualizado"}
180	1	CREAR	insumos	8	2026-04-01 04:10:10.826	{"nombre": "Sal Mineral"}
181	1	SALIDA_INVENTARIO	movimientos_inventario	10	2026-04-01 04:10:10.842	{"insumo": "Sal Mineral", "cantidad": 25, "stockAntes": 100}
182	1	CREAR	usuarios	21	2026-04-01 04:10:11.171	{"rol": "Almacén", "username": "almacen_1775016608592", "nombreCompleto": "Encargado Almacén"}
183	21	LOGIN	usuarios	21	2026-04-01 04:10:11.47	null
184	21	CREAR	solicitudes_compra	7	2026-04-01 04:10:11.498	{"fecha": "2024-07-01", "numDetalles": 2}
185	1	APROBAR	solicitudes_compra	7	2026-04-01 04:10:11.573	{"nuevoEstado": "APROBADA", "estadoAnterior": "PENDIENTE"}
186	21	CREAR	solicitudes_compra	8	2026-04-01 04:10:11.59	{"fecha": "2024-07-02", "numDetalles": 1}
187	1	RECHAZAR	solicitudes_compra	8	2026-04-01 04:10:11.605	{"nuevoEstado": "RECHAZADA", "estadoAnterior": "PENDIENTE"}
188	1	CREAR	compras_realizadas	4	2026-04-01 04:10:11.644	{"totalReal": 1225, "idSolicitud": 7, "numDetalles": 2}
189	1	CREAR	lote_validacion_productiva	4	2026-04-01 04:10:11.687	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
190	1	CREAR	animales	18	2026-04-01 04:10:11.719	{"raza": "Holstein", "numeroArete": "PROD-1775016608592"}
191	1	CREAR	registro_peso	3	2026-04-01 04:10:11.739	{"peso": 350, "arete": "PROD-1775016608592", "fecha": "2024-06-10"}
192	1	APROBAR	registro_peso	3	2026-04-01 04:10:11.769	{"nuevoEstado": "APROBADO"}
193	1	CREAR	produccion_leche	3	2026-04-01 04:10:11.795	{"arete": "PROD-1775016608592", "fecha": "2024-06-10", "litros": 18.5}
194	1	APROBAR	produccion_leche	3	2026-04-01 04:10:11.816	{"nuevoEstado": "APROBADO"}
195	1	CREAR	eventos_reproductivos	3	2026-04-01 04:10:11.833	{"arete": "PROD-1775016608592", "fecha": "2024-06-15", "tipoEvento": "PARTO"}
196	1	APROBAR	eventos_reproductivos	3	2026-04-01 04:10:11.857	{"nuevoEstado": "APROBADO"}
197	1	APROBAR	lote_validacion_productiva	4	2026-04-01 04:10:11.875	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
198	1	LOGOUT	usuarios	1	2026-04-01 04:10:12.017	null
199	1	LOGIN	usuarios	1	2026-04-01 04:10:26.266	null
200	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 04:10:26.328	{"tipo": "sanitario", "filtros": {"formato": "json"}}
201	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 04:10:26.48	{"tipo": "productivo", "filtros": {"formato": "json"}}
202	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 04:10:26.534	{"tipo": "administrativo", "filtros": {"formato": "json"}}
203	1	CONSULTAR_RESPALDOS	respaldos	0	2026-04-01 04:10:26.542	null
204	1	RESPALDAR	respaldos	0	2026-04-01 04:10:26.621	{"manual": true}
205	1	LOGIN	usuarios	1	2026-04-01 04:10:43.252	null
206	1	CREAR	usuarios	22	2026-04-01 04:10:43.582	{"rol": "Producción", "username": "prod_1775016642663", "nombreCompleto": "Produccion Test"}
207	22	LOGIN	usuarios	22	2026-04-01 04:10:43.885	null
208	1	CREAR	animales	19	2026-04-01 04:10:43.903	{"raza": "Holstein", "numeroArete": "UPD-1775016642663"}
209	1	CREAR	lote_validacion_productiva	5	2026-04-01 04:10:43.916	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
210	22	CREAR	registro_peso	4	2026-04-01 04:10:43.988	{"peso": 340, "arete": "UPD-1775016642663", "fecha": "2024-06-15"}
211	22	MODIFICAR	registro_peso	4	2026-04-01 04:10:44.012	{"antes": {"peso": "340", "fechaRegistro": "2024-06-15T00:00:00.000Z"}, "despues": {"peso": 345}}
212	1	APROBAR	registro_peso	4	2026-04-01 04:10:44.035	{"nuevoEstado": "APROBADO"}
213	1	LOGIN	usuarios	1	2026-04-01 04:11:32.112	null
214	1	REFRESH_TOKEN	refresh_tokens	25	2026-04-01 04:11:32.471	null
215	1	CREAR	usuarios	23	2026-04-01 04:11:32.822	{"rol": "Médico Veterinario", "username": "vet_1775016691619", "nombreCompleto": "Dr. Veterinario Test"}
216	1	MODIFICAR	usuarios	23	2026-04-01 04:11:32.848	{"antes": {"idRol": 3, "username": "vet_1775016691619", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
217	1	DESACTIVAR	usuarios	23	2026-04-01 04:11:32.861	{"antes": {"activo": true}, "despues": {"activo": false}}
218	1	ACTIVAR	usuarios	23	2026-04-01 04:11:32.874	{"antes": {"activo": false}, "despues": {"activo": true}}
219	23	LOGIN	usuarios	23	2026-04-01 04:11:33.514	null
220	1	CREAR	razas	17	2026-04-01 04:11:33.54	{"nombreRaza": "TestRaza"}
221	1	CREAR	animales	20	2026-04-01 04:11:33.565	{"raza": "Holstein", "numeroArete": "TEST-1775016691619"}
222	1	MODIFICAR	animales	20	2026-04-01 04:11:33.601	{"antes": {"idRaza": 1, "idAnimal": 20, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775016691619", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": null, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": null}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
225	23	CREAR	eventos_sanitarios	8	2026-04-01 04:11:33.666	{"tipo": "Vacuna", "animal": "SANI-1775016691619"}
226	1	APROBAR	eventos_sanitarios	8	2026-04-01 04:11:33.749	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
227	23	CREAR	calendario_sanitario	8	2026-04-01 04:11:33.785	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775016691619"}
228	23	COMPLETAR	calendario_sanitario	8	2026-04-01 04:11:33.833	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
229	1	CREAR	tipos_insumo	9	2026-04-01 04:11:33.853	{"nombreTipo": "Medicamentos", "descripcion": "Medicamentos veterinarios"}
230	1	CREAR	tipos_insumo	10	2026-04-01 04:11:33.859	{"nombreTipo": "Alimento"}
231	1	CREAR	insumos	9	2026-04-01 04:11:33.875	{"nombre": "Ivermectina 1%"}
232	1	MODIFICAR	insumos	9	2026-04-01 04:11:33.9	{"descripcion": "Antiparasitario inyectable actualizado"}
233	1	CREAR	insumos	10	2026-04-01 04:11:33.913	{"nombre": "Sal Mineral"}
234	1	SALIDA_INVENTARIO	movimientos_inventario	13	2026-04-01 04:11:33.929	{"insumo": "Sal Mineral", "cantidad": 25, "stockAntes": 100}
235	1	CREAR	usuarios	25	2026-04-01 04:11:34.244	{"rol": "Almacén", "username": "almacen_1775016691619", "nombreCompleto": "Encargado Almacén"}
236	25	LOGIN	usuarios	25	2026-04-01 04:11:34.548	null
237	25	CREAR	solicitudes_compra	9	2026-04-01 04:11:34.578	{"fecha": "2024-07-01", "numDetalles": 2}
238	1	APROBAR	solicitudes_compra	9	2026-04-01 04:11:34.654	{"nuevoEstado": "APROBADA", "estadoAnterior": "PENDIENTE"}
239	25	CREAR	solicitudes_compra	10	2026-04-01 04:11:34.672	{"fecha": "2024-07-02", "numDetalles": 1}
240	1	RECHAZAR	solicitudes_compra	10	2026-04-01 04:11:34.687	{"nuevoEstado": "RECHAZADA", "estadoAnterior": "PENDIENTE"}
241	1	CREAR	compras_realizadas	5	2026-04-01 04:11:34.727	{"totalReal": 1225, "idSolicitud": 9, "numDetalles": 2}
242	1	CREAR	lote_validacion_productiva	6	2026-04-01 04:11:34.771	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
243	1	CREAR	animales	22	2026-04-01 04:11:34.805	{"raza": "Holstein", "numeroArete": "PROD-1775016691619"}
244	1	CREAR	registro_peso	5	2026-04-01 04:11:34.822	{"peso": 350, "arete": "PROD-1775016691619", "fecha": "2024-06-10"}
245	1	APROBAR	registro_peso	5	2026-04-01 04:11:34.85	{"nuevoEstado": "APROBADO"}
246	1	CREAR	produccion_leche	4	2026-04-01 04:11:34.875	{"arete": "PROD-1775016691619", "fecha": "2024-06-10", "litros": 18.5}
247	1	APROBAR	produccion_leche	4	2026-04-01 04:11:34.902	{"nuevoEstado": "APROBADO"}
248	1	CREAR	eventos_reproductivos	4	2026-04-01 04:11:34.918	{"arete": "PROD-1775016691619", "fecha": "2024-06-15", "tipoEvento": "PARTO"}
249	1	APROBAR	eventos_reproductivos	4	2026-04-01 04:11:34.943	{"nuevoEstado": "APROBADO"}
250	1	APROBAR	lote_validacion_productiva	6	2026-04-01 04:11:34.961	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
251	1	LOGOUT	usuarios	1	2026-04-01 04:11:35.099	null
252	1	LOGIN	usuarios	1	2026-04-01 04:25:00.283	null
253	1	REFRESH_TOKEN	refresh_tokens	28	2026-04-01 04:25:00.554	null
254	1	CREAR	usuarios	26	2026-04-01 04:25:00.809	{"rol": "Médico Veterinario", "username": "vet_1775017499888", "nombreCompleto": "Dr. Veterinario Test"}
255	1	MODIFICAR	usuarios	26	2026-04-01 04:25:00.828	{"antes": {"idRol": 3, "username": "vet_1775017499888", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
256	1	DESACTIVAR	usuarios	26	2026-04-01 04:25:00.838	{"antes": {"activo": true}, "despues": {"activo": false}}
257	1	ACTIVAR	usuarios	26	2026-04-01 04:25:00.846	{"antes": {"activo": false}, "despues": {"activo": true}}
258	26	LOGIN	usuarios	26	2026-04-01 04:25:01.294	null
259	1	CREAR	razas	18	2026-04-01 04:25:01.317	{"nombreRaza": "TestRaza"}
260	1	CREAR	animales	23	2026-04-01 04:25:01.338	{"raza": "Holstein", "numeroArete": "TEST-1775017499888"}
261	1	MODIFICAR	animales	23	2026-04-01 04:25:01.368	{"antes": {"idRaza": 1, "idAnimal": 23, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775017499888", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": null, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": null}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
262	1	BAJA	animales	23	2026-04-01 04:25:01.387	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775017499888", "estadoAnterior": "ACTIVO"}
263	1	CREAR	animales	24	2026-04-01 04:25:01.403	{"raza": "Simmental", "numeroArete": "SANI-1775017499888"}
264	26	CREAR	eventos_sanitarios	9	2026-04-01 04:25:01.429	{"tipo": "Vacuna", "animal": "SANI-1775017499888"}
265	1	APROBAR	eventos_sanitarios	9	2026-04-01 04:25:01.606	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
266	26	CREAR	calendario_sanitario	9	2026-04-01 04:25:01.634	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775017499888"}
267	26	COMPLETAR	calendario_sanitario	9	2026-04-01 04:25:01.671	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
268	1	CREAR	tipos_insumo	11	2026-04-01 04:25:01.692	{"nombreTipo": "Medicamentos", "descripcion": "Medicamentos veterinarios"}
269	1	CREAR	tipos_insumo	12	2026-04-01 04:25:01.697	{"nombreTipo": "Alimento"}
270	1	CREAR	insumos	11	2026-04-01 04:25:01.714	{"nombre": "Ivermectina 1%"}
271	1	MODIFICAR	insumos	11	2026-04-01 04:25:01.733	{"descripcion": "Antiparasitario inyectable actualizado"}
272	1	CREAR	insumos	12	2026-04-01 04:25:01.746	{"nombre": "Sal Mineral"}
273	1	SALIDA_INVENTARIO	movimientos_inventario	16	2026-04-01 04:25:01.762	{"insumo": "Sal Mineral", "cantidad": 25, "stockAntes": 100}
274	1	CREAR	usuarios	28	2026-04-01 04:25:02	{"rol": "Almacén", "username": "almacen_1775017499888", "nombreCompleto": "Encargado Almacén"}
275	28	LOGIN	usuarios	28	2026-04-01 04:25:02.225	null
276	28	CREAR	solicitudes_compra	11	2026-04-01 04:25:02.251	{"fecha": "2024-07-01", "numDetalles": 2}
277	1	APROBAR	solicitudes_compra	11	2026-04-01 04:25:02.325	{"nuevoEstado": "APROBADA", "estadoAnterior": "PENDIENTE"}
278	28	CREAR	solicitudes_compra	12	2026-04-01 04:25:02.34	{"fecha": "2024-07-02", "numDetalles": 1}
279	1	RECHAZAR	solicitudes_compra	12	2026-04-01 04:25:02.353	{"nuevoEstado": "RECHAZADA", "estadoAnterior": "PENDIENTE"}
280	1	CREAR	compras_realizadas	6	2026-04-01 04:25:02.393	{"totalReal": 1225, "idSolicitud": 11, "numDetalles": 2}
281	1	CREAR	lote_validacion_productiva	7	2026-04-01 04:25:02.435	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
285	1	CREAR	produccion_leche	5	2026-04-01 04:25:02.533	{"arete": "PROD-1775017499888", "fecha": "2024-06-10", "litros": 18.5}
287	1	CREAR	eventos_reproductivos	5	2026-04-01 04:25:02.569	{"arete": "PROD-1775017499888", "fecha": "2024-06-15", "tipoEvento": "PARTO"}
288	1	APROBAR	eventos_reproductivos	5	2026-04-01 04:25:02.593	{"nuevoEstado": "APROBADO"}
282	1	CREAR	animales	25	2026-04-01 04:25:02.462	{"raza": "Holstein", "numeroArete": "PROD-1775017499888"}
283	1	CREAR	registro_peso	6	2026-04-01 04:25:02.482	{"peso": 350, "arete": "PROD-1775017499888", "fecha": "2024-06-10"}
284	1	APROBAR	registro_peso	6	2026-04-01 04:25:02.513	{"nuevoEstado": "APROBADO"}
286	1	APROBAR	produccion_leche	5	2026-04-01 04:25:02.554	{"nuevoEstado": "APROBADO"}
289	1	APROBAR	lote_validacion_productiva	7	2026-04-01 04:25:02.618	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
290	1	LOGOUT	usuarios	1	2026-04-01 04:25:02.869	null
291	1	LOGIN	usuarios	1	2026-04-01 04:26:09.147	null
292	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 04:26:09.228	{"tipo": "sanitario", "filtros": {"formato": "json"}}
293	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 04:26:09.287	{"tipo": "productivo", "filtros": {"formato": "csv"}}
294	1	CONSULTAR_RESPALDOS	respaldos	0	2026-04-01 04:26:09.297	null
295	1	LOGIN	usuarios	1	2026-04-01 04:43:07.778	null
296	1	REFRESH_TOKEN	refresh_tokens	32	2026-04-01 04:43:08.044	null
297	1	CREAR	usuarios	29	2026-04-01 04:43:08.301	{"rol": "Médico Veterinario", "username": "vet_1775018587366", "nombreCompleto": "Dr. Veterinario Test"}
298	1	MODIFICAR	usuarios	29	2026-04-01 04:43:08.32	{"antes": {"idRol": 3, "username": "vet_1775018587366", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
299	1	DESACTIVAR	usuarios	29	2026-04-01 04:43:08.33	{"antes": {"activo": true}, "despues": {"activo": false}}
300	1	ACTIVAR	usuarios	29	2026-04-01 04:43:08.341	{"antes": {"activo": false}, "despues": {"activo": true}}
301	29	LOGIN	usuarios	29	2026-04-01 04:43:08.791	null
302	1	CREAR	razas	19	2026-04-01 04:43:08.816	{"nombreRaza": "TestRaza"}
303	1	CREAR	animales	26	2026-04-01 04:43:08.842	{"raza": "Holstein", "numeroArete": "TEST-1775018587366"}
304	1	MODIFICAR	animales	26	2026-04-01 04:43:08.879	{"antes": {"idRaza": 1, "idAnimal": 26, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775018587366", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": null, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": null}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
305	1	BAJA	animales	26	2026-04-01 04:43:08.907	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775018587366", "estadoAnterior": "ACTIVO"}
306	1	CREAR	animales	27	2026-04-01 04:43:08.941	{"raza": "Simmental", "numeroArete": "SANI-1775018587366"}
307	29	CREAR	eventos_sanitarios	10	2026-04-01 04:43:08.982	{"tipo": "Vacuna", "animal": "SANI-1775018587366"}
308	1	APROBAR	eventos_sanitarios	10	2026-04-01 04:43:09.162	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
309	29	CREAR	calendario_sanitario	10	2026-04-01 04:43:09.186	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775018587366"}
310	29	COMPLETAR	calendario_sanitario	10	2026-04-01 04:43:09.227	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
311	1	CREAR	tipos_insumo	13	2026-04-01 04:43:09.246	{"nombreTipo": "Medicamentos", "descripcion": "Medicamentos veterinarios"}
312	1	CREAR	tipos_insumo	14	2026-04-01 04:43:09.256	{"nombreTipo": "Alimento"}
313	1	CREAR	insumos	13	2026-04-01 04:43:09.285	{"nombre": "Ivermectina 1%"}
314	1	MODIFICAR	insumos	13	2026-04-01 04:43:09.31	{"descripcion": "Antiparasitario inyectable actualizado"}
315	1	CREAR	insumos	14	2026-04-01 04:43:09.33	{"nombre": "Sal Mineral"}
316	1	SALIDA_INVENTARIO	movimientos_inventario	19	2026-04-01 04:43:09.348	{"insumo": "Sal Mineral", "cantidad": 25, "stockAntes": 100}
317	1	CREAR	usuarios	31	2026-04-01 04:43:09.587	{"rol": "Almacén", "username": "almacen_1775018587366", "nombreCompleto": "Encargado Almacén"}
318	31	LOGIN	usuarios	31	2026-04-01 04:43:09.815	null
319	31	CREAR	solicitudes_compra	13	2026-04-01 04:43:09.844	{"fecha": "2024-07-01", "numDetalles": 2}
320	1	APROBAR	solicitudes_compra	13	2026-04-01 04:43:09.924	{"nuevoEstado": "APROBADA", "estadoAnterior": "PENDIENTE"}
321	31	CREAR	solicitudes_compra	14	2026-04-01 04:43:09.941	{"fecha": "2024-07-02", "numDetalles": 1}
322	1	RECHAZAR	solicitudes_compra	14	2026-04-01 04:43:09.954	{"nuevoEstado": "RECHAZADA", "estadoAnterior": "PENDIENTE"}
323	1	CREAR	compras_realizadas	7	2026-04-01 04:43:09.994	{"totalReal": 1225, "idSolicitud": 13, "numDetalles": 2}
324	1	CREAR	lote_validacion_productiva	8	2026-04-01 04:43:10.037	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
325	1	CREAR	animales	28	2026-04-01 04:43:10.066	{"raza": "Holstein", "numeroArete": "PROD-1775018587366"}
326	1	CREAR	registro_peso	7	2026-04-01 04:43:10.082	{"peso": 350, "arete": "PROD-1775018587366", "fecha": "2024-06-10"}
327	1	APROBAR	registro_peso	7	2026-04-01 04:43:10.111	{"nuevoEstado": "APROBADO"}
328	1	CREAR	produccion_leche	6	2026-04-01 04:43:10.136	{"arete": "PROD-1775018587366", "fecha": "2024-06-10", "litros": 18.5}
329	1	APROBAR	produccion_leche	6	2026-04-01 04:43:10.155	{"nuevoEstado": "APROBADO"}
330	1	CREAR	eventos_reproductivos	6	2026-04-01 04:43:10.173	{"arete": "PROD-1775018587366", "fecha": "2024-06-15", "tipoEvento": "PARTO"}
331	1	APROBAR	eventos_reproductivos	6	2026-04-01 04:43:10.198	{"nuevoEstado": "APROBADO"}
332	1	APROBAR	lote_validacion_productiva	8	2026-04-01 04:43:10.217	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
333	1	LOGOUT	usuarios	1	2026-04-01 04:43:10.341	null
334	1	LOGIN	usuarios	1	2026-04-01 04:43:10.694	null
335	1	CREAR	usuarios	32	2026-04-01 04:43:10.926	{"rol": "Producción", "username": "prod_f3_1775018590422", "nombreCompleto": "Produccion Fase 3"}
336	1	CREAR	usuarios	33	2026-04-01 04:43:11.153	{"rol": "Médico Veterinario", "username": "vet_f3_1775018590422", "nombreCompleto": "Veterinario Fase 3"}
337	1	CREAR	usuarios	34	2026-04-01 04:43:11.382	{"rol": "Almacén", "username": "alm_f3_1775018590422", "nombreCompleto": "Almacen Fase 3"}
338	32	LOGIN	usuarios	32	2026-04-01 04:43:11.612	null
339	33	LOGIN	usuarios	33	2026-04-01 04:43:11.835	null
340	34	LOGIN	usuarios	34	2026-04-01 04:43:12.056	null
341	1	CREAR	animales	29	2026-04-01 04:43:12.068	{"raza": "Holstein", "numeroArete": "F3-PROD-1775018590422"}
342	1	CREAR	lote_validacion_productiva	9	2026-04-01 04:43:12.077	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
343	32	CREAR	registro_peso	8	2026-04-01 04:43:12.097	{"peso": 355, "arete": "F3-PROD-1775018590422", "fecha": "2024-06-10"}
345	1	APROBAR	registro_peso	8	2026-04-01 04:43:12.133	{"nuevoEstado": "APROBADO"}
344	32	MODIFICAR	registro_peso	8	2026-04-01 04:43:12.112	{"antes": {"peso": "355", "fechaRegistro": "2024-06-10T00:00:00.000Z"}, "despues": {"peso": 360}}
346	32	CREAR	produccion_leche	7	2026-04-01 04:43:12.15	{"arete": "F3-PROD-1775018590422", "fecha": "2024-06-11", "litros": 19.2}
348	1	APROBAR	produccion_leche	7	2026-04-01 04:43:12.179	{"nuevoEstado": "APROBADO"}
354	34	CONSULTAR_REPORTE	reportes	0	2026-04-01 04:43:12.257	{"tipo": "administrativo", "filtros": {"formato": "json", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
355	1	CONSULTAR_RESPALDOS	respaldos	0	2026-04-01 04:43:12.263	null
347	32	MODIFICAR	produccion_leche	7	2026-04-01 04:43:12.161	{"antes": {"fechaRegistro": "2024-06-11T00:00:00.000Z", "litrosProducidos": "19.2"}, "despues": {"litrosProducidos": 20.1}}
349	32	CREAR	eventos_reproductivos	7	2026-04-01 04:43:12.19	{"arete": "F3-PROD-1775018590422", "fecha": "2024-06-12", "tipoEvento": "CELO"}
351	1	APROBAR	eventos_reproductivos	7	2026-04-01 04:43:12.216	{"nuevoEstado": "APROBADO"}
350	32	MODIFICAR	eventos_reproductivos	7	2026-04-01 04:43:12.201	{"antes": {"tipoEvento": "CELO", "fechaEvento": "2024-06-12T00:00:00.000Z"}, "despues": {"observaciones": "Observacion actualizada por produccion"}}
352	32	CONSULTAR_REPORTE	reportes	0	2026-04-01 04:43:12.228	{"tipo": "productivo", "filtros": {"formato": "json", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
353	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 04:43:12.243	{"tipo": "sanitario", "filtros": {"formato": "csv", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
356	1	RESPALDAR	respaldos	0	2026-04-01 04:43:12.336	{"manual": true}
357	1	LOGIN	usuarios	1	2026-04-01 04:43:35.793	null
358	1	LOGIN	usuarios	1	2026-04-01 04:43:36.04	null
359	1	LOGIN	usuarios	1	2026-04-01 05:11:09.573	null
360	1	LOGIN_FALLIDO	usuarios	1	2026-04-01 05:11:09.815	{"username": "admin", "bloqueado": false}
361	1	REFRESH_TOKEN	refresh_tokens	41	2026-04-01 05:11:09.849	null
362	1	CREAR	usuarios	35	2026-04-01 05:11:10.107	{"rol": "Médico Veterinario", "username": "vet_1775020269120", "nombreCompleto": "Dr. Veterinario Test"}
363	1	MODIFICAR	usuarios	35	2026-04-01 05:11:10.124	{"antes": {"idRol": 3, "username": "vet_1775020269120", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
364	1	DESACTIVAR	usuarios	35	2026-04-01 05:11:10.135	{"antes": {"activo": true, "bloqueadoHasta": null, "intentosFallidos": 0}, "despues": {"activo": false, "bloqueadoHasta": null, "intentosFallidos": 0}}
365	1	ACTIVAR	usuarios	35	2026-04-01 05:11:10.147	{"antes": {"activo": false, "bloqueadoHasta": null, "intentosFallidos": 0}, "despues": {"activo": true, "bloqueadoHasta": null, "intentosFallidos": 0}}
366	35	LOGIN	usuarios	35	2026-04-01 05:11:10.596	null
367	1	CREAR	razas	20	2026-04-01 05:11:10.621	{"nombreRaza": "TestRaza"}
368	1	CREAR	animales	30	2026-04-01 05:11:10.642	{"raza": "Holstein", "numeroArete": "TEST-1775020269120"}
369	1	MODIFICAR	animales	30	2026-04-01 05:11:10.675	{"antes": {"idRaza": 1, "idAnimal": 30, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775020269120", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": 18, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": "Sano al ingreso"}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
370	1	BAJA	animales	30	2026-04-01 05:11:10.693	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775020269120", "estadoAnterior": "ACTIVO"}
371	1	CREAR	animales	31	2026-04-01 05:11:10.708	{"raza": "Simmental", "numeroArete": "SANI-1775020269120"}
372	35	CREAR	calendario_sanitario	11	2026-04-01 05:11:10.813	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775020269120", "fechaAlerta": "2026-04-03T00:00:00.000Z"}
373	35	COMPLETAR	calendario_sanitario	11	2026-04-01 05:11:10.862	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
374	1	CREAR	tipos_insumo	15	2026-04-01 05:11:10.883	{"nombreTipo": "Medicamentos", "descripcion": "Medicamentos veterinarios"}
375	1	CREAR	tipos_insumo	16	2026-04-01 05:11:10.89	{"nombreTipo": "Alimento"}
376	1	CREAR	insumos	15	2026-04-01 05:11:10.905	{"nombre": "Ivermectina 1%"}
377	1	MODIFICAR	insumos	15	2026-04-01 05:11:10.927	{"descripcion": "Antiparasitario inyectable actualizado"}
378	1	CREAR	insumos	16	2026-04-01 05:11:10.943	{"nombre": "Sal Mineral"}
379	1	SALIDA_INVENTARIO	movimientos_inventario	22	2026-04-01 05:11:10.958	{"insumo": "Sal Mineral", "cantidad": 25, "stockAntes": 100}
380	1	CREAR	usuarios	37	2026-04-01 05:11:11.21	{"rol": "Almacén", "username": "almacen_1775020269120", "nombreCompleto": "Encargado Almacén"}
381	37	LOGIN	usuarios	37	2026-04-01 05:11:11.451	null
382	37	CREAR	solicitudes_compra	15	2026-04-01 05:11:11.479	{"fecha": "2024-07-01", "numDetalles": 2}
383	1	APROBAR	solicitudes_compra	15	2026-04-01 05:11:11.557	{"nuevoEstado": "APROBADA", "estadoAnterior": "PENDIENTE"}
384	37	CREAR	solicitudes_compra	16	2026-04-01 05:11:11.577	{"fecha": "2024-07-02", "numDetalles": 1}
385	1	RECHAZAR	solicitudes_compra	16	2026-04-01 05:11:11.59	{"nuevoEstado": "RECHAZADA", "estadoAnterior": "PENDIENTE"}
386	1	CREAR	compras_realizadas	8	2026-04-01 05:11:11.631	{"totalReal": 1225, "idSolicitud": 15, "numDetalles": 2}
387	1	CREAR	lote_validacion_productiva	10	2026-04-01 05:11:11.676	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
388	1	CREAR	animales	32	2026-04-01 05:11:11.708	{"raza": "Holstein", "numeroArete": "PROD-1775020269120"}
389	1	CREAR	registro_peso	9	2026-04-01 05:11:11.726	{"peso": 350, "arete": "PROD-1775020269120", "fecha": "2024-06-10"}
390	1	APROBAR	registro_peso	9	2026-04-01 05:11:11.756	{"nuevoEstado": "APROBADO"}
391	1	CREAR	produccion_leche	8	2026-04-01 05:11:11.783	{"arete": "PROD-1775020269120", "fecha": "2024-06-10", "litros": 18.5}
392	1	APROBAR	produccion_leche	8	2026-04-01 05:11:11.805	{"nuevoEstado": "APROBADO"}
393	1	CREAR	eventos_reproductivos	8	2026-04-01 05:11:11.822	{"arete": "PROD-1775020269120", "fecha": "2024-06-15", "tipoEvento": "PARTO"}
394	1	APROBAR	eventos_reproductivos	8	2026-04-01 05:11:11.846	{"nuevoEstado": "APROBADO"}
395	1	APROBAR	lote_validacion_productiva	10	2026-04-01 05:11:11.865	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
396	1	LOGOUT	usuarios	1	2026-04-01 05:11:12.14	null
397	1	LOGIN	usuarios	1	2026-04-01 05:11:12.489	null
398	1	CREAR	usuarios	38	2026-04-01 05:11:12.731	{"rol": "Producción", "username": "prod_f3_1775020272201", "nombreCompleto": "Produccion Fase 3"}
399	1	CREAR	usuarios	39	2026-04-01 05:11:12.991	{"rol": "Médico Veterinario", "username": "vet_f3_1775020272201", "nombreCompleto": "Veterinario Fase 3"}
400	1	CREAR	usuarios	40	2026-04-01 05:11:13.239	{"rol": "Almacén", "username": "alm_f3_1775020272201", "nombreCompleto": "Almacen Fase 3"}
401	38	LOGIN	usuarios	38	2026-04-01 05:11:13.491	null
402	39	LOGIN	usuarios	39	2026-04-01 05:11:13.728	null
403	40	LOGIN	usuarios	40	2026-04-01 05:11:13.966	null
404	1	CREAR	usuarios	41	2026-04-01 05:11:14.208	{"rol": "Producción", "username": "lock_f3_1775020272201", "nombreCompleto": "Usuario Lockout RF01"}
405	41	LOGIN_FALLIDO	usuarios	41	2026-04-01 05:11:14.461	{"username": "lock_f3_1775020272201", "bloqueado": false}
406	41	LOGIN_FALLIDO	usuarios	41	2026-04-01 05:11:14.684	{"username": "lock_f3_1775020272201", "bloqueado": false}
407	41	LOGIN_FALLIDO	usuarios	41	2026-04-01 05:11:14.945	{"username": "lock_f3_1775020272201", "bloqueado": false}
408	41	LOGIN_FALLIDO	usuarios	41	2026-04-01 05:11:15.194	{"username": "lock_f3_1775020272201", "bloqueado": false}
409	41	LOGIN_FALLIDO	usuarios	41	2026-04-01 05:11:15.468	{"username": "lock_f3_1775020272201", "bloqueado": true}
410	41	BLOQUEO_AUTOMATICO	usuarios	41	2026-04-01 05:11:15.47	{"motivo": "Intentos fallidos consecutivos de autenticacion"}
411	1	ACTIVAR	usuarios	41	2026-04-01 05:11:15.483	{"antes": {"activo": true, "bloqueadoHasta": "2026-04-01T05:41:15.427Z", "intentosFallidos": 0}, "despues": {"activo": true, "bloqueadoHasta": null, "intentosFallidos": 0}}
412	41	LOGIN	usuarios	41	2026-04-01 05:11:15.734	null
413	1	CREAR	animales	33	2026-04-01 05:11:15.745	{"raza": "Holstein", "numeroArete": "F3-PROD-1775020272201"}
414	1	CREAR	lote_validacion_productiva	11	2026-04-01 05:11:15.767	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
415	38	CREAR	registro_peso	10	2026-04-01 05:11:15.785	{"peso": 355, "arete": "F3-PROD-1775020272201", "fecha": "2024-06-10"}
416	38	MODIFICAR	registro_peso	10	2026-04-01 05:11:15.808	{"antes": {"peso": "355", "fechaRegistro": "2024-06-10T00:00:00.000Z"}, "despues": {"peso": 360}}
417	1	APROBAR	registro_peso	10	2026-04-01 05:11:15.827	{"nuevoEstado": "APROBADO"}
418	38	CREAR	produccion_leche	9	2026-04-01 05:11:15.84	{"arete": "F3-PROD-1775020272201", "fecha": "2024-06-11", "litros": 19.2}
419	38	MODIFICAR	produccion_leche	9	2026-04-01 05:11:15.852	{"antes": {"fechaRegistro": "2024-06-11T00:00:00.000Z", "litrosProducidos": "19.2"}, "despues": {"litrosProducidos": 20.1}}
420	1	APROBAR	produccion_leche	9	2026-04-01 05:11:15.865	{"nuevoEstado": "APROBADO"}
421	38	CREAR	eventos_reproductivos	9	2026-04-01 05:11:15.879	{"arete": "F3-PROD-1775020272201", "fecha": "2024-06-12", "tipoEvento": "CELO"}
422	38	MODIFICAR	eventos_reproductivos	9	2026-04-01 05:11:15.891	{"antes": {"tipoEvento": "CELO", "fechaEvento": "2024-06-12T00:00:00.000Z"}, "despues": {"observaciones": "Observacion actualizada por produccion"}}
423	1	APROBAR	eventos_reproductivos	9	2026-04-01 05:11:15.906	{"nuevoEstado": "APROBADO"}
424	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:11:16.084	{"tipo": "sanitario", "filtros": {"formato": "csv", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
425	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:11:16.114	{"tipo": "productivo", "filtros": {"formato": "pdf", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
426	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:11:16.129	{"tipo": "comparativo", "filtros": {"modulo": "productivo", "formato": "json", "periodoAFin": "2024-06-15", "periodoBFin": "2030-01-01", "periodoAInicio": "2024-01-01", "periodoBInicio": "2024-06-16"}}
427	1	CONSULTAR_RESPALDOS	respaldos	0	2026-04-01 05:11:16.135	null
428	1	RESPALDAR	respaldos	0	2026-04-01 05:11:16.193	{"manual": true}
429	1	LOGIN	usuarios	1	2026-04-01 05:12:16.034	null
430	1	LOGIN_FALLIDO	usuarios	1	2026-04-01 05:12:16.298	{"username": "admin", "bloqueado": false}
431	1	REFRESH_TOKEN	refresh_tokens	49	2026-04-01 05:12:16.334	null
432	1	CREAR	usuarios	42	2026-04-01 05:12:16.607	{"rol": "Médico Veterinario", "username": "vet_1775020335618", "nombreCompleto": "Dr. Veterinario Test"}
433	1	MODIFICAR	usuarios	42	2026-04-01 05:12:16.626	{"antes": {"idRol": 3, "username": "vet_1775020335618", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
434	1	DESACTIVAR	usuarios	42	2026-04-01 05:12:16.638	{"antes": {"activo": true, "bloqueadoHasta": null, "intentosFallidos": 0}, "despues": {"activo": false, "bloqueadoHasta": null, "intentosFallidos": 0}}
435	1	ACTIVAR	usuarios	42	2026-04-01 05:12:16.65	{"antes": {"activo": false, "bloqueadoHasta": null, "intentosFallidos": 0}, "despues": {"activo": true, "bloqueadoHasta": null, "intentosFallidos": 0}}
436	42	LOGIN	usuarios	42	2026-04-01 05:12:17.122	null
437	1	CREAR	razas	21	2026-04-01 05:12:17.147	{"nombreRaza": "TestRaza"}
438	1	CREAR	animales	34	2026-04-01 05:12:17.168	{"raza": "Holstein", "numeroArete": "TEST-1775020335618"}
439	1	MODIFICAR	animales	34	2026-04-01 05:12:17.197	{"antes": {"idRaza": 1, "idAnimal": 34, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775020335618", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": 18, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": "Sano al ingreso"}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
440	1	BAJA	animales	34	2026-04-01 05:12:17.214	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775020335618", "estadoAnterior": "ACTIVO"}
441	1	CREAR	animales	35	2026-04-01 05:12:17.229	{"raza": "Simmental", "numeroArete": "SANI-1775020335618"}
442	42	CREAR	eventos_sanitarios	11	2026-04-01 05:12:17.25	{"tipo": "Vacuna", "animal": "SANI-1775020335618"}
443	42	APROBAR	eventos_sanitarios	11	2026-04-01 05:12:17.359	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
444	42	CREAR	calendario_sanitario	12	2026-04-01 05:12:17.386	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775020335618", "fechaAlerta": "2026-04-03T00:00:00.000Z"}
445	42	COMPLETAR	calendario_sanitario	12	2026-04-01 05:12:17.425	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
446	1	CREAR	tipos_insumo	17	2026-04-01 05:12:17.445	{"nombreTipo": "Medicamentos", "descripcion": "Medicamentos veterinarios"}
447	1	CREAR	tipos_insumo	18	2026-04-01 05:12:17.452	{"nombreTipo": "Alimento"}
448	1	CREAR	insumos	17	2026-04-01 05:12:17.467	{"nombre": "Ivermectina 1%"}
449	1	MODIFICAR	insumos	17	2026-04-01 05:12:17.49	{"descripcion": "Antiparasitario inyectable actualizado"}
450	1	CREAR	insumos	18	2026-04-01 05:12:17.504	{"nombre": "Sal Mineral"}
451	1	SALIDA_INVENTARIO	movimientos_inventario	25	2026-04-01 05:12:17.521	{"insumo": "Sal Mineral", "cantidad": 25, "stockAntes": 100}
452	1	CREAR	usuarios	44	2026-04-01 05:12:17.788	{"rol": "Almacén", "username": "almacen_1775020335618", "nombreCompleto": "Encargado Almacén"}
453	44	LOGIN	usuarios	44	2026-04-01 05:12:18.033	null
454	44	CREAR	solicitudes_compra	17	2026-04-01 05:12:18.059	{"fecha": "2024-07-01", "numDetalles": 2}
455	1	APROBAR	solicitudes_compra	17	2026-04-01 05:12:18.14	{"nuevoEstado": "APROBADA", "estadoAnterior": "PENDIENTE"}
456	44	CREAR	solicitudes_compra	18	2026-04-01 05:12:18.159	{"fecha": "2024-07-02", "numDetalles": 1}
457	1	RECHAZAR	solicitudes_compra	18	2026-04-01 05:12:18.171	{"nuevoEstado": "RECHAZADA", "estadoAnterior": "PENDIENTE"}
458	1	CREAR	compras_realizadas	9	2026-04-01 05:12:18.216	{"totalReal": 1225, "idSolicitud": 17, "numDetalles": 2}
459	1	CREAR	lote_validacion_productiva	12	2026-04-01 05:12:18.263	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
460	1	CREAR	animales	36	2026-04-01 05:12:18.292	{"raza": "Holstein", "numeroArete": "PROD-1775020335618"}
461	1	CREAR	registro_peso	11	2026-04-01 05:12:18.31	{"peso": 350, "arete": "PROD-1775020335618", "fecha": "2024-06-10"}
462	1	APROBAR	registro_peso	11	2026-04-01 05:12:18.342	{"nuevoEstado": "APROBADO"}
463	1	CREAR	produccion_leche	10	2026-04-01 05:12:18.368	{"arete": "PROD-1775020335618", "fecha": "2024-06-10", "litros": 18.5}
501	47	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:12:22.268	{"tipo": "administrativo", "filtros": {"formato": "json", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
464	1	APROBAR	produccion_leche	10	2026-04-01 05:12:18.393	{"nuevoEstado": "APROBADO"}
503	1	CONSULTAR_RESPALDOS	respaldos	0	2026-04-01 05:12:22.285	null
465	1	CREAR	eventos_reproductivos	10	2026-04-01 05:12:18.407	{"arete": "PROD-1775020335618", "fecha": "2024-06-15", "tipoEvento": "PARTO"}
466	1	APROBAR	eventos_reproductivos	10	2026-04-01 05:12:18.432	{"nuevoEstado": "APROBADO"}
487	46	APROBAR	eventos_sanitarios	12	2026-04-01 05:12:22.049	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
488	1	CREAR	lote_validacion_productiva	13	2026-04-01 05:12:22.056	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
491	1	APROBAR	registro_peso	12	2026-04-01 05:12:22.11	{"nuevoEstado": "APROBADO"}
493	45	MODIFICAR	produccion_leche	11	2026-04-01 05:12:22.132	{"antes": {"fechaRegistro": "2024-06-11T00:00:00.000Z", "litrosProducidos": "19.2"}, "despues": {"litrosProducidos": 20.1}}
495	45	CREAR	eventos_reproductivos	11	2026-04-01 05:12:22.158	{"arete": "F3-PROD-1775020338685", "fecha": "2024-06-12", "tipoEvento": "CELO"}
467	1	APROBAR	lote_validacion_productiva	12	2026-04-01 05:12:18.453	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
468	1	LOGOUT	usuarios	1	2026-04-01 05:12:18.627	null
469	1	LOGIN	usuarios	1	2026-04-01 05:12:18.966	null
470	1	CREAR	usuarios	45	2026-04-01 05:12:19.217	{"rol": "Producción", "username": "prod_f3_1775020338685", "nombreCompleto": "Produccion Fase 3"}
471	1	CREAR	usuarios	46	2026-04-01 05:12:19.463	{"rol": "Médico Veterinario", "username": "vet_f3_1775020338685", "nombreCompleto": "Veterinario Fase 3"}
472	1	CREAR	usuarios	47	2026-04-01 05:12:19.696	{"rol": "Almacén", "username": "alm_f3_1775020338685", "nombreCompleto": "Almacen Fase 3"}
473	45	LOGIN	usuarios	45	2026-04-01 05:12:19.916	null
474	46	LOGIN	usuarios	46	2026-04-01 05:12:20.147	null
475	47	LOGIN	usuarios	47	2026-04-01 05:12:20.382	null
476	1	CREAR	usuarios	48	2026-04-01 05:12:20.617	{"rol": "Producción", "username": "lock_f3_1775020338685", "nombreCompleto": "Usuario Lockout RF01"}
477	48	LOGIN_FALLIDO	usuarios	48	2026-04-01 05:12:20.855	{"username": "lock_f3_1775020338685", "bloqueado": false}
478	48	LOGIN_FALLIDO	usuarios	48	2026-04-01 05:12:21.083	{"username": "lock_f3_1775020338685", "bloqueado": false}
479	48	LOGIN_FALLIDO	usuarios	48	2026-04-01 05:12:21.314	{"username": "lock_f3_1775020338685", "bloqueado": false}
480	48	LOGIN_FALLIDO	usuarios	48	2026-04-01 05:12:21.541	{"username": "lock_f3_1775020338685", "bloqueado": false}
481	48	LOGIN_FALLIDO	usuarios	48	2026-04-01 05:12:21.766	{"username": "lock_f3_1775020338685", "bloqueado": true}
482	48	BLOQUEO_AUTOMATICO	usuarios	48	2026-04-01 05:12:21.767	{"motivo": "Intentos fallidos consecutivos de autenticacion"}
483	1	ACTIVAR	usuarios	48	2026-04-01 05:12:21.782	{"antes": {"activo": true, "bloqueadoHasta": "2026-04-01T05:42:21.758Z", "intentosFallidos": 0}, "despues": {"activo": true, "bloqueadoHasta": null, "intentosFallidos": 0}}
484	48	LOGIN	usuarios	48	2026-04-01 05:12:22.004	null
485	1	CREAR	animales	37	2026-04-01 05:12:22.014	{"raza": "Holstein", "numeroArete": "F3-PROD-1775020338685"}
486	46	CREAR	eventos_sanitarios	12	2026-04-01 05:12:22.029	{"tipo": "Vacuna", "animal": "F3-PROD-1775020338685"}
489	45	CREAR	registro_peso	12	2026-04-01 05:12:22.073	{"peso": 355, "arete": "F3-PROD-1775020338685", "fecha": "2024-06-10"}
490	45	MODIFICAR	registro_peso	12	2026-04-01 05:12:22.091	{"antes": {"peso": "355", "fechaRegistro": "2024-06-10T00:00:00.000Z"}, "despues": {"peso": 360}}
492	45	CREAR	produccion_leche	11	2026-04-01 05:12:22.121	{"arete": "F3-PROD-1775020338685", "fecha": "2024-06-11", "litros": 19.2}
494	1	APROBAR	produccion_leche	11	2026-04-01 05:12:22.147	{"nuevoEstado": "APROBADO"}
496	45	MODIFICAR	eventos_reproductivos	11	2026-04-01 05:12:22.169	{"antes": {"tipoEvento": "CELO", "fechaEvento": "2024-06-12T00:00:00.000Z"}, "despues": {"observaciones": "Observacion actualizada por produccion"}}
497	1	APROBAR	eventos_reproductivos	11	2026-04-01 05:12:22.183	{"nuevoEstado": "APROBADO"}
498	45	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:12:22.21	{"tipo": "productivo", "filtros": {"formato": "json", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
499	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:12:22.223	{"tipo": "sanitario", "filtros": {"formato": "csv", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
500	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:12:22.255	{"tipo": "productivo", "filtros": {"formato": "pdf", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
502	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:12:22.278	{"tipo": "comparativo", "filtros": {"modulo": "productivo", "formato": "json", "periodoAFin": "2024-06-15", "periodoBFin": "2030-01-01", "periodoAInicio": "2024-01-01", "periodoBInicio": "2024-06-16"}}
504	1	RESPALDAR	respaldos	0	2026-04-01 05:12:22.345	{"manual": true}
505	1	LOGIN	usuarios	1	2026-04-01 05:12:42.425	null
506	1	LOGIN	usuarios	1	2026-04-01 05:13:16.453	null
507	1	LOGIN	usuarios	1	2026-04-01 05:13:16.687	null
508	1	LOGIN	usuarios	1	2026-04-01 05:13:28.602	null
509	1	LOGIN_FALLIDO	usuarios	1	2026-04-01 05:13:28.851	{"username": "admin", "bloqueado": false}
510	1	REFRESH_TOKEN	refresh_tokens	61	2026-04-01 05:13:28.888	null
511	1	CREAR	usuarios	49	2026-04-01 05:13:29.14	{"rol": "Médico Veterinario", "username": "vet_1775020408204", "nombreCompleto": "Dr. Veterinario Test"}
512	1	MODIFICAR	usuarios	49	2026-04-01 05:13:29.159	{"antes": {"idRol": 3, "username": "vet_1775020408204", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
513	1	DESACTIVAR	usuarios	49	2026-04-01 05:13:29.171	{"antes": {"activo": true, "bloqueadoHasta": null, "intentosFallidos": 0}, "despues": {"activo": false, "bloqueadoHasta": null, "intentosFallidos": 0}}
514	1	ACTIVAR	usuarios	49	2026-04-01 05:13:29.182	{"antes": {"activo": false, "bloqueadoHasta": null, "intentosFallidos": 0}, "despues": {"activo": true, "bloqueadoHasta": null, "intentosFallidos": 0}}
515	49	LOGIN	usuarios	49	2026-04-01 05:13:29.645	null
516	1	CREAR	razas	22	2026-04-01 05:13:29.67	{"nombreRaza": "TestRaza"}
517	1	CREAR	animales	38	2026-04-01 05:13:29.691	{"raza": "Holstein", "numeroArete": "TEST-1775020408204"}
518	1	MODIFICAR	animales	38	2026-04-01 05:13:29.723	{"antes": {"idRaza": 1, "idAnimal": 38, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775020408204", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": 18, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": "Sano al ingreso"}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
519	1	BAJA	animales	38	2026-04-01 05:13:29.74	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775020408204", "estadoAnterior": "ACTIVO"}
520	1	CREAR	animales	39	2026-04-01 05:13:29.756	{"raza": "Simmental", "numeroArete": "SANI-1775020408204"}
521	49	CREAR	eventos_sanitarios	13	2026-04-01 05:13:29.777	{"tipo": "Vacuna", "animal": "SANI-1775020408204"}
522	49	APROBAR	eventos_sanitarios	13	2026-04-01 05:13:29.869	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
523	49	CREAR	calendario_sanitario	13	2026-04-01 05:13:29.894	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775020408204", "fechaAlerta": "2026-04-03T00:00:00.000Z"}
524	49	COMPLETAR	calendario_sanitario	13	2026-04-01 05:13:29.933	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
525	1	CREAR	tipos_insumo	19	2026-04-01 05:13:29.953	{"nombreTipo": "Medicamentos", "descripcion": "Medicamentos veterinarios"}
526	1	CREAR	tipos_insumo	20	2026-04-01 05:13:29.961	{"nombreTipo": "Alimento"}
527	1	CREAR	insumos	19	2026-04-01 05:13:29.976	{"nombre": "Ivermectina 1%"}
528	1	MODIFICAR	insumos	19	2026-04-01 05:13:30	{"descripcion": "Antiparasitario inyectable actualizado"}
529	1	CREAR	insumos	20	2026-04-01 05:13:30.014	{"nombre": "Sal Mineral"}
530	1	SALIDA_INVENTARIO	movimientos_inventario	28	2026-04-01 05:13:30.029	{"insumo": "Sal Mineral", "cantidad": 25, "stockAntes": 100}
531	1	CREAR	usuarios	51	2026-04-01 05:13:30.269	{"rol": "Almacén", "username": "almacen_1775020408204", "nombreCompleto": "Encargado Almacén"}
532	51	LOGIN	usuarios	51	2026-04-01 05:13:30.495	null
533	51	CREAR	solicitudes_compra	19	2026-04-01 05:13:30.521	{"fecha": "2024-07-01", "numDetalles": 2}
535	51	CREAR	solicitudes_compra	20	2026-04-01 05:13:30.617	{"fecha": "2024-07-02", "numDetalles": 1}
539	1	CREAR	animales	40	2026-04-01 05:13:30.749	{"raza": "Holstein", "numeroArete": "PROD-1775020408204"}
546	1	APROBAR	lote_validacion_productiva	14	2026-04-01 05:13:30.903	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
581	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:13:34.65	{"tipo": "comparativo", "filtros": {"modulo": "productivo", "formato": "json", "periodoAFin": "2024-06-15", "periodoBFin": "2030-01-01", "periodoAInicio": "2024-01-01", "periodoBInicio": "2024-06-16"}}
534	1	APROBAR	solicitudes_compra	19	2026-04-01 05:13:30.598	{"nuevoEstado": "APROBADA", "estadoAnterior": "PENDIENTE"}
536	1	RECHAZAR	solicitudes_compra	20	2026-04-01 05:13:30.628	{"nuevoEstado": "RECHAZADA", "estadoAnterior": "PENDIENTE"}
545	1	APROBAR	eventos_reproductivos	12	2026-04-01 05:13:30.886	{"nuevoEstado": "APROBADO"}
537	1	CREAR	compras_realizadas	10	2026-04-01 05:13:30.676	{"totalReal": 1225, "idSolicitud": 19, "numDetalles": 2}
538	1	CREAR	lote_validacion_productiva	14	2026-04-01 05:13:30.72	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
540	1	CREAR	registro_peso	13	2026-04-01 05:13:30.766	{"peso": 350, "arete": "PROD-1775020408204", "fecha": "2024-06-10"}
541	1	APROBAR	registro_peso	13	2026-04-01 05:13:30.797	{"nuevoEstado": "APROBADO"}
542	1	CREAR	produccion_leche	12	2026-04-01 05:13:30.82	{"arete": "PROD-1775020408204", "fecha": "2024-06-10", "litros": 18.5}
543	1	APROBAR	produccion_leche	12	2026-04-01 05:13:30.846	{"nuevoEstado": "APROBADO"}
544	1	CREAR	eventos_reproductivos	12	2026-04-01 05:13:30.86	{"arete": "PROD-1775020408204", "fecha": "2024-06-15", "tipoEvento": "PARTO"}
547	1	LOGOUT	usuarios	1	2026-04-01 05:13:31.063	null
548	1	LOGIN	usuarios	1	2026-04-01 05:13:31.392	null
549	1	CREAR	usuarios	52	2026-04-01 05:13:31.622	{"rol": "Producción", "username": "prod_f3_1775020411120", "nombreCompleto": "Produccion Fase 3"}
550	1	CREAR	usuarios	53	2026-04-01 05:13:31.849	{"rol": "Médico Veterinario", "username": "vet_f3_1775020411120", "nombreCompleto": "Veterinario Fase 3"}
551	1	CREAR	usuarios	54	2026-04-01 05:13:32.082	{"rol": "Almacén", "username": "alm_f3_1775020411120", "nombreCompleto": "Almacen Fase 3"}
552	52	LOGIN	usuarios	52	2026-04-01 05:13:32.32	null
553	53	LOGIN	usuarios	53	2026-04-01 05:13:32.546	null
554	54	LOGIN	usuarios	54	2026-04-01 05:13:32.772	null
555	1	CREAR	usuarios	55	2026-04-01 05:13:32.994	{"rol": "Producción", "username": "lock_f3_1775020411120", "nombreCompleto": "Usuario Lockout RF01"}
556	55	LOGIN_FALLIDO	usuarios	55	2026-04-01 05:13:33.222	{"username": "lock_f3_1775020411120", "bloqueado": false}
557	55	LOGIN_FALLIDO	usuarios	55	2026-04-01 05:13:33.449	{"username": "lock_f3_1775020411120", "bloqueado": false}
558	55	LOGIN_FALLIDO	usuarios	55	2026-04-01 05:13:33.675	{"username": "lock_f3_1775020411120", "bloqueado": false}
559	55	LOGIN_FALLIDO	usuarios	55	2026-04-01 05:13:33.901	{"username": "lock_f3_1775020411120", "bloqueado": false}
560	55	LOGIN_FALLIDO	usuarios	55	2026-04-01 05:13:34.129	{"username": "lock_f3_1775020411120", "bloqueado": true}
561	55	BLOQUEO_AUTOMATICO	usuarios	55	2026-04-01 05:13:34.13	{"motivo": "Intentos fallidos consecutivos de autenticacion"}
562	1	ACTIVAR	usuarios	55	2026-04-01 05:13:34.143	{"antes": {"activo": true, "bloqueadoHasta": "2026-04-01T05:43:34.119Z", "intentosFallidos": 0}, "despues": {"activo": true, "bloqueadoHasta": null, "intentosFallidos": 0}}
563	55	LOGIN	usuarios	55	2026-04-01 05:13:34.379	null
564	1	CREAR	animales	41	2026-04-01 05:13:34.393	{"raza": "Holstein", "numeroArete": "F3-PROD-1775020411120"}
565	53	CREAR	eventos_sanitarios	14	2026-04-01 05:13:34.407	{"tipo": "Vacuna", "animal": "F3-PROD-1775020411120"}
566	53	APROBAR	eventos_sanitarios	14	2026-04-01 05:13:34.42	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
567	1	CREAR	lote_validacion_productiva	15	2026-04-01 05:13:34.429	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
568	52	CREAR	registro_peso	14	2026-04-01 05:13:34.445	{"peso": 355, "arete": "F3-PROD-1775020411120", "fecha": "2024-06-10"}
569	52	MODIFICAR	registro_peso	14	2026-04-01 05:13:34.46	{"antes": {"peso": "355", "fechaRegistro": "2024-06-10T00:00:00.000Z"}, "despues": {"peso": 360}}
570	1	APROBAR	registro_peso	14	2026-04-01 05:13:34.48	{"nuevoEstado": "APROBADO"}
571	52	CREAR	produccion_leche	13	2026-04-01 05:13:34.492	{"arete": "F3-PROD-1775020411120", "fecha": "2024-06-11", "litros": 19.2}
572	52	MODIFICAR	produccion_leche	13	2026-04-01 05:13:34.504	{"antes": {"fechaRegistro": "2024-06-11T00:00:00.000Z", "litrosProducidos": "19.2"}, "despues": {"litrosProducidos": 20.1}}
573	1	APROBAR	produccion_leche	13	2026-04-01 05:13:34.519	{"nuevoEstado": "APROBADO"}
574	52	CREAR	eventos_reproductivos	13	2026-04-01 05:13:34.53	{"arete": "F3-PROD-1775020411120", "fecha": "2024-06-12", "tipoEvento": "CELO"}
575	52	MODIFICAR	eventos_reproductivos	13	2026-04-01 05:13:34.541	{"antes": {"tipoEvento": "CELO", "fechaEvento": "2024-06-12T00:00:00.000Z"}, "despues": {"observaciones": "Observacion actualizada por produccion"}}
576	1	APROBAR	eventos_reproductivos	13	2026-04-01 05:13:34.554	{"nuevoEstado": "APROBADO"}
577	52	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:13:34.583	{"tipo": "productivo", "filtros": {"formato": "json", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
578	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:13:34.595	{"tipo": "sanitario", "filtros": {"formato": "csv", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
579	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:13:34.627	{"tipo": "productivo", "filtros": {"formato": "pdf", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
580	54	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:13:34.639	{"tipo": "administrativo", "filtros": {"formato": "json", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
582	1	CONSULTAR_RESPALDOS	respaldos	0	2026-04-01 05:13:34.655	null
583	1	RESPALDAR	respaldos	0	2026-04-01 05:13:34.724	{"manual": true}
584	1	LOGIN	usuarios	1	2026-04-01 05:30:43.724	null
585	1	LOGIN_FALLIDO	usuarios	1	2026-04-01 05:30:43.98	{"username": "admin", "bloqueado": false}
586	1	REFRESH_TOKEN	refresh_tokens	69	2026-04-01 05:30:44.018	null
587	1	CREAR	usuarios	56	2026-04-01 05:30:44.275	{"rol": "Médico Veterinario", "username": "vet_1775021443296", "nombreCompleto": "Dr. Veterinario Test"}
588	1	MODIFICAR	usuarios	56	2026-04-01 05:30:44.294	{"antes": {"idRol": 3, "username": "vet_1775021443296", "nombreCompleto": "Dr. Veterinario Test"}, "despues": {"nombreCompleto": "Dr. Veterinario Actualizado"}}
589	1	DESACTIVAR	usuarios	56	2026-04-01 05:30:44.306	{"antes": {"activo": true, "bloqueadoHasta": null, "intentosFallidos": 0}, "despues": {"activo": false, "bloqueadoHasta": null, "intentosFallidos": 0}}
590	1	ACTIVAR	usuarios	56	2026-04-01 05:30:44.318	{"antes": {"activo": false, "bloqueadoHasta": null, "intentosFallidos": 0}, "despues": {"activo": true, "bloqueadoHasta": null, "intentosFallidos": 0}}
591	56	LOGIN	usuarios	56	2026-04-01 05:30:44.765	null
592	1	CREAR	razas	23	2026-04-01 05:30:44.79	{"nombreRaza": "TestRaza"}
593	1	CREAR	animales	42	2026-04-01 05:30:44.81	{"raza": "Holstein", "numeroArete": "TEST-1775021443296"}
650	59	CREAR	eventos_reproductivos	15	2026-04-01 05:30:49.81	{"arete": "F3-PROD-1775021446347", "fecha": "2024-06-12", "tipoEvento": "CELO"}
594	1	MODIFICAR	animales	42	2026-04-01 05:30:44.841	{"antes": {"idRaza": 1, "idAnimal": 42, "fechaBaja": null, "motivoBaja": null, "numeroArete": "TEST-1775021443296", "pesoInicial": "350.5", "procedencia": "Rancho Externo", "edadEstimada": 18, "estadoActual": "ACTIVO", "fechaIngreso": "2024-01-15T00:00:00.000Z", "estadoSanitarioInicial": "Sano al ingreso"}, "despues": {"procedencia": "Rancho Los Alpes - Sector Norte", "edadEstimada": 24}}
595	1	BAJA	animales	42	2026-04-01 05:30:44.859	{"fechaBaja": "2024-06-15", "motivoBaja": "Venta programada para prueba", "nuevoEstado": "VENDIDO", "numeroArete": "TEST-1775021443296", "estadoAnterior": "ACTIVO"}
596	1	CREAR	animales	43	2026-04-01 05:30:44.875	{"raza": "Simmental", "numeroArete": "SANI-1775021443296"}
597	56	CREAR	eventos_sanitarios	15	2026-04-01 05:30:44.9	{"tipo": "Vacuna", "animal": "SANI-1775021443296"}
598	56	APROBAR	eventos_sanitarios	15	2026-04-01 05:30:45.081	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
599	56	CREAR	calendario_sanitario	14	2026-04-01 05:30:45.107	{"tipo": "Enfermedad", "fecha": "2026-04-06", "animal": "SANI-1775021443296", "fechaAlerta": "2026-04-03T00:00:00.000Z"}
600	56	COMPLETAR	calendario_sanitario	14	2026-04-01 05:30:45.149	{"nuevoEstado": "COMPLETADO", "estadoAnterior": "PENDIENTE"}
601	1	CREAR	tipos_insumo	21	2026-04-01 05:30:45.173	{"nombreTipo": "Medicamentos", "descripcion": "Medicamentos veterinarios"}
602	1	CREAR	tipos_insumo	22	2026-04-01 05:30:45.178	{"nombreTipo": "Alimento"}
603	1	CREAR	insumos	21	2026-04-01 05:30:45.194	{"nombre": "Ivermectina 1%"}
604	1	MODIFICAR	insumos	21	2026-04-01 05:30:45.218	{"descripcion": "Antiparasitario inyectable actualizado"}
605	1	CREAR	insumos	22	2026-04-01 05:30:45.233	{"nombre": "Sal Mineral"}
606	1	SALIDA_INVENTARIO	movimientos_inventario	31	2026-04-01 05:30:45.249	{"insumo": "Sal Mineral", "cantidad": 25, "stockAntes": 100}
607	1	CREAR	usuarios	58	2026-04-01 05:30:45.485	{"rol": "Almacén", "username": "almacen_1775021443296", "nombreCompleto": "Encargado Almacén"}
608	58	LOGIN	usuarios	58	2026-04-01 05:30:45.71	null
609	58	CREAR	solicitudes_compra	21	2026-04-01 05:30:45.738	{"fecha": "2024-07-01", "numDetalles": 2}
610	1	APROBAR	solicitudes_compra	21	2026-04-01 05:30:45.819	{"nuevoEstado": "APROBADA", "estadoAnterior": "PENDIENTE"}
611	58	CREAR	solicitudes_compra	22	2026-04-01 05:30:45.836	{"fecha": "2024-07-02", "numDetalles": 1}
612	1	RECHAZAR	solicitudes_compra	22	2026-04-01 05:30:45.848	{"nuevoEstado": "RECHAZADA", "estadoAnterior": "PENDIENTE"}
613	1	CREAR	compras_realizadas	11	2026-04-01 05:30:45.885	{"totalReal": 1225, "idSolicitud": 21, "numDetalles": 2}
614	1	CREAR	lote_validacion_productiva	16	2026-04-01 05:30:45.931	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
615	1	CREAR	animales	44	2026-04-01 05:30:45.96	{"raza": "Holstein", "numeroArete": "PROD-1775021443296"}
616	1	CREAR	registro_peso	15	2026-04-01 05:30:45.981	{"peso": 350, "arete": "PROD-1775021443296", "fecha": "2024-06-10"}
617	1	APROBAR	registro_peso	15	2026-04-01 05:30:46.013	{"nuevoEstado": "APROBADO"}
618	1	CREAR	produccion_leche	14	2026-04-01 05:30:46.042	{"arete": "PROD-1775021443296", "fecha": "2024-06-10", "litros": 18.5}
619	1	APROBAR	produccion_leche	14	2026-04-01 05:30:46.063	{"nuevoEstado": "APROBADO"}
620	1	CREAR	eventos_reproductivos	14	2026-04-01 05:30:46.08	{"arete": "PROD-1775021443296", "fecha": "2024-06-15", "tipoEvento": "PARTO"}
621	1	APROBAR	eventos_reproductivos	14	2026-04-01 05:30:46.104	{"nuevoEstado": "APROBADO"}
622	1	APROBAR	lote_validacion_productiva	16	2026-04-01 05:30:46.126	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
623	1	LOGOUT	usuarios	1	2026-04-01 05:30:46.289	null
624	1	LOGIN	usuarios	1	2026-04-01 05:30:46.644	null
625	1	CREAR	usuarios	59	2026-04-01 05:30:46.895	{"rol": "Producción", "username": "prod_f3_1775021446347", "nombreCompleto": "Produccion Fase 3"}
626	1	CREAR	usuarios	60	2026-04-01 05:30:47.125	{"rol": "Médico Veterinario", "username": "vet_f3_1775021446347", "nombreCompleto": "Veterinario Fase 3"}
627	1	CREAR	usuarios	61	2026-04-01 05:30:47.354	{"rol": "Almacén", "username": "alm_f3_1775021446347", "nombreCompleto": "Almacen Fase 3"}
628	59	LOGIN	usuarios	59	2026-04-01 05:30:47.595	null
629	60	LOGIN	usuarios	60	2026-04-01 05:30:47.836	null
630	61	LOGIN	usuarios	61	2026-04-01 05:30:48.064	null
631	1	CREAR	usuarios	62	2026-04-01 05:30:48.289	{"rol": "Producción", "username": "lock_f3_1775021446347", "nombreCompleto": "Usuario Lockout RF01"}
632	62	LOGIN_FALLIDO	usuarios	62	2026-04-01 05:30:48.514	{"username": "lock_f3_1775021446347", "bloqueado": false}
633	62	LOGIN_FALLIDO	usuarios	62	2026-04-01 05:30:48.75	{"username": "lock_f3_1775021446347", "bloqueado": false}
634	62	LOGIN_FALLIDO	usuarios	62	2026-04-01 05:30:48.972	{"username": "lock_f3_1775021446347", "bloqueado": false}
635	62	LOGIN_FALLIDO	usuarios	62	2026-04-01 05:30:49.193	{"username": "lock_f3_1775021446347", "bloqueado": false}
636	62	LOGIN_FALLIDO	usuarios	62	2026-04-01 05:30:49.416	{"username": "lock_f3_1775021446347", "bloqueado": true}
637	62	BLOQUEO_AUTOMATICO	usuarios	62	2026-04-01 05:30:49.417	{"motivo": "Intentos fallidos consecutivos de autenticacion"}
638	1	ACTIVAR	usuarios	62	2026-04-01 05:30:49.433	{"antes": {"activo": true, "bloqueadoHasta": "2026-04-01T06:00:49.413Z", "intentosFallidos": 0}, "despues": {"activo": true, "bloqueadoHasta": null, "intentosFallidos": 0}}
639	62	LOGIN	usuarios	62	2026-04-01 05:30:49.655	null
640	1	CREAR	animales	45	2026-04-01 05:30:49.666	{"raza": "Holstein", "numeroArete": "F3-PROD-1775021446347"}
641	60	CREAR	eventos_sanitarios	16	2026-04-01 05:30:49.678	{"tipo": "Vacuna", "animal": "F3-PROD-1775021446347"}
642	60	APROBAR	eventos_sanitarios	16	2026-04-01 05:30:49.694	{"nuevoEstado": "APROBADO", "estadoAnterior": "PENDIENTE"}
643	1	CREAR	lote_validacion_productiva	17	2026-04-01 05:30:49.703	{"fechaFin": "2024-06-30", "fechaInicio": "2024-06-01"}
644	59	CREAR	registro_peso	16	2026-04-01 05:30:49.719	{"peso": 355, "arete": "F3-PROD-1775021446347", "fecha": "2024-06-10"}
645	59	MODIFICAR	registro_peso	16	2026-04-01 05:30:49.735	{"antes": {"peso": "355", "fechaRegistro": "2024-06-10T00:00:00.000Z"}, "despues": {"peso": 360}}
646	1	APROBAR	registro_peso	16	2026-04-01 05:30:49.754	{"nuevoEstado": "APROBADO"}
647	59	CREAR	produccion_leche	15	2026-04-01 05:30:49.766	{"arete": "F3-PROD-1775021446347", "fecha": "2024-06-11", "litros": 19.2}
658	1	CONSULTAR_RESPALDOS	respaldos	0	2026-04-01 05:30:50.081	null
648	59	MODIFICAR	produccion_leche	15	2026-04-01 05:30:49.776	{"antes": {"fechaRegistro": "2024-06-11T00:00:00.000Z", "litrosProducidos": "19.2"}, "despues": {"litrosProducidos": 20.1}}
649	1	APROBAR	produccion_leche	15	2026-04-01 05:30:49.794	{"nuevoEstado": "APROBADO"}
651	59	MODIFICAR	eventos_reproductivos	15	2026-04-01 05:30:49.825	{"antes": {"tipoEvento": "CELO", "fechaEvento": "2024-06-12T00:00:00.000Z"}, "despues": {"observaciones": "Observacion actualizada por produccion"}}
652	1	APROBAR	eventos_reproductivos	15	2026-04-01 05:30:49.839	{"nuevoEstado": "APROBADO"}
653	59	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:30:50.005	{"tipo": "productivo", "filtros": {"formato": "json", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
654	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:30:50.019	{"tipo": "sanitario", "filtros": {"formato": "csv", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
656	61	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:30:50.064	{"tipo": "administrativo", "filtros": {"formato": "json", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
655	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:30:50.05	{"tipo": "productivo", "filtros": {"formato": "pdf", "fechaFin": "2030-01-01", "fechaInicio": "2024-01-01"}}
657	1	CONSULTAR_REPORTE	reportes	0	2026-04-01 05:30:50.075	{"tipo": "comparativo", "filtros": {"modulo": "productivo", "formato": "json", "periodoAFin": "2024-06-15", "periodoBFin": "2030-01-01", "periodoAInicio": "2024-01-01", "periodoBInicio": "2024-06-16"}}
659	1	RESPALDAR	respaldos	0	2026-04-01 05:30:50.142	{"manual": true}
660	1	LOGIN	usuarios	1	2026-04-01 05:31:10.589	null
661	1	LOGIN	usuarios	1	2026-04-01 05:31:10.83	null
662	1	LOGIN	usuarios	1	2026-04-01 05:39:29.724	null
663	1	REFRESH_TOKEN	refresh_tokens	79	2026-04-01 05:39:29.767	null
664	1	LOGOUT	usuarios	1	2026-04-01 05:39:29.78	null
665	1	LOGIN_FALLIDO	usuarios	1	2026-04-01 05:39:30.025	{"username": "admin", "bloqueado": false}
666	1	LOGIN	usuarios	1	2026-04-01 05:40:20.079	null
667	1	REFRESH_TOKEN	refresh_tokens	80	2026-04-01 05:40:20.118	null
668	1	LOGOUT	usuarios	1	2026-04-01 05:40:20.13	null
669	1	LOGIN_FALLIDO	usuarios	1	2026-04-01 05:40:20.369	{"username": "admin", "bloqueado": false}
670	1	LOGIN	usuarios	1	2026-04-01 05:51:04.694	null
671	1	LOGOUT	usuarios	1	2026-04-01 05:51:12.539	null
672	1	LOGOUT	usuarios	1	2026-04-01 05:51:13.454	null
673	1	LOGOUT	usuarios	1	2026-04-01 05:51:14.043	null
674	1	LOGOUT	usuarios	1	2026-04-01 05:51:14.478	null
675	1	LOGOUT	usuarios	1	2026-04-01 05:51:14.701	null
676	1	LOGOUT	usuarios	1	2026-04-01 05:51:14.875	null
677	1	LOGOUT	usuarios	1	2026-04-01 05:51:15.054	null
678	1	LOGOUT	usuarios	1	2026-04-01 05:51:15.23	null
679	1	LOGOUT	usuarios	1	2026-04-01 05:52:04.992	null
680	1	LOGOUT	usuarios	1	2026-04-01 05:52:05.504	null
681	1	LOGOUT	usuarios	1	2026-04-01 05:52:05.703	null
682	1	LOGOUT	usuarios	1	2026-04-01 05:52:05.867	null
683	1	LOGOUT	usuarios	1	2026-04-01 05:52:06.054	null
684	1	LOGOUT	usuarios	1	2026-04-01 05:52:06.248	null
685	1	LOGOUT	usuarios	1	2026-04-01 05:52:16.019	null
686	1	LOGOUT	usuarios	1	2026-04-01 05:52:37.099	null
687	1	LOGOUT	usuarios	1	2026-04-01 05:52:37.305	null
688	1	LOGOUT	usuarios	1	2026-04-01 05:52:37.5	null
689	1	LOGOUT	usuarios	1	2026-04-01 05:52:40.423	null
690	1	LOGOUT	usuarios	1	2026-04-01 05:52:40.598	null
691	1	LOGOUT	usuarios	1	2026-04-01 05:52:40.763	null
692	1	LOGOUT	usuarios	1	2026-04-01 05:52:40.962	null
693	1	LOGOUT	usuarios	1	2026-04-01 05:53:36.795	null
694	1	LOGOUT	usuarios	1	2026-04-01 05:53:37.071	null
695	1	LOGOUT	usuarios	1	2026-04-01 05:56:29.738	null
696	1	LOGIN	usuarios	1	2026-04-01 05:56:45.169	null
697	1	LOGOUT	usuarios	1	2026-04-01 05:56:46.173	null
698	1	LOGIN	usuarios	1	2026-04-01 06:10:40.445	null
699	1	LOGOUT	usuarios	1	2026-04-01 06:10:44.107	null
\.


--
-- TOC entry 5291 (class 0 OID 52787)
-- Dependencies: 236
-- Data for Name: calendario_sanitario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calendario_sanitario (id_calendario, id_animal, id_tipo_evento, fecha_programada, fecha_alerta, programado_por, estado) FROM stdin;
1	2	2	2026-04-05	\N	2	COMPLETADO
2	4	2	2026-04-06	\N	6	COMPLETADO
3	6	2	2026-04-06	\N	8	COMPLETADO
4	8	2	2026-04-06	\N	10	COMPLETADO
5	11	2	2026-04-06	\N	13	COMPLETADO
6	14	2	2026-04-06	\N	16	COMPLETADO
7	17	2	2026-04-06	\N	19	COMPLETADO
8	21	2	2026-04-06	\N	23	COMPLETADO
9	24	2	2026-04-06	\N	26	COMPLETADO
10	27	2	2026-04-06	\N	29	COMPLETADO
11	31	2	2026-04-06	2026-04-03	35	COMPLETADO
12	35	2	2026-04-06	2026-04-03	42	COMPLETADO
13	39	2	2026-04-06	2026-04-03	49	COMPLETADO
14	43	2	2026-04-06	2026-04-03	56	COMPLETADO
\.


--
-- TOC entry 5309 (class 0 OID 52986)
-- Dependencies: 254
-- Data for Name: compras_realizadas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compras_realizadas (id_compra, id_solicitud, fecha_compra, realizada_por, total_real) FROM stdin;
1	1	2024-07-05	1	1225.000000000000000000000000000000
2	3	2024-07-05	1	1225.000000000000000000000000000000
3	5	2024-07-05	1	1225.000000000000000000000000000000
4	7	2024-07-05	1	1225.000000000000000000000000000000
5	9	2024-07-05	1	1225.000000000000000000000000000000
6	11	2024-07-05	1	1225.000000000000000000000000000000
7	13	2024-07-05	1	1225.000000000000000000000000000000
8	15	2024-07-05	1	1225.000000000000000000000000000000
9	17	2024-07-05	1	1225.000000000000000000000000000000
10	19	2024-07-05	1	1225.000000000000000000000000000000
11	21	2024-07-05	1	1225.000000000000000000000000000000
\.


--
-- TOC entry 5311 (class 0 OID 53006)
-- Dependencies: 256
-- Data for Name: detalle_compra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_compra (id_detalle_compra, id_compra, id_insumo, cantidad_real, precio_unitario, subtotal) FROM stdin;
1	1	1	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
2	1	2	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
3	2	3	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
4	2	4	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
5	3	5	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
6	3	6	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
7	4	7	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
8	4	8	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
9	5	9	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
10	5	10	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
11	6	11	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
12	6	12	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
13	7	13	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
14	7	14	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
15	8	15	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
16	8	16	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
17	9	17	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
18	9	18	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
19	10	19	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
20	10	20	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
21	11	21	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
22	11	22	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
\.


--
-- TOC entry 5307 (class 0 OID 52966)
-- Dependencies: 252
-- Data for Name: detalle_solicitud_compra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_solicitud_compra (id_detalle, id_solicitud, id_insumo, cantidad, precio_estimado, subtotal_estimado) FROM stdin;
1	1	1	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
2	1	2	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
3	2	1	5.000000000000000000000000000000	10.000000000000000000000000000000	50.000000000000000000000000000000
4	3	3	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
5	3	4	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
6	4	3	5.000000000000000000000000000000	10.000000000000000000000000000000	50.000000000000000000000000000000
7	5	5	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
8	5	6	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
9	6	5	5.000000000000000000000000000000	10.000000000000000000000000000000	50.000000000000000000000000000000
10	7	7	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
11	7	8	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
12	8	7	5.000000000000000000000000000000	10.000000000000000000000000000000	50.000000000000000000000000000000
13	9	9	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
14	9	10	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
15	10	9	5.000000000000000000000000000000	10.000000000000000000000000000000	50.000000000000000000000000000000
16	11	11	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
17	11	12	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
18	12	11	5.000000000000000000000000000000	10.000000000000000000000000000000	50.000000000000000000000000000000
19	13	13	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
20	13	14	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
21	14	13	5.000000000000000000000000000000	10.000000000000000000000000000000	50.000000000000000000000000000000
22	15	15	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
23	15	16	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
24	16	15	5.000000000000000000000000000000	10.000000000000000000000000000000	50.000000000000000000000000000000
25	17	17	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
26	17	18	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
27	18	17	5.000000000000000000000000000000	10.000000000000000000000000000000	50.000000000000000000000000000000
28	19	19	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
29	19	20	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
30	20	19	5.000000000000000000000000000000	10.000000000000000000000000000000	50.000000000000000000000000000000
31	21	21	50.000000000000000000000000000000	12.500000000000000000000000000000	625.000000000000000000000000000000
32	21	22	200.000000000000000000000000000000	3.000000000000000000000000000000	600.000000000000000000000000000000
33	22	21	5.000000000000000000000000000000	10.000000000000000000000000000000	50.000000000000000000000000000000
\.


--
-- TOC entry 5299 (class 0 OID 52884)
-- Dependencies: 244
-- Data for Name: eventos_reproductivos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eventos_reproductivos (id_evento_reproductivo, id_animal, id_lote, tipo_evento, fecha_evento, observaciones, registrado_por, estado_validacion, validado_por) FROM stdin;
1	12	2	PARTO	2024-06-15	Parto normal sin complicaciones	1	APROBADO	1
2	15	3	PARTO	2024-06-15	Parto normal sin complicaciones	1	APROBADO	1
3	18	4	PARTO	2024-06-15	Parto normal sin complicaciones	1	APROBADO	1
4	22	6	PARTO	2024-06-15	Parto normal sin complicaciones	1	APROBADO	1
5	25	7	PARTO	2024-06-15	Parto normal sin complicaciones	1	APROBADO	1
6	28	8	PARTO	2024-06-15	Parto normal sin complicaciones	1	APROBADO	1
7	29	9	CELO	2024-06-12	Observacion actualizada por produccion	32	APROBADO	1
8	32	10	PARTO	2024-06-15	Parto normal sin complicaciones	1	APROBADO	1
9	33	11	CELO	2024-06-12	Observacion actualizada por produccion	38	APROBADO	1
10	36	12	PARTO	2024-06-15	Parto normal sin complicaciones	1	APROBADO	1
11	37	13	CELO	2024-06-12	Observacion actualizada por produccion	45	APROBADO	1
12	40	14	PARTO	2024-06-15	Parto normal sin complicaciones	1	APROBADO	1
13	41	15	CELO	2024-06-12	Observacion actualizada por produccion	52	APROBADO	1
14	44	16	PARTO	2024-06-15	Parto normal sin complicaciones	1	APROBADO	1
15	45	17	CELO	2024-06-12	Observacion actualizada por produccion	59	APROBADO	1
\.


--
-- TOC entry 5289 (class 0 OID 52762)
-- Dependencies: 234
-- Data for Name: eventos_sanitarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eventos_sanitarios (id_evento, id_animal, id_tipo_evento, fecha_evento, diagnostico, medicamento, dosis, estado_aprobacion, autorizado_por) FROM stdin;
1	2	1	2024-03-15	\N	\N	\N	APROBADO	1
2	4	1	2024-03-15	\N	\N	\N	APROBADO	1
3	6	1	2024-03-15	\N	\N	\N	APROBADO	1
4	8	1	2024-03-15	\N	\N	\N	APROBADO	1
5	11	1	2024-03-15	\N	\N	\N	APROBADO	1
6	14	1	2024-03-15	\N	\N	\N	APROBADO	1
7	17	1	2024-03-15	\N	\N	\N	APROBADO	1
8	21	1	2024-03-15	\N	\N	\N	APROBADO	1
9	24	1	2024-03-15	\N	\N	\N	APROBADO	1
10	27	1	2024-03-15	\N	\N	\N	APROBADO	1
11	35	1	2024-03-15	\N	\N	\N	APROBADO	42
12	37	1	2024-06-09	Vacunacion preventiva	\N	\N	APROBADO	46
13	39	1	2024-03-15	\N	\N	\N	APROBADO	49
14	41	1	2024-06-09	Vacunacion preventiva	\N	\N	APROBADO	53
15	43	1	2024-03-15	\N	\N	\N	APROBADO	56
16	45	1	2024-06-09	Vacunacion preventiva	\N	\N	APROBADO	60
\.


--
-- TOC entry 5301 (class 0 OID 52914)
-- Dependencies: 246
-- Data for Name: insumos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.insumos (id_insumo, nombre_insumo, id_tipo_insumo, unidad_medida, descripcion, stock_actual, activo) FROM stdin;
1	Ivermectina 1%	1	ml	Antiparasitario inyectable actualizado	50.000000000000000000000000000000	t
2	Sal Mineral	2	kg	\N	275.000000000000000000000000000000	t
3	Ivermectina 1%	3	ml	Antiparasitario inyectable actualizado	50.000000000000000000000000000000	t
4	Sal Mineral	4	kg	\N	275.000000000000000000000000000000	t
5	Ivermectina 1%	5	ml	Antiparasitario inyectable actualizado	50.000000000000000000000000000000	t
6	Sal Mineral	6	kg	\N	275.000000000000000000000000000000	t
7	Ivermectina 1%	7	ml	Antiparasitario inyectable actualizado	50.000000000000000000000000000000	t
8	Sal Mineral	8	kg	\N	275.000000000000000000000000000000	t
9	Ivermectina 1%	9	ml	Antiparasitario inyectable actualizado	50.000000000000000000000000000000	t
10	Sal Mineral	10	kg	\N	275.000000000000000000000000000000	t
11	Ivermectina 1%	11	ml	Antiparasitario inyectable actualizado	50.000000000000000000000000000000	t
12	Sal Mineral	12	kg	\N	275.000000000000000000000000000000	t
13	Ivermectina 1%	13	ml	Antiparasitario inyectable actualizado	50.000000000000000000000000000000	t
14	Sal Mineral	14	kg	\N	275.000000000000000000000000000000	t
15	Ivermectina 1%	15	ml	Antiparasitario inyectable actualizado	50.000000000000000000000000000000	t
16	Sal Mineral	16	kg	\N	275.000000000000000000000000000000	t
17	Ivermectina 1%	17	ml	Antiparasitario inyectable actualizado	50.000000000000000000000000000000	t
18	Sal Mineral	18	kg	\N	275.000000000000000000000000000000	t
19	Ivermectina 1%	19	ml	Antiparasitario inyectable actualizado	50.000000000000000000000000000000	t
20	Sal Mineral	20	kg	\N	275.000000000000000000000000000000	t
21	Ivermectina 1%	21	ml	Antiparasitario inyectable actualizado	50.000000000000000000000000000000	t
22	Sal Mineral	22	kg	\N	275.000000000000000000000000000000	t
\.


--
-- TOC entry 5293 (class 0 OID 52810)
-- Dependencies: 238
-- Data for Name: lote_validacion_productiva; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lote_validacion_productiva (id_lote, fecha_inicio, fecha_fin, creado_por, fecha_creacion, estado) FROM stdin;
1	2024-06-01	2024-06-30	1	2026-04-01 03:21:01.779	APROBADO
2	2024-06-01	2024-06-30	1	2026-04-01 03:22:28.552	APROBADO
3	2024-06-01	2024-06-30	1	2026-04-01 03:58:23.623	APROBADO
4	2024-06-01	2024-06-30	1	2026-04-01 04:10:11.684	APROBADO
5	2024-06-01	2024-06-30	1	2026-04-01 04:10:43.913	PENDIENTE
6	2024-06-01	2024-06-30	1	2026-04-01 04:11:34.768	APROBADO
7	2024-06-01	2024-06-30	1	2026-04-01 04:25:02.431	APROBADO
8	2024-06-01	2024-06-30	1	2026-04-01 04:43:10.033	APROBADO
9	2024-06-01	2024-06-30	1	2026-04-01 04:43:12.075	PENDIENTE
10	2024-06-01	2024-06-30	1	2026-04-01 05:11:11.673	APROBADO
11	2024-06-01	2024-06-30	1	2026-04-01 05:11:15.763	PENDIENTE
12	2024-06-01	2024-06-30	1	2026-04-01 05:12:18.259	APROBADO
13	2024-06-01	2024-06-30	1	2026-04-01 05:12:22.054	PENDIENTE
14	2024-06-01	2024-06-30	1	2026-04-01 05:13:30.717	APROBADO
15	2024-06-01	2024-06-30	1	2026-04-01 05:13:34.427	PENDIENTE
16	2024-06-01	2024-06-30	1	2026-04-01 05:30:45.927	APROBADO
17	2024-06-01	2024-06-30	1	2026-04-01 05:30:49.7	PENDIENTE
\.


--
-- TOC entry 5303 (class 0 OID 52931)
-- Dependencies: 248
-- Data for Name: movimientos_inventario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movimientos_inventario (id_movimiento, id_insumo, tipo_movimiento, cantidad, fecha_movimiento, referencia_compra, registrado_por) FROM stdin;
1	2	SALIDA	25.000000000000000000000000000000	2024-06-01	\N	1
2	1	ENTRADA	50.000000000000000000000000000000	2024-07-05	1	1
3	2	ENTRADA	200.000000000000000000000000000000	2024-07-05	1	1
4	4	SALIDA	25.000000000000000000000000000000	2024-06-01	\N	1
5	3	ENTRADA	50.000000000000000000000000000000	2024-07-05	2	1
6	4	ENTRADA	200.000000000000000000000000000000	2024-07-05	2	1
7	6	SALIDA	25.000000000000000000000000000000	2024-06-01	\N	1
8	5	ENTRADA	50.000000000000000000000000000000	2024-07-05	3	1
9	6	ENTRADA	200.000000000000000000000000000000	2024-07-05	3	1
10	8	SALIDA	25.000000000000000000000000000000	2024-06-01	\N	1
11	7	ENTRADA	50.000000000000000000000000000000	2024-07-05	4	1
12	8	ENTRADA	200.000000000000000000000000000000	2024-07-05	4	1
13	10	SALIDA	25.000000000000000000000000000000	2024-06-01	\N	1
14	9	ENTRADA	50.000000000000000000000000000000	2024-07-05	5	1
15	10	ENTRADA	200.000000000000000000000000000000	2024-07-05	5	1
16	12	SALIDA	25.000000000000000000000000000000	2024-06-01	\N	1
17	11	ENTRADA	50.000000000000000000000000000000	2024-07-05	6	1
18	12	ENTRADA	200.000000000000000000000000000000	2024-07-05	6	1
19	14	SALIDA	25.000000000000000000000000000000	2024-06-01	\N	1
20	13	ENTRADA	50.000000000000000000000000000000	2024-07-05	7	1
21	14	ENTRADA	200.000000000000000000000000000000	2024-07-05	7	1
22	16	SALIDA	25.000000000000000000000000000000	2024-06-01	\N	1
23	15	ENTRADA	50.000000000000000000000000000000	2024-07-05	8	1
24	16	ENTRADA	200.000000000000000000000000000000	2024-07-05	8	1
25	18	SALIDA	25.000000000000000000000000000000	2024-06-01	\N	1
26	17	ENTRADA	50.000000000000000000000000000000	2024-07-05	9	1
27	18	ENTRADA	200.000000000000000000000000000000	2024-07-05	9	1
28	20	SALIDA	25.000000000000000000000000000000	2024-06-01	\N	1
29	19	ENTRADA	50.000000000000000000000000000000	2024-07-05	10	1
30	20	ENTRADA	200.000000000000000000000000000000	2024-07-05	10	1
31	22	SALIDA	25.000000000000000000000000000000	2024-06-01	\N	1
32	21	ENTRADA	50.000000000000000000000000000000	2024-07-05	11	1
33	22	ENTRADA	200.000000000000000000000000000000	2024-07-05	11	1
\.


--
-- TOC entry 5297 (class 0 OID 52854)
-- Dependencies: 242
-- Data for Name: produccion_leche; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.produccion_leche (id_produccion, id_animal, id_lote, litros_producidos, fecha_registro, registrado_por, estado_validacion, validado_por) FROM stdin;
1	12	2	18.500000000000000000000000000000	2024-06-10	1	APROBADO	1
2	15	3	18.500000000000000000000000000000	2024-06-10	1	APROBADO	1
3	18	4	18.500000000000000000000000000000	2024-06-10	1	APROBADO	1
4	22	6	18.500000000000000000000000000000	2024-06-10	1	APROBADO	1
5	25	7	18.500000000000000000000000000000	2024-06-10	1	APROBADO	1
6	28	8	18.500000000000000000000000000000	2024-06-10	1	APROBADO	1
7	29	9	20.100000000000000000000000000000	2024-06-11	32	APROBADO	1
8	32	10	18.500000000000000000000000000000	2024-06-10	1	APROBADO	1
9	33	11	20.100000000000000000000000000000	2024-06-11	38	APROBADO	1
10	36	12	18.500000000000000000000000000000	2024-06-10	1	APROBADO	1
11	37	13	20.100000000000000000000000000000	2024-06-11	45	APROBADO	1
12	40	14	18.500000000000000000000000000000	2024-06-10	1	APROBADO	1
13	41	15	20.100000000000000000000000000000	2024-06-11	52	APROBADO	1
14	44	16	18.500000000000000000000000000000	2024-06-10	1	APROBADO	1
15	45	17	20.100000000000000000000000000000	2024-06-11	59	APROBADO	1
\.


--
-- TOC entry 5281 (class 0 OID 52718)
-- Dependencies: 226
-- Data for Name: razas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.razas (id_raza, nombre_raza, activo) FROM stdin;
1	Holstein	t
2	Simmental	t
3	Angus	t
4	Hereford	t
5	Brahman	t
6	Charolais	t
7	Jersey	t
8	Limousin	t
9	TestRaza	t
10	TestRaza	t
11	TestRaza	t
12	TestRaza	t
13	TestRaza	t
14	TestRaza	t
15	TestRaza	t
16	TestRaza	t
17	TestRaza	t
18	TestRaza	t
19	TestRaza	t
20	TestRaza	t
21	TestRaza	t
22	TestRaza	t
23	TestRaza	t
\.


--
-- TOC entry 5313 (class 0 OID 53283)
-- Dependencies: 258
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id_refresh_token, id_usuario, token, fecha_expiracion, revocado, fecha_creacion, ip_origen, user_agent) FROM stdin;
1	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NDk5NTY5MSwiZXhwIjoxNzc1NjAwNDkxfQ.S-YUM2eGgpqZ7PN8jdTcRjghRwTI1FpwdRBb6HZpsEs	2026-04-07 22:21:31.305	f	2026-03-31 22:21:31.313	::1	curl/8.18.0
3	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjIsImlhdCI6MTc3NDk5NTkxMiwiZXhwIjoxNzc1NjAwNzEyfQ.1ZxL1382gVyvajcKgFbNK-YCf_YYcKMl0SFA_Nn55XA	2026-04-07 22:25:12.154	f	2026-03-31 22:25:12.154	::1	node
2	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NDk5NTkxMSwiZXhwIjoxNzc1NjAwNzExfQ.b4BY0fNAI-LdZYcmA3ouUQmfN_85lpj8shvignpyWVc	2026-04-07 22:25:11.105	t	2026-03-31 22:25:11.113	::1	node
5	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjIsImlhdCI6MTc3NDk5NjAyOCwiZXhwIjoxNzc1NjAwODI4fQ.-mKxEFBxtO6T6Oo80-p-P_rRaVnYR60hDEI1dG4e1NY	2026-04-07 22:27:08.961	f	2026-03-31 22:27:08.961	::1	node
4	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NDk5NjAyNywiZXhwIjoxNzc1NjAwODI3fQ.4J3P2aiigOx5f-JJKY-PqkhaV8qnf6R2an_rdf7h85I	2026-04-07 22:27:07.956	t	2026-03-31 22:27:07.966	::1	node
7	6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjYsImlhdCI6MTc3NTAxMTU5MCwiZXhwIjoxNzc1NjE2MzkwfQ.8bW2G0yzTscgi9A62VERQ4e7H6YavUyYMt9hCU1CNTU	2026-04-08 02:46:30.676	f	2026-04-01 02:46:30.677	::1	node
6	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxMTU4OSwiZXhwIjoxNzc1NjE2Mzg5fQ.4UKzLri08pNNG8Lla-pyM_ov5P1N0bxP8bPhAA6iTps	2026-04-08 02:46:29.549	t	2026-04-01 02:46:29.557	::1	node
9	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjgsImlhdCI6MTc3NTAxMzUwOCwiZXhwIjoxNzc1NjE4MzA4fQ.8JpEFjH9KODbRHbbiVw7j1rjvguW2vNssVPY5yoWEuc	2026-04-08 03:18:28.608	f	2026-04-01 03:18:28.608	::1	node
8	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxMzUwNywiZXhwIjoxNzc1NjE4MzA3fQ.dxDN2Tjqlyv9zw8-7uqud1ELYk9CsjBDm2fVvwPyUmA	2026-04-08 03:18:27.611	t	2026-04-01 03:18:27.619	::1	node
11	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEwLCJpYXQiOjE3NzUwMTM2NjAsImV4cCI6MTc3NTYxODQ2MH0.oynyFv1d6uQc4SeJQ9_kDDLCoxaoGsvg5jlXyTOJuc4	2026-04-08 03:21:00.752	f	2026-04-01 03:21:00.753	::1	node
12	12	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEyLCJpYXQiOjE3NzUwMTM2NjEsImV4cCI6MTc3NTYxODQ2MX0.ZUorLVH84j2I7EfN5770JQd8jPpaXlKowkgahtNBc-0	2026-04-08 03:21:01.58	f	2026-04-01 03:21:01.581	::1	node
10	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxMzY1OSwiZXhwIjoxNzc1NjE4NDU5fQ.AEifIc0Dm84dVtjvD8kp7V02UQysc5XVxzHZk03w2YM	2026-04-08 03:20:59.752	t	2026-04-01 03:20:59.759	::1	node
14	13	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEzLCJpYXQiOjE3NzUwMTM3NDcsImV4cCI6MTc3NTYxODU0N30.tGu1rx7JteOFLWooXagdklP-z4DqVDo6HneJI5avz2I	2026-04-08 03:22:27.539	f	2026-04-01 03:22:27.539	::1	node
15	15	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjE1LCJpYXQiOjE3NzUwMTM3NDgsImV4cCI6MTc3NTYxODU0OH0.H3enPeu0VgDT_BLaHAmN-bAF7o3yf7Wg1nrn-dfTn_k	2026-04-08 03:22:28.35	f	2026-04-01 03:22:28.35	::1	node
13	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxMzc0NiwiZXhwIjoxNzc1NjE4NTQ2fQ._HTmdjPHsKQ_N3rn7UUxpZcMfN27JZfODqHL3_IMMq0	2026-04-08 03:22:26.566	t	2026-04-01 03:22:26.573	::1	node
17	16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjE2LCJpYXQiOjE3NzUwMTU5MDIsImV4cCI6MTc3NTYyMDcwMn0.ojRo7ncfUl4A8XyYifvIbufNTvMfA9PnwTIDbypUOO8	2026-04-08 03:58:22.275	f	2026-04-01 03:58:22.276	::1	node
18	18	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjE4LCJpYXQiOjE3NzUwMTU5MDMsImV4cCI6MTc3NTYyMDcwM30.zxQfveiKQ9qa4b8ba1Ep9_AcqLR4zwto5Q6qtIefP5Y	2026-04-08 03:58:23.368	f	2026-04-01 03:58:23.368	::1	node
16	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxNTkwMCwiZXhwIjoxNzc1NjIwNzAwfQ.NdYycn7oEDWl0xdGbnS8XjrOj50SoajjtSce7lclEqs	2026-04-08 03:58:20.821	t	2026-04-01 03:58:20.835	::1	node
20	19	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjE5LCJpYXQiOjE3NzUwMTY2MTAsImV4cCI6MTc3NTYyMTQxMH0.YWPjRgriW_BlCQB8NkwYHj_3Z3vyxAMg00oyHZm8a1Y	2026-04-08 04:10:10.44	f	2026-04-01 04:10:10.44	::1	node
21	21	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjIxLCJpYXQiOjE3NzUwMTY2MTEsImV4cCI6MTc3NTYyMTQxMX0.Tl54eFltTukZpJTnRLCgl5zkzMBT-kEhYeidR4xcXLI	2026-04-08 04:10:11.468	f	2026-04-01 04:10:11.469	::1	node
19	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxNjYwOSwiZXhwIjoxNzc1NjIxNDA5fQ.FtZb6HEQ6ZznVjhw1QQRvmCZhrHDuiLlrVHw_e1aJsU	2026-04-08 04:10:09.077	t	2026-04-01 04:10:09.087	::1	node
22	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxNjYyNiwiZXhwIjoxNzc1NjIxNDI2fQ.9OodaL_yG7M5Uc9VXSxEfvDTqImWnVft7woVOwVcURw	2026-04-08 04:10:26.261	f	2026-04-01 04:10:26.262	::1	node
23	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxNjY0MywiZXhwIjoxNzc1NjIxNDQzfQ.2E4Qu1Hi519EMauiq6boSaVy2sLjbZ1oVeo3UkDM3H8	2026-04-08 04:10:43.23	f	2026-04-01 04:10:43.241	::1	node
24	22	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjIyLCJpYXQiOjE3NzUwMTY2NDMsImV4cCI6MTc3NTYyMTQ0M30.rIjrxIDdDmdudtRXNQawqZYePZpJIFsaqg9MHW3I8Oo	2026-04-08 04:10:43.881	f	2026-04-01 04:10:43.882	::1	node
26	23	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjIzLCJpYXQiOjE3NzUwMTY2OTMsImV4cCI6MTc3NTYyMTQ5M30.alQtYgWfJkia9VqHDqYTO0DS_L1ewCu7MvX8BYwVjz8	2026-04-08 04:11:33.512	f	2026-04-01 04:11:33.513	::1	node
27	25	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjI1LCJpYXQiOjE3NzUwMTY2OTQsImV4cCI6MTc3NTYyMTQ5NH0.HJqrZ1EdGlg7JP08db_6oVy8LMddhWKPLKoXoD1QuVU	2026-04-08 04:11:34.542	f	2026-04-01 04:11:34.543	::1	node
25	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxNjY5MiwiZXhwIjoxNzc1NjIxNDkyfQ.wIXaq1LzeBsO4g5xsI9T8tDRIKLAydfYw7URJPjLjm8	2026-04-08 04:11:32.094	t	2026-04-01 04:11:32.105	::1	node
29	26	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjI2LCJpYXQiOjE3NzUwMTc1MDEsImV4cCI6MTc3NTYyMjMwMX0.bDgNYzfNUGUuo7UhLtVDXjTuZ-mZfy0xs8ZTADR3AEk	2026-04-08 04:25:01.292	f	2026-04-01 04:25:01.292	::1	node
30	28	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjI4LCJpYXQiOjE3NzUwMTc1MDIsImV4cCI6MTc3NTYyMjMwMn0.cCw2XTCYuBDUyieoxXEsPhtu4BwrJiCIWreg1_VHwjo	2026-04-08 04:25:02.218	f	2026-04-01 04:25:02.218	::1	node
28	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxNzUwMCwiZXhwIjoxNzc1NjIyMzAwfQ._gQ3WsqJKA5GIvLCK2XZCBNJtyaqf4kZVzAg_-kkQM4	2026-04-08 04:25:00.264	t	2026-04-01 04:25:00.272	::1	node
31	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxNzU2OSwiZXhwIjoxNzc1NjIyMzY5fQ.a1jW5VbLohG2YJrurJah6lNZtzLijaKt4dye08neDMU	2026-04-08 04:26:09.128	f	2026-04-01 04:26:09.136	::1	node
33	29	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjI5LCJpYXQiOjE3NzUwMTg1ODgsImV4cCI6MTc3NTYyMzM4OH0.5jUdEUx0t598o-NNofqJXsVlITErHYD1WEUdSZd6yIQ	2026-04-08 04:43:08.787	f	2026-04-01 04:43:08.788	::1	node
34	31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjMxLCJpYXQiOjE3NzUwMTg1ODksImV4cCI6MTc3NTYyMzM4OX0.FvirTzClxQq73piYoR770biXlzl6YcKQi6G38hna9aE	2026-04-08 04:43:09.807	f	2026-04-01 04:43:09.808	::1	node
32	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxODU4NywiZXhwIjoxNzc1NjIzMzg3fQ.vJqGWzkAzu8SH8gHgghrhblKcWWMMBnvhR1Fi6frv9E	2026-04-08 04:43:07.762	t	2026-04-01 04:43:07.77	::1	node
35	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxODU5MCwiZXhwIjoxNzc1NjIzMzkwfQ.YhiYGYJSEBhNqgDxjvAd_cDOsBMskKBjhKSdMnQIxD0	2026-04-08 04:43:10.69	f	2026-04-01 04:43:10.691	::1	node
36	32	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjMyLCJpYXQiOjE3NzUwMTg1OTEsImV4cCI6MTc3NTYyMzM5MX0.4zrV6OwYBI34tVgRAgvk69f7FU7Y559KXFfRBA9UB3o	2026-04-08 04:43:11.604	f	2026-04-01 04:43:11.604	::1	node
37	33	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjMzLCJpYXQiOjE3NzUwMTg1OTEsImV4cCI6MTc3NTYyMzM5MX0.HJvn7GANciBARdp5acS3-6aeBjrheAduX_6dMK6Qm3Y	2026-04-08 04:43:11.832	f	2026-04-01 04:43:11.832	::1	node
38	34	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjM0LCJpYXQiOjE3NzUwMTg1OTIsImV4cCI6MTc3NTYyMzM5Mn0.S8goM61QYPxTqDimzAceWc_7iGlqrwGF_sSg7FjEDPw	2026-04-08 04:43:12.054	f	2026-04-01 04:43:12.054	::1	node
39	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxODYxNSwiZXhwIjoxNzc1NjIzNDE1fQ.LyhydrwFoT10W7CpCxm8k0tW3Sw02muZWW5smIIn2ok	2026-04-08 04:43:35.77	f	2026-04-01 04:43:35.776	::1	node
40	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAxODYxNiwiZXhwIjoxNzc1NjIzNDE2fQ.D_rv6Iovo3QeLdViZAcR0JBA-TQHyY57YEJrHlzbIGQ	2026-04-08 04:43:36.037	f	2026-04-01 04:43:36.038	::1	node
42	35	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjM1LCJpYXQiOjE3NzUwMjAyNzAsImV4cCI6MTc3NTYyNTA3MH0.l6qCUUZqKbTSm2iwYc86tfsRaZlZMUUsG9ykTYUz17U	2026-04-08 05:11:10.594	f	2026-04-01 05:11:10.594	::1	node
43	37	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjM3LCJpYXQiOjE3NzUwMjAyNzEsImV4cCI6MTc3NTYyNTA3MX0.8SuOoYD0dxixstCno8q5NmI_K5RAVQICQdi02g9Cw6Y	2026-04-08 05:11:11.439	f	2026-04-01 05:11:11.439	::1	node
41	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAyMDI2OSwiZXhwIjoxNzc1NjI1MDY5fQ.I4Vckm_Kr0HtzBtJTphWoDGUfu1_qOrNwe5D5Lp4-6Q	2026-04-08 05:11:09.522	t	2026-04-01 05:11:09.529	::1	node
44	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAyMDI3MiwiZXhwIjoxNzc1NjI1MDcyfQ.WJ9GgqHp9zYP58NPaLUVer3HxukTMsQbRVrPVZ7WlN4	2026-04-08 05:11:12.484	f	2026-04-01 05:11:12.485	::1	node
45	38	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjM4LCJpYXQiOjE3NzUwMjAyNzMsImV4cCI6MTc3NTYyNTA3M30.tXZg4g63pzcOnc97iJnBU9qDU124fFQPh89daIJOB3Y	2026-04-08 05:11:13.465	f	2026-04-01 05:11:13.465	::1	node
46	39	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjM5LCJpYXQiOjE3NzUwMjAyNzMsImV4cCI6MTc3NTYyNTA3M30.JjSjjYnOsg7HeLBO3hjOB4dPJmfGsf-FCkm3qlg5qnc	2026-04-08 05:11:13.713	f	2026-04-01 05:11:13.713	::1	node
47	40	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjQwLCJpYXQiOjE3NzUwMjAyNzMsImV4cCI6MTc3NTYyNTA3M30.owg09s0PUJpPPc77_mYyBaC8SoV5EJ6K7-nfhb8uMZM	2026-04-08 05:11:13.947	f	2026-04-01 05:11:13.947	::1	node
48	41	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjQxLCJpYXQiOjE3NzUwMjAyNzUsImV4cCI6MTc3NTYyNTA3NX0.94w4Tr8NnIJS-PRbt9CTVFidx1B7Dcskm8ZvftzFU2U	2026-04-08 05:11:15.7	f	2026-04-01 05:11:15.701	::1	node
50	42	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjQyLCJpYXQiOjE3NzUwMjAzMzcsImV4cCI6MTc3NTYyNTEzN30.a8Fkm7gtRsAVdwejgmiOgPujna29pUi8VgOkuspYgE0	2026-04-08 05:12:17.106	f	2026-04-01 05:12:17.106	::1	node
51	44	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjQ0LCJpYXQiOjE3NzUwMjAzMzgsImV4cCI6MTc3NTYyNTEzOH0.FnE_FV2x2cML2naIuPLntkY7PxNAh_a-ovLUUv3fN8w	2026-04-08 05:12:18.008	f	2026-04-01 05:12:18.008	::1	node
49	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAyMDMzNiwiZXhwIjoxNzc1NjI1MTM2fQ.5kD2X_kk2D58Pd1lhdT-OBIG6rMOYJFmMLtavj1HTr4	2026-04-08 05:12:16.006	t	2026-04-01 05:12:16.013	::1	node
52	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAyMDMzOCwiZXhwIjoxNzc1NjI1MTM4fQ.OH876PrGpPgJ5JIHSNNVi2Xyqssv6uE8gcMv24OQdPQ	2026-04-08 05:12:18.964	f	2026-04-01 05:12:18.964	::1	node
53	45	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjQ1LCJpYXQiOjE3NzUwMjAzMzksImV4cCI6MTc3NTYyNTEzOX0.sQm3D7gjfo6vAXaU-QP_UYYBVgAVULUI8opPyt_Gkt0	2026-04-08 05:12:19.914	f	2026-04-01 05:12:19.914	::1	node
54	46	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjQ2LCJpYXQiOjE3NzUwMjAzNDAsImV4cCI6MTc3NTYyNTE0MH0.oSs4jqVsAfTDjN8RK52ZVKpKrpnFoYLSQ1fULFTbsR8	2026-04-08 05:12:20.133	f	2026-04-01 05:12:20.134	::1	node
55	47	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjQ3LCJpYXQiOjE3NzUwMjAzNDAsImV4cCI6MTc3NTYyNTE0MH0.UM9nNOPK7ZTHdt3EYe_b7TcvAm1e8v4AtAUbLf_nB6o	2026-04-08 05:12:20.367	f	2026-04-01 05:12:20.367	::1	node
56	48	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjQ4LCJpYXQiOjE3NzUwMjAzNDIsImV4cCI6MTc3NTYyNTE0Mn0.ol0Yq8TNd-YOBp-6I55Fu5-pdzxAY8-z5oZZUptNfhk	2026-04-08 05:12:22.001	f	2026-04-01 05:12:22.002	::1	node
57	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsImlhdCI6MTc3NTAyMDM2MiwiZXhwIjoxNzc1NjI1MTYyfQ.6VGYDzYUfrukLLwKXaZJRBgoTPn38oszhAO0dY1VJ1I	2026-04-08 05:12:42.411	f	2026-04-01 05:12:42.417	::1	node
59	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiI2OWViYzQ2Ny0yYWU5LTQzZDItOTM1NC0xODEzODU2MjY3NjUiLCJpYXQiOjE3NzUwMjAzOTYsImV4cCI6MTc3NTYyNTE5Nn0.u8BoF63zj3ZmKzyzS28wwJm1s7lQ-203X5y-2Q7e5xc	2026-04-08 05:13:16.436	f	2026-04-01 05:13:16.443	::1	node
60	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiJkNjg3NzE0MC01MmRjLTRlOTAtYjAyOS04ZThmYzZiODk5YzQiLCJpYXQiOjE3NzUwMjAzOTYsImV4cCI6MTc3NTYyNTE5Nn0.zVkpWnWTJOCVHpeImyBJ-CHBUHYCN8k2NW306s6EKEs	2026-04-08 05:13:16.681	f	2026-04-01 05:13:16.682	::1	node
62	49	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjQ5LCJ0b2tlbklkIjoiMmJiYmU4ZTktNDgwYi00ZGEzLTg0ZmEtY2VmOGQyZGJjNTA2IiwiaWF0IjoxNzc1MDIwNDA5LCJleHAiOjE3NzU2MjUyMDl9.48kNelQc4m4l8Xko3sW22DcSWLX5R4pgQpJ99gDcFFQ	2026-04-08 05:13:29.639	f	2026-04-01 05:13:29.64	::1	node
63	51	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjUxLCJ0b2tlbklkIjoiOTFiYzZjZTUtMzgwNy00Zjg3LWE0ZjAtOTEzNThmYTRhZWI4IiwiaWF0IjoxNzc1MDIwNDEwLCJleHAiOjE3NzU2MjUyMTB9.h3ieIhtntCS_qaIzn6VIphmLRss2nnxOMdJBMARe8Us	2026-04-08 05:13:30.488	f	2026-04-01 05:13:30.488	::1	node
61	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiJhNjJmZjFmZi05ZWYxLTQ0NDItYjE1Yi0wOTlmMzFmOGUzMDYiLCJpYXQiOjE3NzUwMjA0MDgsImV4cCI6MTc3NTYyNTIwOH0.puTKwWsfoithefbztr8bqjzVXEkvqlHc1sQWpn-PXoA	2026-04-08 05:13:28.583	t	2026-04-01 05:13:28.591	::1	node
64	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiJlZTBiNGYxZC02OWRjLTQ4YmMtYmYxOC03MmM1MTk1NDU3NjUiLCJpYXQiOjE3NzUwMjA0MTEsImV4cCI6MTc3NTYyNTIxMX0.C_5TLCrUdte5bm2VJamXYmXWrvNwouSt1MJzvEaXEUc	2026-04-08 05:13:31.39	f	2026-04-01 05:13:31.39	::1	node
65	52	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjUyLCJ0b2tlbklkIjoiN2ZiMGIxZGMtYTUxMC00MTQwLTgwMTEtNjdlODkwMTg0Y2YyIiwiaWF0IjoxNzc1MDIwNDEyLCJleHAiOjE3NzU2MjUyMTJ9.zogWXuL8a8HVk6XjKnYxNs5MkpZ7mvmCZeFNjgJkY-k	2026-04-08 05:13:32.314	f	2026-04-01 05:13:32.314	::1	node
66	53	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjUzLCJ0b2tlbklkIjoiZjlhNGJlMDItZGYwNS00NjQ3LTljZDQtZTNlNWVjNGQ5NDAyIiwiaWF0IjoxNzc1MDIwNDEyLCJleHAiOjE3NzU2MjUyMTJ9.56odGn5LUatotP49-af4Kb-Si94xOJCGQ1B5KcA9NWs	2026-04-08 05:13:32.539	f	2026-04-01 05:13:32.54	::1	node
67	54	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjU0LCJ0b2tlbklkIjoiMWQyZTFiNjItYjkyMC00NDFkLWFmOTgtMTlmZjZjYmE3NzYzIiwiaWF0IjoxNzc1MDIwNDEyLCJleHAiOjE3NzU2MjUyMTJ9.Vl0sIgO69_D4RDlXVxG6LgIbFrKg0u56Mhe74waWdSI	2026-04-08 05:13:32.765	f	2026-04-01 05:13:32.765	::1	node
68	55	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjU1LCJ0b2tlbklkIjoiMTJmOWQzYTEtOWZiZC00NGVmLTgzNDAtOTAyYWEwNjk5NjdhIiwiaWF0IjoxNzc1MDIwNDE0LCJleHAiOjE3NzU2MjUyMTR9.PBqezmnBD9F7Z12WdYht1Zq3aIglL490EswRtdV_fT8	2026-04-08 05:13:34.376	f	2026-04-01 05:13:34.376	::1	node
70	56	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjU2LCJ0b2tlbklkIjoiMGUzMGE5MjAtNjZhOS00NTQyLWJmMjYtODNjNGVmMThhMTIwIiwiaWF0IjoxNzc1MDIxNDQ0LCJleHAiOjE3NzU2MjYyNDR9.GHp62oy1b5hCPXz5C8twOogFOzrGQJpR8Zxp5BdugCI	2026-04-08 05:30:44.761	f	2026-04-01 05:30:44.762	::1	node
71	58	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjU4LCJ0b2tlbklkIjoiYTdkM2M5NWYtZjJlNC00NTk0LWIzYjgtZGMxNzEyNGI0OTZjIiwiaWF0IjoxNzc1MDIxNDQ1LCJleHAiOjE3NzU2MjYyNDV9.uuqZzUyfRYy9TUBgA96LfLHB0grQtttzjs8pgts4JpE	2026-04-08 05:30:45.704	f	2026-04-01 05:30:45.704	::1	node
69	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiJkM2IyM2NiZS05ZTRmLTQwMjEtOTlkMy04NDU2YWY4NDVhYmMiLCJpYXQiOjE3NzUwMjE0NDMsImV4cCI6MTc3NTYyNjI0M30.AGQOy488PEBjTRnJP2S7QwZbP4FZDjSy9ZwpCg7ibEg	2026-04-08 05:30:43.703	t	2026-04-01 05:30:43.712	::1	node
72	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiI5ZmVhMDg1NS03MTQ5LTQ0NmItYjRkZS0zMjI5YTI0MzNjNTgiLCJpYXQiOjE3NzUwMjE0NDYsImV4cCI6MTc3NTYyNjI0Nn0.kYvpWWU-YSkELG6BsnAP6vewbnGOfQdeJ-D6utknWFU	2026-04-08 05:30:46.632	f	2026-04-01 05:30:46.632	::1	node
73	59	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjU5LCJ0b2tlbklkIjoiMTY2NTRjMGItOWU3ZS00MDk5LTk0NTUtMDRhMDJhMjQ4YWFjIiwiaWF0IjoxNzc1MDIxNDQ3LCJleHAiOjE3NzU2MjYyNDd9.FsIjP2ATr2qzwhqeDFkJriicHayvvVVYj1aAWFlA810	2026-04-08 05:30:47.579	f	2026-04-01 05:30:47.579	::1	node
74	60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjYwLCJ0b2tlbklkIjoiMmU3YjkzOGYtZmQ3ZC00M2IxLTgyNDgtNTNiOTQzYzQyZDYzIiwiaWF0IjoxNzc1MDIxNDQ3LCJleHAiOjE3NzU2MjYyNDd9.JaUqGKYwHz7YMUV8qLW-y2IOiyuKWsN_hVDqPjAzZUc	2026-04-08 05:30:47.834	f	2026-04-01 05:30:47.834	::1	node
75	61	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjYxLCJ0b2tlbklkIjoiMGYxZGNkZWQtNGJiNi00OTgxLWFmZTgtODVhYmE5YTNkYjk0IiwiaWF0IjoxNzc1MDIxNDQ4LCJleHAiOjE3NzU2MjYyNDh9.59YeVDmd-FeUfaDosSQ15keEi6CYwMzjTaPwiZk3Le0	2026-04-08 05:30:48.056	f	2026-04-01 05:30:48.056	::1	node
76	62	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjYyLCJ0b2tlbklkIjoiMjFiYzUzYjUtY2Q1OS00ZDcwLWJjYzktMzhmMmRjYmJmZWI2IiwiaWF0IjoxNzc1MDIxNDQ5LCJleHAiOjE3NzU2MjYyNDl9.GvbuaM-TfFwTWxLSvbdCavNsjGbm1eSp2gxXceH7yRE	2026-04-08 05:30:49.652	f	2026-04-01 05:30:49.652	::1	node
77	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiIxMzg5NDRkOC00ODgyLTRkZGQtYjUyNC1iZmRjNTBlMjU1YjAiLCJpYXQiOjE3NzUwMjE0NzAsImV4cCI6MTc3NTYyNjI3MH0.qEkjLPoKVEejZucle2OF_7fh4fFMVft4B10lBN5y9ck	2026-04-08 05:31:10.575	f	2026-04-01 05:31:10.583	::1	node
78	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiJlNWU2ZDA1Ni05NDZmLTQ5OWQtOGI3YS1jZjFmN2IzYTZjZjUiLCJpYXQiOjE3NzUwMjE0NzAsImV4cCI6MTc3NTYyNjI3MH0.Jiw40AgamMFk_LNHPsPZ6eamHM04_N6iNItSJAEjU14	2026-04-08 05:31:10.819	f	2026-04-01 05:31:10.82	::1	node
79	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiI3YjVkYTIxZi0zZGFlLTRiYWYtODY4OC0zOTMwMGJjODhjNjEiLCJpYXQiOjE3NzUwMjE5NjksImV4cCI6MTc3NTYyNjc2OX0.TB8eQGyCkWQTapKfwqVqYKOyyzRknlM2p-sod3YCk6A	2026-04-08 05:39:29.703	t	2026-04-01 05:39:29.711	::1	node
80	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiI5MWJmY2UyMC1hZmUzLTQ0NTUtOGRjMS0zYThhODkyOTY3MWUiLCJpYXQiOjE3NzUwMjIwMjAsImV4cCI6MTc3NTYyNjgyMH0.L8sK8xSkN1vGzRI02W9AAeISA6ibGXYuf95GKvX-sHk	2026-04-08 05:40:20.066	t	2026-04-01 05:40:20.073	::1	node
82	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiI5MGNhYWRjOS04MjlkLTRjNjAtYTI3Yy1jODc0ODkwYWFiNzMiLCJpYXQiOjE3NzUwMjMwMDUsImV4cCI6MTc3NTYyNzgwNX0.7pWmshyFHF0piB2jxCVovpltsaaw-RbrwKUHOpSOQOE	2026-04-08 05:56:45.166	t	2026-04-01 05:56:45.166	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36
83	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiIxNDk0MjlmNS0xMmVmLTRkOGMtOTNjMy1jZDE2NDc4NTUzZmQiLCJpYXQiOjE3NzUwMjM4NDAsImV4cCI6MTc3NTYyODY0MH0.KgmnXhbK0JBKMGwKzSplyUX-vfejHyelMR5RCWE5KPQ	2026-04-08 06:10:40.429	t	2026-04-01 06:10:40.429	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36
81	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOjEsInRva2VuSWQiOiI5YWZiZTBiNy02ZTlhLTRhMzktOTc1YS1hY2UyYWQyM2M3NmMiLCJpYXQiOjE3NzUwMjI2NjQsImV4cCI6MTc3NTYyNzQ2NH0.3MHqz7jgLm_B-MSjxCkDNcXUUvemCk5fwwthWwgsIp4	2026-04-08 05:51:04.683	t	2026-04-01 05:51:04.688	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36
\.


--
-- TOC entry 5295 (class 0 OID 52824)
-- Dependencies: 240
-- Data for Name: registro_peso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registro_peso (id_registro_peso, id_animal, id_lote, peso, fecha_registro, registrado_por, estado_validacion, validado_por) FROM stdin;
1	12	2	350.000000000000000000000000000000	2024-06-10	1	APROBADO	1
2	15	3	350.000000000000000000000000000000	2024-06-10	1	APROBADO	1
3	18	4	350.000000000000000000000000000000	2024-06-10	1	APROBADO	1
4	19	5	345.000000000000000000000000000000	2024-06-15	22	APROBADO	1
5	22	6	350.000000000000000000000000000000	2024-06-10	1	APROBADO	1
6	25	7	350.000000000000000000000000000000	2024-06-10	1	APROBADO	1
7	28	8	350.000000000000000000000000000000	2024-06-10	1	APROBADO	1
8	29	9	360.000000000000000000000000000000	2024-06-10	32	APROBADO	1
9	32	10	350.000000000000000000000000000000	2024-06-10	1	APROBADO	1
10	33	11	360.000000000000000000000000000000	2024-06-10	38	APROBADO	1
11	36	12	350.000000000000000000000000000000	2024-06-10	1	APROBADO	1
12	37	13	360.000000000000000000000000000000	2024-06-10	45	APROBADO	1
13	40	14	350.000000000000000000000000000000	2024-06-10	1	APROBADO	1
14	41	15	360.000000000000000000000000000000	2024-06-10	52	APROBADO	1
15	44	16	350.000000000000000000000000000000	2024-06-10	1	APROBADO	1
16	45	17	360.000000000000000000000000000000	2024-06-10	59	APROBADO	1
\.


--
-- TOC entry 5275 (class 0 OID 52673)
-- Dependencies: 220
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id_rol, nombre_rol, descripcion) FROM stdin;
1	Propietario	Consultor estratégico. Consulta reportes, dashboard e indicadores. Sin operación directa.
2	Administrador	Gestor / Autorizador. Gestión completa del sistema, usuarios, validaciones y compras.
3	Médico Veterinario	Registrador / Autorizador. Registra y autoriza eventos sanitarios. Gestiona calendario sanitario.
4	Producción	Registrador. Registra peso, leche y eventos reproductivos.
5	Campo	Registrador. Captura en campo: escaneo de arete, registro básico de eventos.
6	Almacén	Registrador / Solicitante. Gestión de inventario y solicitudes de compra.
\.


--
-- TOC entry 5305 (class 0 OID 52946)
-- Dependencies: 250
-- Data for Name: solicitudes_compra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitudes_compra (id_solicitud, fecha_solicitud, solicitada_por, estado_solicitud, aprobada_por, fecha_aprobacion, observaciones) FROM stdin;
1	2024-07-01	12	APROBADA	1	2026-04-01 03:21:01.668	Aprobada para prueba
2	2024-07-02	12	RECHAZADA	1	2026-04-01 03:21:01.696	\N
3	2024-07-01	15	APROBADA	1	2026-04-01 03:22:28.442	Aprobada para prueba
4	2024-07-02	15	RECHAZADA	1	2026-04-01 03:22:28.468	\N
5	2024-07-01	18	APROBADA	1	2026-04-01 03:58:23.481	Aprobada para prueba
6	2024-07-02	18	RECHAZADA	1	2026-04-01 03:58:23.518	\N
7	2024-07-01	21	APROBADA	1	2026-04-01 04:10:11.567	Aprobada para prueba
8	2024-07-02	21	RECHAZADA	1	2026-04-01 04:10:11.599	\N
9	2024-07-01	25	APROBADA	1	2026-04-01 04:11:34.647	Aprobada para prueba
10	2024-07-02	25	RECHAZADA	1	2026-04-01 04:11:34.682	\N
11	2024-07-01	28	APROBADA	1	2026-04-01 04:25:02.319	Aprobada para prueba
12	2024-07-02	28	RECHAZADA	1	2026-04-01 04:25:02.35	\N
13	2024-07-01	31	APROBADA	1	2026-04-01 04:43:09.917	Aprobada para prueba
14	2024-07-02	31	RECHAZADA	1	2026-04-01 04:43:09.949	\N
15	2024-07-01	37	APROBADA	1	2026-04-01 05:11:11.551	Aprobada para prueba
16	2024-07-02	37	RECHAZADA	1	2026-04-01 05:11:11.586	\N
17	2024-07-01	44	APROBADA	1	2026-04-01 05:12:18.132	Aprobada para prueba
18	2024-07-02	44	RECHAZADA	1	2026-04-01 05:12:18.167	\N
19	2024-07-01	51	APROBADA	1	2026-04-01 05:13:30.591	Aprobada para prueba
20	2024-07-02	51	RECHAZADA	1	2026-04-01 05:13:30.624	\N
21	2024-07-01	58	APROBADA	1	2026-04-01 05:30:45.811	Aprobada para prueba
22	2024-07-02	58	RECHAZADA	1	2026-04-01 05:30:45.845	\N
\.


--
-- TOC entry 5285 (class 0 OID 52736)
-- Dependencies: 230
-- Data for Name: tipos_evento_sanitario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipos_evento_sanitario (id_tipo_evento, nombre_tipo, activo) FROM stdin;
1	Vacuna	t
2	Enfermedad	t
3	Tratamiento	t
\.


--
-- TOC entry 5283 (class 0 OID 52726)
-- Dependencies: 228
-- Data for Name: tipos_insumo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipos_insumo (id_tipo_insumo, nombre_tipo, descripcion, activo) FROM stdin;
1	Medicamentos	Medicamentos veterinarios	t
2	Alimento	\N	t
3	Medicamentos	Medicamentos veterinarios	t
4	Alimento	\N	t
5	Medicamentos	Medicamentos veterinarios	t
6	Alimento	\N	t
7	Medicamentos	Medicamentos veterinarios	t
8	Alimento	\N	t
9	Medicamentos	Medicamentos veterinarios	t
10	Alimento	\N	t
11	Medicamentos	Medicamentos veterinarios	t
12	Alimento	\N	t
13	Medicamentos	Medicamentos veterinarios	t
14	Alimento	\N	t
15	Medicamentos	Medicamentos veterinarios	t
16	Alimento	\N	t
17	Medicamentos	Medicamentos veterinarios	t
18	Alimento	\N	t
19	Medicamentos	Medicamentos veterinarios	t
20	Alimento	\N	t
21	Medicamentos	Medicamentos veterinarios	t
22	Alimento	\N	t
\.


--
-- TOC entry 5277 (class 0 OID 52684)
-- Dependencies: 222
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, nombre_completo, username, password_hash, id_rol, estado, fecha_creacion, bloqueado_hasta, intentos_fallidos) FROM stdin;
2	Dr. Veterinario Actualizado	vet_test	$2b$12$s8nb.CfmKgYiDp7nvKQbuOCKsQxxV9rma9cCQLSY1n8WnOfHa3eUK	3	t	2026-03-31 22:25:11.65	\N	0
26	Dr. Veterinario Actualizado	vet_1775017499888	$2b$12$FCUKYOFifQmfP/hbV4yJVuhyvyIqsYIz6VpouiLSEDKPNc3pVOucO	3	t	2026-04-01 04:25:00.801	\N	0
6	Dr. Veterinario Actualizado	vet_1775011588982	$2b$12$3hipj3mrJR7uZrkMwoWe.eIxVXV9YRL9wQ7uF/aM0GCVzlERF.fuu	3	t	2026-04-01 02:46:30.15	\N	0
28	Encargado Almacén	almacen_1775017499888	$2b$12$3Z7yC4N0oQFpCUxPIF.Y6OIC65hweEQtB99bCb1ZdT51szyt5Qm3W	6	t	2026-04-01 04:25:01.992	\N	0
8	Dr. Veterinario Actualizado	vet_1775013507206	$2b$12$xgTReYFy5aMG0cRobiPkueH/zqVFcnROAjQvwnkToS9NN1XOwPkr6	3	t	2026-04-01 03:18:28.123	\N	0
10	Dr. Veterinario Actualizado	vet_1775013659387	$2b$12$pRGJcOfAWMCkXQyWJTbifOuJA2Uh5vFmNNc50ly825pDt9M5gUk7i	3	t	2026-04-01 03:21:00.261	\N	0
12	Encargado Almacén	almacen_1775013659387	$2b$12$ED7FIn4hfNhk1QyyrngHrOFESkcjOB9AWJLLMCys1oO6h1kABycTC	6	t	2026-04-01 03:21:01.366	\N	0
29	Dr. Veterinario Actualizado	vet_1775018587366	$2b$12$E2S/ApCYVid3uQ2hoc6zAu3z/Vqehd6nCR75zEHM3D0I0KezjhyJG	3	t	2026-04-01 04:43:08.292	\N	0
13	Dr. Veterinario Actualizado	vet_1775013746174	$2b$12$dagwWZPnjWEug36TenKeAO0H6Ab6Yzz08mvwaZyXUQhSCZ44Q78b6	3	t	2026-04-01 03:22:27.07	\N	0
15	Encargado Almacén	almacen_1775013746174	$2b$12$kC0HAfWBpSRZgAgYB6UqYOM47ODg4vQ9XtIhYNTWyRVd4DeRKOre.	6	t	2026-04-01 03:22:28.134	\N	0
31	Encargado Almacén	almacen_1775018587366	$2b$12$IrSn.rfMN0Eoh2VhAs9gdO.FwuqsvNZWSrpmB5RgPBeOYnx8Kks6O	6	t	2026-04-01 04:43:09.58	\N	0
16	Dr. Veterinario Actualizado	vet_1775015900124	$2b$12$SsfZD3dcXTZZJKU1WEOkI.S53.diuUSxDFllY5z5/PoxEXzQa.AGG	3	t	2026-04-01 03:58:21.573	\N	0
18	Encargado Almacén	almacen_1775015900124	$2b$12$qVlLhjBdC1MwWfdsN/sufeAgQ8EtnSoNt5cltXUNi9s7/swhsGdEW	6	t	2026-04-01 03:58:23.049	\N	0
32	Produccion Fase 3	prod_f3_1775018590422	$2b$12$6wOUXr95/MTaVjIf01RMauWtbpVYli0IQhi.pXWdrnJoI6o/n0LTC	4	t	2026-04-01 04:43:10.923	\N	0
33	Veterinario Fase 3	vet_f3_1775018590422	$2b$12$77BtD3XBWIGHWah6IrH1Uero/DhqDYRRQG0Hw0H72Os5rZ4NhIdhm	3	t	2026-04-01 04:43:11.146	\N	0
19	Dr. Veterinario Actualizado	vet_1775016608592	$2b$12$q4LiDSVLN4Y1Byuz1oEA1uO0NXMk5c/VRI/eXx8IUVC06vQ5DxZ8m	3	t	2026-04-01 04:10:09.769	\N	0
21	Encargado Almacén	almacen_1775016608592	$2b$12$FYrakI9WraL6kTYv9O49zOHhWjt.si9JIJBhMaDpts5qTTJZ7ry.G	6	t	2026-04-01 04:10:11.167	\N	0
22	Produccion Test	prod_1775016642663	$2b$12$s4BC5N40ukXKcpykmgGd4uM9upeff0NsrSMUWAQHhRq6zyO9/Mmt2	4	t	2026-04-01 04:10:43.572	\N	0
34	Almacen Fase 3	alm_f3_1775018590422	$2b$12$n.JUWyTG4ioDebMsVwMZX.hCFBUyKLqvdG2.XPSaDpZGMLsPfF5DC	6	t	2026-04-01 04:43:11.374	\N	0
23	Dr. Veterinario Actualizado	vet_1775016691619	$2b$12$Ia3dx/8njh8NS0AcWpyZGOvd4Fa/3XDLG3V87GEaVbc.TYJlXRP4C	3	t	2026-04-01 04:11:32.816	\N	0
25	Encargado Almacén	almacen_1775016691619	$2b$12$vr01XpkLtb8ABas3TsyskOyAa0o1DfzO2/3o5.82wkGoF0bukjUhS	6	t	2026-04-01 04:11:34.242	\N	0
42	Dr. Veterinario Actualizado	vet_1775020335618	$2b$12$JTe8Gjl/xy9xOvz7H/JL8.OCtAnCf8PKsVqgofza3n.5zLgdXu6Lm	3	t	2026-04-01 05:12:16.579	\N	0
44	Encargado Almacén	almacen_1775020335618	$2b$12$O65SKgUKTjPa6la.Mo7PTe.MI/wZEWevb2hE.uu1OJsUkYSmP6Amy	6	t	2026-04-01 05:12:17.755	\N	0
35	Dr. Veterinario Actualizado	vet_1775020269120	$2b$12$6c4dL5YrqH0zCa9CErbEUOhzB/w9kYdNMTCLa/X0qkHKXwMnNwoqG	3	t	2026-04-01 05:11:10.093	\N	0
37	Encargado Almacén	almacen_1775020269120	$2b$12$xWkCpui4vzC.ChhpoBgWmudNl08e6RkFlQSijy7btBg4pXLx1VyUa	6	t	2026-04-01 05:11:11.194	\N	0
38	Produccion Fase 3	prod_f3_1775020272201	$2b$12$0kTGHe4tIJi4qWckFwAVo.B3avy3dvHvPfq5wiLtiM3Gx3WZLLRze	4	t	2026-04-01 05:11:12.719	\N	0
39	Veterinario Fase 3	vet_f3_1775020272201	$2b$12$ooN7lW1Oypbscht6XJGWyuun37LwRg2N5VSvKuscwAZGD72.GoOlO	3	t	2026-04-01 05:11:12.952	\N	0
40	Almacen Fase 3	alm_f3_1775020272201	$2b$12$fFniUIu0LJ8sOAu0RrqQsu.IVd1GMYnv9MO80f64saXTjfK3DqXUu	6	t	2026-04-01 05:11:13.213	\N	0
45	Produccion Fase 3	prod_f3_1775020338685	$2b$12$NSYB4Rem9EB47N9ikL5w4.AsxrBgKMBChP7xOeeQbKp8NHAYYj.dq	4	t	2026-04-01 05:12:19.192	\N	0
46	Veterinario Fase 3	vet_f3_1775020338685	$2b$12$Loghw9l097iX0I5/lrisR.fSynoU8Jji4tJvXBMNKor/tBJSP14Xi	3	t	2026-04-01 05:12:19.451	\N	0
47	Almacen Fase 3	alm_f3_1775020338685	$2b$12$/pWJfnwcVIhEtUf8qD1lvusaTTff9.qxOocgTDWP6OucZz5U81TEe	6	t	2026-04-01 05:12:19.683	\N	0
41	Usuario Lockout RF01	lock_f3_1775020272201	$2b$12$LN4p8jMu9ZL2jTqhNVL9M.Nqsjgf8qrmCgG.FBiVMLlhXtGPFnE.C	4	t	2026-04-01 05:11:14.185	\N	0
48	Usuario Lockout RF01	lock_f3_1775020338685	$2b$12$dn8hT3eShoEOk2h3sdZtR.AUDPDl1j0ayZUWRfLMXmoxqa8PNL3F.	4	t	2026-04-01 05:12:20.603	\N	0
59	Produccion Fase 3	prod_f3_1775021446347	$2b$12$hMwbtz0UYmVuciQMtUmWOeScHfXCZ2/.SBHCfleQet.z4VePT1sEe	4	t	2026-04-01 05:30:46.888	\N	0
52	Produccion Fase 3	prod_f3_1775020411120	$2b$12$UsHMrECpWX7O.TUJPO5NauDD4jjTZy/8.B75G0cP4uNDLqNkhwypS	4	t	2026-04-01 05:13:31.618	\N	0
53	Veterinario Fase 3	vet_f3_1775020411120	$2b$12$ZdGr0Ge8QPvfICCGoN6LEuyVafyeujTEp8ChHmsF9MpOsR2zaf6Dm	3	t	2026-04-01 05:13:31.841	\N	0
49	Dr. Veterinario Actualizado	vet_1775020408204	$2b$12$jSIP1vwl28xsDXfxmFsD3Ohdbr831TvV0uay6rKEI9M7gqK26wraS	3	t	2026-04-01 05:13:29.131	\N	0
54	Almacen Fase 3	alm_f3_1775020411120	$2b$12$sOsd7425MCx/7SiMd.HqmOk/poej.Mj6AVwy/kQWiNO1E5qIk8IXO	6	t	2026-04-01 05:13:32.078	\N	0
51	Encargado Almacén	almacen_1775020408204	$2b$12$njPMVAscxL9H1TDHqr.GYuWQAukOJhPZAhyk87ETtz/jWvje9LnTO	6	t	2026-04-01 05:13:30.265	\N	0
55	Usuario Lockout RF01	lock_f3_1775020411120	$2b$12$21ASM/KuJnOtL4GHxq307.TlsCZYRspvs97OYhns2AGFEixwKIJNq	4	t	2026-04-01 05:13:32.991	\N	0
58	Encargado Almacén	almacen_1775021443296	$2b$12$o9hIwmuA.B/3pA994HxIY.C6iKotZEdHZi3SnHobOXQGF8RBbMIhy	6	t	2026-04-01 05:30:45.478	\N	0
56	Dr. Veterinario Actualizado	vet_1775021443296	$2b$12$Fm3cv7J9LiJr54parwlF3uVBC9kUJkHz42/9wcnwJCcsec/zRElV6	3	t	2026-04-01 05:30:44.267	\N	0
1	Administrador del Sistema	admin	$2b$12$YBpdlPUNlgUXyXieax9.2.IPNATT1sIT9eG4..lEmJOLWbm3.7.lK	2	t	2026-03-31 22:19:30.626	\N	0
60	Veterinario Fase 3	vet_f3_1775021446347	$2b$12$wK0dyhBxwjwkA7QyP1Fgp.MxhCiHLjQ80wcQKSoDtYXWh4YPYzv.O	3	t	2026-04-01 05:30:47.117	\N	0
61	Almacen Fase 3	alm_f3_1775021446347	$2b$12$D7EIz6NhwjB0SUmx0pYXq.JLh4wzmZh8bIowGL8Vklnits/xqE2ai	6	t	2026-04-01 05:30:47.351	\N	0
62	Usuario Lockout RF01	lock_f3_1775021446347	$2b$12$9TYV.7G0HA1N9FEa6snW0eUEbsJAWodA0SmKV33.ferlz8nQv5EpO	4	t	2026-04-01 05:30:48.282	\N	0
\.


--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 231
-- Name: animales_id_animal_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.animales_id_animal_seq', 45, true);


--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 223
-- Name: bitacora_id_bitacora_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bitacora_id_bitacora_seq', 699, true);


--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 235
-- Name: calendario_sanitario_id_calendario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calendario_sanitario_id_calendario_seq', 14, true);


--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 253
-- Name: compras_realizadas_id_compra_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compras_realizadas_id_compra_seq', 11, true);


--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 255
-- Name: detalle_compra_id_detalle_compra_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_compra_id_detalle_compra_seq', 22, true);


--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 251
-- Name: detalle_solicitud_compra_id_detalle_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_solicitud_compra_id_detalle_seq', 33, true);


--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 243
-- Name: eventos_reproductivos_id_evento_reproductivo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eventos_reproductivos_id_evento_reproductivo_seq', 15, true);


--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 233
-- Name: eventos_sanitarios_id_evento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eventos_sanitarios_id_evento_seq', 16, true);


--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 245
-- Name: insumos_id_insumo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.insumos_id_insumo_seq', 22, true);


--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 237
-- Name: lote_validacion_productiva_id_lote_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lote_validacion_productiva_id_lote_seq', 17, true);


--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 247
-- Name: movimientos_inventario_id_movimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movimientos_inventario_id_movimiento_seq', 33, true);


--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 241
-- Name: produccion_leche_id_produccion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.produccion_leche_id_produccion_seq', 15, true);


--
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 225
-- Name: razas_id_raza_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.razas_id_raza_seq', 23, true);


--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 257
-- Name: refresh_tokens_id_refresh_token_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_refresh_token_seq', 83, true);


--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 239
-- Name: registro_peso_id_registro_peso_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registro_peso_id_registro_peso_seq', 16, true);


--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_rol_seq', 6, true);


--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 249
-- Name: solicitudes_compra_id_solicitud_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitudes_compra_id_solicitud_seq', 22, true);


--
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 229
-- Name: tipos_evento_sanitario_id_tipo_evento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipos_evento_sanitario_id_tipo_evento_seq', 3, true);


--
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 227
-- Name: tipos_insumo_id_tipo_insumo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipos_insumo_id_tipo_insumo_seq', 22, true);


--
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 62, true);


--
-- TOC entry 5091 (class 2606 OID 53358)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 5035 (class 2606 OID 52755)
-- Name: animales animales_numero_arete_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.animales
    ADD CONSTRAINT animales_numero_arete_key UNIQUE (numero_arete);


--
-- TOC entry 5037 (class 2606 OID 52753)
-- Name: animales animales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.animales
    ADD CONSTRAINT animales_pkey PRIMARY KEY (id_animal);


--
-- TOC entry 5024 (class 2606 OID 52711)
-- Name: bitacora bitacora_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT bitacora_pkey PRIMARY KEY (id_bitacora);


--
-- TOC entry 5049 (class 2606 OID 52793)
-- Name: calendario_sanitario calendario_sanitario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendario_sanitario
    ADD CONSTRAINT calendario_sanitario_pkey PRIMARY KEY (id_calendario);


--
-- TOC entry 5080 (class 2606 OID 52994)
-- Name: compras_realizadas compras_realizadas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras_realizadas
    ADD CONSTRAINT compras_realizadas_pkey PRIMARY KEY (id_compra);


--
-- TOC entry 5082 (class 2606 OID 53014)
-- Name: detalle_compra detalle_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compra
    ADD CONSTRAINT detalle_compra_pkey PRIMARY KEY (id_detalle_compra);


--
-- TOC entry 5078 (class 2606 OID 52974)
-- Name: detalle_solicitud_compra detalle_solicitud_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_solicitud_compra
    ADD CONSTRAINT detalle_solicitud_compra_pkey PRIMARY KEY (id_detalle);


--
-- TOC entry 5066 (class 2606 OID 52892)
-- Name: eventos_reproductivos eventos_reproductivos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_reproductivos
    ADD CONSTRAINT eventos_reproductivos_pkey PRIMARY KEY (id_evento_reproductivo);


--
-- TOC entry 5044 (class 2606 OID 52770)
-- Name: eventos_sanitarios eventos_sanitarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_sanitarios
    ADD CONSTRAINT eventos_sanitarios_pkey PRIMARY KEY (id_evento);


--
-- TOC entry 5068 (class 2606 OID 52924)
-- Name: insumos insumos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insumos
    ADD CONSTRAINT insumos_pkey PRIMARY KEY (id_insumo);


--
-- TOC entry 5051 (class 2606 OID 52817)
-- Name: lote_validacion_productiva lote_validacion_productiva_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lote_validacion_productiva
    ADD CONSTRAINT lote_validacion_productiva_pkey PRIMARY KEY (id_lote);


--
-- TOC entry 5072 (class 2606 OID 52939)
-- Name: movimientos_inventario movimientos_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id_movimiento);


--
-- TOC entry 5061 (class 2606 OID 52862)
-- Name: produccion_leche produccion_leche_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produccion_leche
    ADD CONSTRAINT produccion_leche_pkey PRIMARY KEY (id_produccion);


--
-- TOC entry 5027 (class 2606 OID 52724)
-- Name: razas razas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.razas
    ADD CONSTRAINT razas_pkey PRIMARY KEY (id_raza);


--
-- TOC entry 5086 (class 2606 OID 53298)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id_refresh_token);


--
-- TOC entry 5089 (class 2606 OID 53300)
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- TOC entry 5056 (class 2606 OID 52832)
-- Name: registro_peso registro_peso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registro_peso
    ADD CONSTRAINT registro_peso_pkey PRIMARY KEY (id_registro_peso);


--
-- TOC entry 5013 (class 2606 OID 52682)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- TOC entry 5076 (class 2606 OID 52954)
-- Name: solicitudes_compra solicitudes_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_compra
    ADD CONSTRAINT solicitudes_compra_pkey PRIMARY KEY (id_solicitud);


--
-- TOC entry 5031 (class 2606 OID 52742)
-- Name: tipos_evento_sanitario tipos_evento_sanitario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_evento_sanitario
    ADD CONSTRAINT tipos_evento_sanitario_pkey PRIMARY KEY (id_tipo_evento);


--
-- TOC entry 5029 (class 2606 OID 52734)
-- Name: tipos_insumo tipos_insumo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_insumo
    ADD CONSTRAINT tipos_insumo_pkey PRIMARY KEY (id_tipo_insumo);


--
-- TOC entry 5018 (class 2606 OID 52695)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 5020 (class 2606 OID 52697)
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- TOC entry 5032 (class 1259 OID 53317)
-- Name: animales_estado_actual_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX animales_estado_actual_idx ON public.animales USING btree (estado_actual);


--
-- TOC entry 5033 (class 1259 OID 53316)
-- Name: animales_id_raza_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX animales_id_raza_idx ON public.animales USING btree (id_raza);


--
-- TOC entry 5021 (class 1259 OID 53375)
-- Name: bitacora_fecha_accion_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bitacora_fecha_accion_idx ON public.bitacora USING btree (fecha_accion);


--
-- TOC entry 5022 (class 1259 OID 53337)
-- Name: bitacora_id_usuario_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bitacora_id_usuario_idx ON public.bitacora USING btree (id_usuario);


--
-- TOC entry 5025 (class 1259 OID 53339)
-- Name: bitacora_tabla_afectada_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bitacora_tabla_afectada_idx ON public.bitacora USING btree (tabla_afectada);


--
-- TOC entry 5045 (class 1259 OID 53324)
-- Name: calendario_sanitario_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX calendario_sanitario_estado_idx ON public.calendario_sanitario USING btree (estado);


--
-- TOC entry 5046 (class 1259 OID 53323)
-- Name: calendario_sanitario_fecha_programada_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX calendario_sanitario_fecha_programada_idx ON public.calendario_sanitario USING btree (fecha_programada);


--
-- TOC entry 5047 (class 1259 OID 53322)
-- Name: calendario_sanitario_id_animal_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX calendario_sanitario_id_animal_idx ON public.calendario_sanitario USING btree (id_animal);


--
-- TOC entry 5062 (class 1259 OID 53333)
-- Name: eventos_reproductivos_fecha_evento_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX eventos_reproductivos_fecha_evento_idx ON public.eventos_reproductivos USING btree (fecha_evento);


--
-- TOC entry 5063 (class 1259 OID 53331)
-- Name: eventos_reproductivos_id_animal_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX eventos_reproductivos_id_animal_idx ON public.eventos_reproductivos USING btree (id_animal);


--
-- TOC entry 5064 (class 1259 OID 53332)
-- Name: eventos_reproductivos_id_lote_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX eventos_reproductivos_id_lote_idx ON public.eventos_reproductivos USING btree (id_lote);


--
-- TOC entry 5039 (class 1259 OID 53321)
-- Name: eventos_sanitarios_estado_aprobacion_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX eventos_sanitarios_estado_aprobacion_idx ON public.eventos_sanitarios USING btree (estado_aprobacion);


--
-- TOC entry 5040 (class 1259 OID 53320)
-- Name: eventos_sanitarios_fecha_evento_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX eventos_sanitarios_fecha_evento_idx ON public.eventos_sanitarios USING btree (fecha_evento);


--
-- TOC entry 5041 (class 1259 OID 53318)
-- Name: eventos_sanitarios_id_animal_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX eventos_sanitarios_id_animal_idx ON public.eventos_sanitarios USING btree (id_animal);


--
-- TOC entry 5042 (class 1259 OID 53319)
-- Name: eventos_sanitarios_id_tipo_evento_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX eventos_sanitarios_id_tipo_evento_idx ON public.eventos_sanitarios USING btree (id_tipo_evento);


--
-- TOC entry 5038 (class 1259 OID 53315)
-- Name: idx_animales_arete; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_animales_arete ON public.animales USING btree (numero_arete);


--
-- TOC entry 5014 (class 1259 OID 53340)
-- Name: idx_usuarios_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_usuarios_username ON public.usuarios USING btree (username);


--
-- TOC entry 5069 (class 1259 OID 53335)
-- Name: movimientos_inventario_fecha_movimiento_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX movimientos_inventario_fecha_movimiento_idx ON public.movimientos_inventario USING btree (fecha_movimiento);


--
-- TOC entry 5070 (class 1259 OID 53334)
-- Name: movimientos_inventario_id_insumo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX movimientos_inventario_id_insumo_idx ON public.movimientos_inventario USING btree (id_insumo);


--
-- TOC entry 5073 (class 1259 OID 53278)
-- Name: movimientos_inventario_registrado_por_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX movimientos_inventario_registrado_por_idx ON public.movimientos_inventario USING btree (registrado_por);


--
-- TOC entry 5074 (class 1259 OID 53336)
-- Name: movimientos_inventario_tipo_movimiento_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX movimientos_inventario_tipo_movimiento_idx ON public.movimientos_inventario USING btree (tipo_movimiento);


--
-- TOC entry 5057 (class 1259 OID 53330)
-- Name: produccion_leche_fecha_registro_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX produccion_leche_fecha_registro_idx ON public.produccion_leche USING btree (fecha_registro);


--
-- TOC entry 5058 (class 1259 OID 53328)
-- Name: produccion_leche_id_animal_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX produccion_leche_id_animal_idx ON public.produccion_leche USING btree (id_animal);


--
-- TOC entry 5059 (class 1259 OID 53329)
-- Name: produccion_leche_id_lote_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX produccion_leche_id_lote_idx ON public.produccion_leche USING btree (id_lote);


--
-- TOC entry 5083 (class 1259 OID 53485)
-- Name: refresh_tokens_fecha_expiracion_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refresh_tokens_fecha_expiracion_idx ON public.refresh_tokens USING btree (fecha_expiracion);


--
-- TOC entry 5084 (class 1259 OID 53306)
-- Name: refresh_tokens_id_usuario_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refresh_tokens_id_usuario_idx ON public.refresh_tokens USING btree (id_usuario);


--
-- TOC entry 5087 (class 1259 OID 53307)
-- Name: refresh_tokens_token_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refresh_tokens_token_idx ON public.refresh_tokens USING btree (token);


--
-- TOC entry 5052 (class 1259 OID 53327)
-- Name: registro_peso_fecha_registro_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX registro_peso_fecha_registro_idx ON public.registro_peso USING btree (fecha_registro);


--
-- TOC entry 5053 (class 1259 OID 53325)
-- Name: registro_peso_id_animal_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX registro_peso_id_animal_idx ON public.registro_peso USING btree (id_animal);


--
-- TOC entry 5054 (class 1259 OID 53326)
-- Name: registro_peso_id_lote_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX registro_peso_id_lote_idx ON public.registro_peso USING btree (id_lote);


--
-- TOC entry 5015 (class 1259 OID 53537)
-- Name: usuarios_bloqueado_hasta_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX usuarios_bloqueado_hasta_idx ON public.usuarios USING btree (bloqueado_hasta);


--
-- TOC entry 5016 (class 1259 OID 53341)
-- Name: usuarios_id_rol_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX usuarios_id_rol_idx ON public.usuarios USING btree (id_rol);


--
-- TOC entry 5094 (class 2606 OID 53553)
-- Name: animales animales_id_raza_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.animales
    ADD CONSTRAINT animales_id_raza_fkey FOREIGN KEY (id_raza) REFERENCES public.razas(id_raza) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5093 (class 2606 OID 53543)
-- Name: bitacora bitacora_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT bitacora_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5098 (class 2606 OID 53573)
-- Name: calendario_sanitario calendario_sanitario_id_animal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendario_sanitario
    ADD CONSTRAINT calendario_sanitario_id_animal_fkey FOREIGN KEY (id_animal) REFERENCES public.animales(id_animal) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5099 (class 2606 OID 53578)
-- Name: calendario_sanitario calendario_sanitario_id_tipo_evento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendario_sanitario
    ADD CONSTRAINT calendario_sanitario_id_tipo_evento_fkey FOREIGN KEY (id_tipo_evento) REFERENCES public.tipos_evento_sanitario(id_tipo_evento) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5100 (class 2606 OID 53583)
-- Name: calendario_sanitario calendario_sanitario_programado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendario_sanitario
    ADD CONSTRAINT calendario_sanitario_programado_por_fkey FOREIGN KEY (programado_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5122 (class 2606 OID 53693)
-- Name: compras_realizadas compras_realizadas_id_solicitud_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras_realizadas
    ADD CONSTRAINT compras_realizadas_id_solicitud_fkey FOREIGN KEY (id_solicitud) REFERENCES public.solicitudes_compra(id_solicitud) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5123 (class 2606 OID 53698)
-- Name: compras_realizadas compras_realizadas_realizada_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras_realizadas
    ADD CONSTRAINT compras_realizadas_realizada_por_fkey FOREIGN KEY (realizada_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5124 (class 2606 OID 53703)
-- Name: detalle_compra detalle_compra_id_compra_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compra
    ADD CONSTRAINT detalle_compra_id_compra_fkey FOREIGN KEY (id_compra) REFERENCES public.compras_realizadas(id_compra) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5125 (class 2606 OID 53708)
-- Name: detalle_compra detalle_compra_id_insumo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compra
    ADD CONSTRAINT detalle_compra_id_insumo_fkey FOREIGN KEY (id_insumo) REFERENCES public.insumos(id_insumo) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5120 (class 2606 OID 53688)
-- Name: detalle_solicitud_compra detalle_solicitud_compra_id_insumo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_solicitud_compra
    ADD CONSTRAINT detalle_solicitud_compra_id_insumo_fkey FOREIGN KEY (id_insumo) REFERENCES public.insumos(id_insumo) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5121 (class 2606 OID 53683)
-- Name: detalle_solicitud_compra detalle_solicitud_compra_id_solicitud_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_solicitud_compra
    ADD CONSTRAINT detalle_solicitud_compra_id_solicitud_fkey FOREIGN KEY (id_solicitud) REFERENCES public.solicitudes_compra(id_solicitud) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5110 (class 2606 OID 53633)
-- Name: eventos_reproductivos eventos_reproductivos_id_animal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_reproductivos
    ADD CONSTRAINT eventos_reproductivos_id_animal_fkey FOREIGN KEY (id_animal) REFERENCES public.animales(id_animal) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5111 (class 2606 OID 53638)
-- Name: eventos_reproductivos eventos_reproductivos_id_lote_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_reproductivos
    ADD CONSTRAINT eventos_reproductivos_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lote_validacion_productiva(id_lote) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5112 (class 2606 OID 53643)
-- Name: eventos_reproductivos eventos_reproductivos_registrado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_reproductivos
    ADD CONSTRAINT eventos_reproductivos_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5113 (class 2606 OID 53648)
-- Name: eventos_reproductivos eventos_reproductivos_validado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_reproductivos
    ADD CONSTRAINT eventos_reproductivos_validado_por_fkey FOREIGN KEY (validado_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5095 (class 2606 OID 53568)
-- Name: eventos_sanitarios eventos_sanitarios_autorizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_sanitarios
    ADD CONSTRAINT eventos_sanitarios_autorizado_por_fkey FOREIGN KEY (autorizado_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5096 (class 2606 OID 53558)
-- Name: eventos_sanitarios eventos_sanitarios_id_animal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_sanitarios
    ADD CONSTRAINT eventos_sanitarios_id_animal_fkey FOREIGN KEY (id_animal) REFERENCES public.animales(id_animal) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5097 (class 2606 OID 53563)
-- Name: eventos_sanitarios eventos_sanitarios_id_tipo_evento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_sanitarios
    ADD CONSTRAINT eventos_sanitarios_id_tipo_evento_fkey FOREIGN KEY (id_tipo_evento) REFERENCES public.tipos_evento_sanitario(id_tipo_evento) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5114 (class 2606 OID 53653)
-- Name: insumos insumos_id_tipo_insumo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insumos
    ADD CONSTRAINT insumos_id_tipo_insumo_fkey FOREIGN KEY (id_tipo_insumo) REFERENCES public.tipos_insumo(id_tipo_insumo) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5101 (class 2606 OID 53588)
-- Name: lote_validacion_productiva lote_validacion_productiva_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lote_validacion_productiva
    ADD CONSTRAINT lote_validacion_productiva_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5115 (class 2606 OID 53658)
-- Name: movimientos_inventario movimientos_inventario_id_insumo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_id_insumo_fkey FOREIGN KEY (id_insumo) REFERENCES public.insumos(id_insumo) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5116 (class 2606 OID 53663)
-- Name: movimientos_inventario movimientos_inventario_referencia_compra_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_referencia_compra_fkey FOREIGN KEY (referencia_compra) REFERENCES public.compras_realizadas(id_compra) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5117 (class 2606 OID 53668)
-- Name: movimientos_inventario movimientos_inventario_registrado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5106 (class 2606 OID 53613)
-- Name: produccion_leche produccion_leche_id_animal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produccion_leche
    ADD CONSTRAINT produccion_leche_id_animal_fkey FOREIGN KEY (id_animal) REFERENCES public.animales(id_animal) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5107 (class 2606 OID 53618)
-- Name: produccion_leche produccion_leche_id_lote_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produccion_leche
    ADD CONSTRAINT produccion_leche_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lote_validacion_productiva(id_lote) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5108 (class 2606 OID 53623)
-- Name: produccion_leche produccion_leche_registrado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produccion_leche
    ADD CONSTRAINT produccion_leche_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5109 (class 2606 OID 53628)
-- Name: produccion_leche produccion_leche_validado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produccion_leche
    ADD CONSTRAINT produccion_leche_validado_por_fkey FOREIGN KEY (validado_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5126 (class 2606 OID 53548)
-- Name: refresh_tokens refresh_tokens_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5102 (class 2606 OID 53593)
-- Name: registro_peso registro_peso_id_animal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registro_peso
    ADD CONSTRAINT registro_peso_id_animal_fkey FOREIGN KEY (id_animal) REFERENCES public.animales(id_animal) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5103 (class 2606 OID 53598)
-- Name: registro_peso registro_peso_id_lote_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registro_peso
    ADD CONSTRAINT registro_peso_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lote_validacion_productiva(id_lote) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5104 (class 2606 OID 53603)
-- Name: registro_peso registro_peso_registrado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registro_peso
    ADD CONSTRAINT registro_peso_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5105 (class 2606 OID 53608)
-- Name: registro_peso registro_peso_validado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registro_peso
    ADD CONSTRAINT registro_peso_validado_por_fkey FOREIGN KEY (validado_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5118 (class 2606 OID 53678)
-- Name: solicitudes_compra solicitudes_compra_aprobada_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_compra
    ADD CONSTRAINT solicitudes_compra_aprobada_por_fkey FOREIGN KEY (aprobada_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5119 (class 2606 OID 53673)
-- Name: solicitudes_compra solicitudes_compra_solicitada_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_compra
    ADD CONSTRAINT solicitudes_compra_solicitada_por_fkey FOREIGN KEY (solicitada_por) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5092 (class 2606 OID 53538)
-- Name: usuarios usuarios_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2026-04-01 17:12:11

--
-- PostgreSQL database dump complete
--

\unrestrict nAtc8lZE4PoVpLC94hMCA5ht9JzBGhD6Y9hwZ7bomWwLgiuSCngUOSOzamNHfmH

