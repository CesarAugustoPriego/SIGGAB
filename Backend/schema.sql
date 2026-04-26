-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "estado_registro" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "estado_animal" AS ENUM ('ACTIVO', 'VENDIDO', 'MUERTO', 'TRANSFERIDO');

-- CreateEnum
CREATE TYPE "sexo_animal" AS ENUM ('HEMBRA', 'MACHO');

-- CreateEnum
CREATE TYPE "procedencia_animal" AS ENUM ('NACIDA', 'ADQUIRIDA');

-- CreateEnum
CREATE TYPE "tipo_movimiento" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "estado_solicitud" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "estado_calendario" AS ENUM ('PENDIENTE', 'COMPLETADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "roles" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expo_push_token" VARCHAR(255),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "bitacora" (
    "id_bitacora" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "accion" VARCHAR(50) NOT NULL,
    "tabla_afectada" VARCHAR(50) NOT NULL,
    "id_registro" INTEGER NOT NULL,
    "fecha_accion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalles" JSONB,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id_bitacora")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id_refresh_token" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_origen" VARCHAR(45),
    "user_agent" VARCHAR(255),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id_refresh_token")
);

-- CreateTable
CREATE TABLE "razas" (
    "id_raza" SERIAL NOT NULL,
    "nombre_raza" VARCHAR(50) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "razas_pkey" PRIMARY KEY ("id_raza")
);

-- CreateTable
CREATE TABLE "animales" (
    "id_animal" SERIAL NOT NULL,
    "numero_arete" VARCHAR(50) NOT NULL,
    "fecha_ingreso" DATE NOT NULL,
    "peso_inicial" DECIMAL(65,30) NOT NULL,
    "id_raza" INTEGER NOT NULL,
    "sexo" "sexo_animal" NOT NULL DEFAULT 'HEMBRA',
    "procedencia" "procedencia_animal" NOT NULL DEFAULT 'ADQUIRIDA',
    "edad_estimada" INTEGER,
    "estado_sanitario_inicial" TEXT,
    "foto_url" VARCHAR(255),
    "estado_actual" "estado_animal" NOT NULL DEFAULT 'ACTIVO',
    "motivo_baja" TEXT,
    "fecha_baja" DATE,

    CONSTRAINT "animales_pkey" PRIMARY KEY ("id_animal")
);

-- CreateTable
CREATE TABLE "tipos_evento_sanitario" (
    "id_tipo_evento" SERIAL NOT NULL,
    "nombre_tipo" VARCHAR(50) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipos_evento_sanitario_pkey" PRIMARY KEY ("id_tipo_evento")
);

-- CreateTable
CREATE TABLE "eventos_sanitarios" (
    "id_evento" SERIAL NOT NULL,
    "id_animal" INTEGER NOT NULL,
    "id_tipo_evento" INTEGER NOT NULL,
    "fecha_evento" DATE NOT NULL,
    "diagnostico" TEXT,
    "medicamento" VARCHAR(100),
    "dosis" VARCHAR(50),
    "estado_aprobacion" "estado_registro" NOT NULL DEFAULT 'PENDIENTE',
    "autorizado_por" INTEGER,

    CONSTRAINT "eventos_sanitarios_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "calendario_sanitario" (
    "id_calendario" SERIAL NOT NULL,
    "id_animal" INTEGER NOT NULL,
    "id_tipo_evento" INTEGER NOT NULL,
    "fecha_programada" DATE NOT NULL,
    "fecha_alerta" DATE,
    "programado_por" INTEGER NOT NULL,
    "estado" "estado_calendario" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "calendario_sanitario_pkey" PRIMARY KEY ("id_calendario")
);

-- CreateTable
CREATE TABLE "lote_validacion_productiva" (
    "id_lote" SERIAL NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "creado_por" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "estado_registro" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "lote_validacion_productiva_pkey" PRIMARY KEY ("id_lote")
);

-- CreateTable
CREATE TABLE "registro_peso" (
    "id_registro_peso" SERIAL NOT NULL,
    "id_animal" INTEGER NOT NULL,
    "id_lote" INTEGER NOT NULL,
    "peso" DECIMAL(65,30) NOT NULL,
    "fecha_registro" DATE NOT NULL,
    "registrado_por" INTEGER NOT NULL,
    "estado_validacion" "estado_registro" NOT NULL DEFAULT 'PENDIENTE',
    "validado_por" INTEGER,

    CONSTRAINT "registro_peso_pkey" PRIMARY KEY ("id_registro_peso")
);

-- CreateTable
CREATE TABLE "produccion_leche" (
    "id_produccion" SERIAL NOT NULL,
    "id_animal" INTEGER NOT NULL,
    "id_lote" INTEGER NOT NULL,
    "litros_producidos" DECIMAL(65,30) NOT NULL,
    "fecha_registro" DATE NOT NULL,
    "registrado_por" INTEGER NOT NULL,
    "estado_validacion" "estado_registro" NOT NULL DEFAULT 'PENDIENTE',
    "validado_por" INTEGER,

    CONSTRAINT "produccion_leche_pkey" PRIMARY KEY ("id_produccion")
);

-- CreateTable
CREATE TABLE "eventos_reproductivos" (
    "id_evento_reproductivo" SERIAL NOT NULL,
    "id_animal" INTEGER NOT NULL,
    "id_lote" INTEGER,
    "tipo_evento" VARCHAR(50) NOT NULL,
    "fecha_evento" DATE NOT NULL,
    "observaciones" TEXT,
    "registrado_por" INTEGER NOT NULL,
    "estado_validacion" "estado_registro" NOT NULL DEFAULT 'PENDIENTE',
    "validado_por" INTEGER,

    CONSTRAINT "eventos_reproductivos_pkey" PRIMARY KEY ("id_evento_reproductivo")
);

-- CreateTable
CREATE TABLE "tipos_insumo" (
    "id_tipo_insumo" SERIAL NOT NULL,
    "nombre_tipo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipos_insumo_pkey" PRIMARY KEY ("id_tipo_insumo")
);

-- CreateTable
CREATE TABLE "insumos" (
    "id_insumo" SERIAL NOT NULL,
    "nombre_insumo" VARCHAR(100) NOT NULL,
    "id_tipo_insumo" INTEGER NOT NULL,
    "unidad_medida" VARCHAR(20) NOT NULL,
    "descripcion" TEXT,
    "stock_actual" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "insumos_pkey" PRIMARY KEY ("id_insumo")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id_movimiento" SERIAL NOT NULL,
    "id_insumo" INTEGER NOT NULL,
    "tipo_movimiento" "tipo_movimiento" NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "fecha_movimiento" DATE NOT NULL,
    "referencia_compra" INTEGER,
    "registrado_por" INTEGER NOT NULL,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id_movimiento")
);

-- CreateTable
CREATE TABLE "solicitudes_compra" (
    "id_solicitud" SERIAL NOT NULL,
    "fecha_solicitud" DATE NOT NULL,
    "solicitada_por" INTEGER NOT NULL,
    "estado_solicitud" "estado_solicitud" NOT NULL DEFAULT 'PENDIENTE',
    "aprobada_por" INTEGER,
    "fecha_aprobacion" TIMESTAMP(3),
    "observaciones" TEXT,

    CONSTRAINT "solicitudes_compra_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "detalle_solicitud_compra" (
    "id_detalle" SERIAL NOT NULL,
    "id_solicitud" INTEGER NOT NULL,
    "id_insumo" INTEGER NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "precio_estimado" DECIMAL(65,30) NOT NULL,
    "subtotal_estimado" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "detalle_solicitud_compra_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "compras_realizadas" (
    "id_compra" SERIAL NOT NULL,
    "id_solicitud" INTEGER NOT NULL,
    "fecha_compra" DATE NOT NULL,
    "realizada_por" INTEGER NOT NULL,
    "total_real" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "compras_realizadas_pkey" PRIMARY KEY ("id_compra")
);

-- CreateTable
CREATE TABLE "detalle_compra" (
    "id_detalle_compra" SERIAL NOT NULL,
    "id_compra" INTEGER NOT NULL,
    "id_insumo" INTEGER NOT NULL,
    "cantidad_real" DECIMAL(65,30) NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "detalle_compra_pkey" PRIMARY KEY ("id_detalle_compra")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE INDEX "usuarios_id_rol_idx" ON "usuarios"("id_rol");

-- CreateIndex
CREATE INDEX "usuarios_bloqueado_hasta_idx" ON "usuarios"("bloqueado_hasta");

-- CreateIndex
CREATE INDEX "bitacora_id_usuario_idx" ON "bitacora"("id_usuario");

-- CreateIndex
CREATE INDEX "bitacora_fecha_accion_idx" ON "bitacora"("fecha_accion");

-- CreateIndex
CREATE INDEX "bitacora_tabla_afectada_idx" ON "bitacora"("tabla_afectada");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_id_usuario_idx" ON "refresh_tokens"("id_usuario");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_fecha_expiracion_idx" ON "refresh_tokens"("fecha_expiracion");

-- CreateIndex
CREATE UNIQUE INDEX "animales_numero_arete_key" ON "animales"("numero_arete");

-- CreateIndex
CREATE INDEX "animales_id_raza_idx" ON "animales"("id_raza");

-- CreateIndex
CREATE INDEX "animales_estado_actual_idx" ON "animales"("estado_actual");

-- CreateIndex
CREATE INDEX "animales_sexo_idx" ON "animales"("sexo");

-- CreateIndex
CREATE INDEX "eventos_sanitarios_id_animal_idx" ON "eventos_sanitarios"("id_animal");

-- CreateIndex
CREATE INDEX "eventos_sanitarios_id_tipo_evento_idx" ON "eventos_sanitarios"("id_tipo_evento");

-- CreateIndex
CREATE INDEX "eventos_sanitarios_fecha_evento_idx" ON "eventos_sanitarios"("fecha_evento");

-- CreateIndex
CREATE INDEX "eventos_sanitarios_estado_aprobacion_idx" ON "eventos_sanitarios"("estado_aprobacion");

-- CreateIndex
CREATE INDEX "calendario_sanitario_id_animal_idx" ON "calendario_sanitario"("id_animal");

-- CreateIndex
CREATE INDEX "calendario_sanitario_fecha_programada_idx" ON "calendario_sanitario"("fecha_programada");

-- CreateIndex
CREATE INDEX "calendario_sanitario_estado_idx" ON "calendario_sanitario"("estado");

-- CreateIndex
CREATE INDEX "registro_peso_id_animal_idx" ON "registro_peso"("id_animal");

-- CreateIndex
CREATE INDEX "registro_peso_id_lote_idx" ON "registro_peso"("id_lote");

-- CreateIndex
CREATE INDEX "registro_peso_fecha_registro_idx" ON "registro_peso"("fecha_registro");

-- CreateIndex
CREATE INDEX "produccion_leche_id_animal_idx" ON "produccion_leche"("id_animal");

-- CreateIndex
CREATE INDEX "produccion_leche_id_lote_idx" ON "produccion_leche"("id_lote");

-- CreateIndex
CREATE INDEX "produccion_leche_fecha_registro_idx" ON "produccion_leche"("fecha_registro");

-- CreateIndex
CREATE INDEX "eventos_reproductivos_id_animal_idx" ON "eventos_reproductivos"("id_animal");

-- CreateIndex
CREATE INDEX "eventos_reproductivos_id_lote_idx" ON "eventos_reproductivos"("id_lote");

-- CreateIndex
CREATE INDEX "eventos_reproductivos_fecha_evento_idx" ON "eventos_reproductivos"("fecha_evento");

-- CreateIndex
CREATE INDEX "movimientos_inventario_id_insumo_idx" ON "movimientos_inventario"("id_insumo");

-- CreateIndex
CREATE INDEX "movimientos_inventario_fecha_movimiento_idx" ON "movimientos_inventario"("fecha_movimiento");

-- CreateIndex
CREATE INDEX "movimientos_inventario_tipo_movimiento_idx" ON "movimientos_inventario"("tipo_movimiento");

-- CreateIndex
CREATE INDEX "movimientos_inventario_registrado_por_idx" ON "movimientos_inventario"("registrado_por");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animales" ADD CONSTRAINT "animales_id_raza_fkey" FOREIGN KEY ("id_raza") REFERENCES "razas"("id_raza") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_sanitarios" ADD CONSTRAINT "eventos_sanitarios_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "animales"("id_animal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_sanitarios" ADD CONSTRAINT "eventos_sanitarios_id_tipo_evento_fkey" FOREIGN KEY ("id_tipo_evento") REFERENCES "tipos_evento_sanitario"("id_tipo_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_sanitarios" ADD CONSTRAINT "eventos_sanitarios_autorizado_por_fkey" FOREIGN KEY ("autorizado_por") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendario_sanitario" ADD CONSTRAINT "calendario_sanitario_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "animales"("id_animal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendario_sanitario" ADD CONSTRAINT "calendario_sanitario_id_tipo_evento_fkey" FOREIGN KEY ("id_tipo_evento") REFERENCES "tipos_evento_sanitario"("id_tipo_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendario_sanitario" ADD CONSTRAINT "calendario_sanitario_programado_por_fkey" FOREIGN KEY ("programado_por") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_validacion_productiva" ADD CONSTRAINT "lote_validacion_productiva_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_peso" ADD CONSTRAINT "registro_peso_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "animales"("id_animal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_peso" ADD CONSTRAINT "registro_peso_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lote_validacion_productiva"("id_lote") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_peso" ADD CONSTRAINT "registro_peso_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_peso" ADD CONSTRAINT "registro_peso_validado_por_fkey" FOREIGN KEY ("validado_por") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_leche" ADD CONSTRAINT "produccion_leche_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "animales"("id_animal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_leche" ADD CONSTRAINT "produccion_leche_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lote_validacion_productiva"("id_lote") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_leche" ADD CONSTRAINT "produccion_leche_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_leche" ADD CONSTRAINT "produccion_leche_validado_por_fkey" FOREIGN KEY ("validado_por") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_reproductivos" ADD CONSTRAINT "eventos_reproductivos_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "animales"("id_animal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_reproductivos" ADD CONSTRAINT "eventos_reproductivos_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lote_validacion_productiva"("id_lote") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_reproductivos" ADD CONSTRAINT "eventos_reproductivos_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_reproductivos" ADD CONSTRAINT "eventos_reproductivos_validado_por_fkey" FOREIGN KEY ("validado_por") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_id_tipo_insumo_fkey" FOREIGN KEY ("id_tipo_insumo") REFERENCES "tipos_insumo"("id_tipo_insumo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "insumos"("id_insumo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_referencia_compra_fkey" FOREIGN KEY ("referencia_compra") REFERENCES "compras_realizadas"("id_compra") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_compra" ADD CONSTRAINT "solicitudes_compra_solicitada_por_fkey" FOREIGN KEY ("solicitada_por") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_compra" ADD CONSTRAINT "solicitudes_compra_aprobada_por_fkey" FOREIGN KEY ("aprobada_por") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_solicitud_compra" ADD CONSTRAINT "detalle_solicitud_compra_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitudes_compra"("id_solicitud") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_solicitud_compra" ADD CONSTRAINT "detalle_solicitud_compra_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "insumos"("id_insumo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras_realizadas" ADD CONSTRAINT "compras_realizadas_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitudes_compra"("id_solicitud") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras_realizadas" ADD CONSTRAINT "compras_realizadas_realizada_por_fkey" FOREIGN KEY ("realizada_por") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_compra" ADD CONSTRAINT "detalle_compra_id_compra_fkey" FOREIGN KEY ("id_compra") REFERENCES "compras_realizadas"("id_compra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_compra" ADD CONSTRAINT "detalle_compra_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "insumos"("id_insumo") ON DELETE RESTRICT ON UPDATE CASCADE;

