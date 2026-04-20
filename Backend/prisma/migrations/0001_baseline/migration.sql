-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."estado_animal" AS ENUM ('ACTIVO', 'VENDIDO', 'MUERTO', 'TRANSFERIDO');

-- CreateEnum
CREATE TYPE "public"."estado_calendario" AS ENUM ('PENDIENTE', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."estado_registro" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "public"."estado_solicitud" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "public"."tipo_movimiento" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateTable
CREATE TABLE "public"."animales" (
    "id_animal" SERIAL NOT NULL,
    "numero_arete" VARCHAR(50) NOT NULL,
    "fecha_ingreso" DATE,
    "peso_inicial" DECIMAL,
    "id_raza" INTEGER,
    "procedencia" VARCHAR(100),
    "edad_estimada" INTEGER,
    "estado_sanitario_inicial" TEXT,
    "estado_actual" "public"."estado_animal",
    "motivo_baja" TEXT,
    "fecha_baja" DATE,

    CONSTRAINT "animales_pkey" PRIMARY KEY ("id_animal")
);

-- CreateTable
CREATE TABLE "public"."bitacora" (
    "id_bitacora" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "accion" VARCHAR(50),
    "tabla_afectada" VARCHAR(50),
    "id_registro" INTEGER,
    "fecha_hora" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "detalles" JSONB,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id_bitacora")
);

-- CreateTable
CREATE TABLE "public"."calendario_sanitario" (
    "id_calendario" SERIAL NOT NULL,
    "id_animal" INTEGER,
    "id_tipo_evento" INTEGER,
    "fecha_programada" DATE,
    "fecha_alerta" DATE,
    "programado_por" INTEGER,
    "estado" "public"."estado_calendario",

    CONSTRAINT "calendario_sanitario_pkey" PRIMARY KEY ("id_calendario")
);

-- CreateTable
CREATE TABLE "public"."compras_realizadas" (
    "id_compra" SERIAL NOT NULL,
    "id_solicitud" INTEGER,
    "fecha_compra" DATE,
    "realizada_por" INTEGER,
    "proveedor" VARCHAR(100),
    "total_real" DECIMAL,

    CONSTRAINT "compras_realizadas_pkey" PRIMARY KEY ("id_compra")
);

-- CreateTable
CREATE TABLE "public"."detalle_compra" (
    "id_detalle_compra" SERIAL NOT NULL,
    "id_compra" INTEGER,
    "id_insumo" INTEGER,
    "cantidad_real" DECIMAL,
    "precio_unitario" DECIMAL,
    "subtotal" DECIMAL,

    CONSTRAINT "detalle_compra_pkey" PRIMARY KEY ("id_detalle_compra")
);

-- CreateTable
CREATE TABLE "public"."detalle_solicitud_compra" (
    "id_detalle" SERIAL NOT NULL,
    "id_solicitud" INTEGER,
    "id_insumo" INTEGER,
    "cantidad" DECIMAL,
    "precio_estimado" DECIMAL,
    "subtotal_estimado" DECIMAL,

    CONSTRAINT "detalle_solicitud_compra_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "public"."eventos_reproductivos" (
    "id_evento_reproductivo" SERIAL NOT NULL,
    "id_animal" INTEGER,
    "id_lote" INTEGER,
    "tipo_evento" VARCHAR(50),
    "fecha_evento" DATE,
    "observaciones" TEXT,
    "registrado_por" INTEGER,
    "estado_validacion" "public"."estado_registro",
    "validado_por" INTEGER,

    CONSTRAINT "eventos_reproductivos_pkey" PRIMARY KEY ("id_evento_reproductivo")
);

-- CreateTable
CREATE TABLE "public"."eventos_sanitarios" (
    "id_evento" SERIAL NOT NULL,
    "id_animal" INTEGER,
    "id_tipo_evento" INTEGER,
    "fecha_evento" DATE,
    "diagnostico" TEXT,
    "medicamento" VARCHAR(100),
    "dosis" VARCHAR(50),
    "estado_aprobacion" "public"."estado_registro",
    "autorizado_por" INTEGER,

    CONSTRAINT "eventos_sanitarios_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "public"."insumos" (
    "id_insumo" SERIAL NOT NULL,
    "nombre_insumo" VARCHAR(100),
    "id_tipo_insumo" INTEGER,
    "unidad_medida" VARCHAR(20),
    "descripcion" TEXT,
    "stock_actual" DECIMAL DEFAULT 0,
    "activo" BOOLEAN DEFAULT true,

    CONSTRAINT "insumos_pkey" PRIMARY KEY ("id_insumo")
);

-- CreateTable
CREATE TABLE "public"."lote_validacion_productiva" (
    "id_lote" SERIAL NOT NULL,
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "creado_por" INTEGER,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "estado" "public"."estado_registro",

    CONSTRAINT "lote_validacion_productiva_pkey" PRIMARY KEY ("id_lote")
);

-- CreateTable
CREATE TABLE "public"."movimientos_inventario" (
    "id_movimiento" SERIAL NOT NULL,
    "id_insumo" INTEGER,
    "tipo_movimiento" "public"."tipo_movimiento",
    "cantidad" DECIMAL,
    "fecha_movimiento" DATE,
    "referencia_compra" INTEGER,
    "registrado_por" INTEGER NOT NULL,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id_movimiento")
);

-- CreateTable
CREATE TABLE "public"."produccion_leche" (
    "id_produccion" SERIAL NOT NULL,
    "id_animal" INTEGER,
    "id_lote" INTEGER,
    "litros_producidos" DECIMAL,
    "fecha_registro" DATE,
    "registrado_por" INTEGER,
    "estado_validacion" "public"."estado_registro",
    "validado_por" INTEGER,

    CONSTRAINT "produccion_leche_pkey" PRIMARY KEY ("id_produccion")
);

-- CreateTable
CREATE TABLE "public"."razas" (
    "id_raza" SERIAL NOT NULL,
    "nombre_raza" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "razas_pkey" PRIMARY KEY ("id_raza")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id_refresh_token" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "fecha_expiracion" TIMESTAMP(6) NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_origen" VARCHAR(45),
    "user_agent" VARCHAR(255),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id_refresh_token")
);

-- CreateTable
CREATE TABLE "public"."registro_peso" (
    "id_registro_peso" SERIAL NOT NULL,
    "id_animal" INTEGER,
    "id_lote" INTEGER,
    "peso" DECIMAL,
    "fecha_registro" DATE,
    "registrado_por" INTEGER,
    "estado_validacion" "public"."estado_registro",
    "validado_por" INTEGER,

    CONSTRAINT "registro_peso_pkey" PRIMARY KEY ("id_registro_peso")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "public"."solicitudes_compra" (
    "id_solicitud" SERIAL NOT NULL,
    "fecha_solicitud" DATE,
    "solicitada_por" INTEGER,
    "estado_solicitud" "public"."estado_solicitud",
    "aprobada_por" INTEGER,
    "fecha_aprobacion" TIMESTAMP(6),
    "observaciones" TEXT,

    CONSTRAINT "solicitudes_compra_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "public"."tipos_evento_sanitario" (
    "id_tipo_evento" SERIAL NOT NULL,
    "nombre_tipo" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipos_evento_sanitario_pkey" PRIMARY KEY ("id_tipo_evento")
);

-- CreateTable
CREATE TABLE "public"."tipos_insumo" (
    "id_tipo_insumo" SERIAL NOT NULL,
    "nombre_tipo" VARCHAR(50),
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipos_insumo_pkey" PRIMARY KEY ("id_tipo_insumo")
);

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "id_rol" INTEGER,
    "activo" BOOLEAN DEFAULT true,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateIndex
CREATE UNIQUE INDEX "animales_numero_arete_key" ON "public"."animales"("numero_arete" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "idx_animales_arete" ON "public"."animales"("numero_arete" ASC);

-- CreateIndex
CREATE INDEX "idx_animales_estado" ON "public"."animales"("estado_actual" ASC);

-- CreateIndex
CREATE INDEX "idx_animales_raza" ON "public"."animales"("id_raza" ASC);

-- CreateIndex
CREATE INDEX "idx_bitacora_detalles" ON "public"."bitacora" USING GIN ("detalles" jsonb_ops);

-- CreateIndex
CREATE INDEX "idx_bitacora_fecha" ON "public"."bitacora"("fecha_hora" ASC);

-- CreateIndex
CREATE INDEX "idx_bitacora_tabla" ON "public"."bitacora"("tabla_afectada" ASC);

-- CreateIndex
CREATE INDEX "idx_bitacora_usuario" ON "public"."bitacora"("id_usuario" ASC);

-- CreateIndex
CREATE INDEX "idx_cal_san_animal" ON "public"."calendario_sanitario"("id_animal" ASC);

-- CreateIndex
CREATE INDEX "idx_cal_san_estado" ON "public"."calendario_sanitario"("estado" ASC);

-- CreateIndex
CREATE INDEX "idx_cal_san_fecha_prog" ON "public"."calendario_sanitario"("fecha_programada" ASC);

-- CreateIndex
CREATE INDEX "idx_evt_repro_animal" ON "public"."eventos_reproductivos"("id_animal" ASC);

-- CreateIndex
CREATE INDEX "idx_evt_repro_fecha" ON "public"."eventos_reproductivos"("fecha_evento" ASC);

-- CreateIndex
CREATE INDEX "idx_evt_repro_lote" ON "public"."eventos_reproductivos"("id_lote" ASC);

-- CreateIndex
CREATE INDEX "idx_eventos_san_animal" ON "public"."eventos_sanitarios"("id_animal" ASC);

-- CreateIndex
CREATE INDEX "idx_eventos_san_estado" ON "public"."eventos_sanitarios"("estado_aprobacion" ASC);

-- CreateIndex
CREATE INDEX "idx_eventos_san_fecha" ON "public"."eventos_sanitarios"("fecha_evento" ASC);

-- CreateIndex
CREATE INDEX "idx_eventos_san_tipo" ON "public"."eventos_sanitarios"("id_tipo_evento" ASC);

-- CreateIndex
CREATE INDEX "idx_mov_inv_fecha" ON "public"."movimientos_inventario"("fecha_movimiento" ASC);

-- CreateIndex
CREATE INDEX "idx_mov_inv_insumo" ON "public"."movimientos_inventario"("id_insumo" ASC);

-- CreateIndex
CREATE INDEX "idx_mov_inv_tipo" ON "public"."movimientos_inventario"("tipo_movimiento" ASC);

-- CreateIndex
CREATE INDEX "idx_movimientos_registrado_por" ON "public"."movimientos_inventario"("registrado_por" ASC);

-- CreateIndex
CREATE INDEX "idx_prod_leche_animal" ON "public"."produccion_leche"("id_animal" ASC);

-- CreateIndex
CREATE INDEX "idx_prod_leche_fecha" ON "public"."produccion_leche"("fecha_registro" ASC);

-- CreateIndex
CREATE INDEX "idx_prod_leche_lote" ON "public"."produccion_leche"("id_lote" ASC);

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_expira" ON "public"."refresh_tokens"("fecha_expiracion" ASC);

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_token" ON "public"."refresh_tokens"("token" ASC);

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_usuario" ON "public"."refresh_tokens"("id_usuario" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "public"."refresh_tokens"("token" ASC);

-- CreateIndex
CREATE INDEX "idx_reg_peso_animal" ON "public"."registro_peso"("id_animal" ASC);

-- CreateIndex
CREATE INDEX "idx_reg_peso_fecha" ON "public"."registro_peso"("fecha_registro" ASC);

-- CreateIndex
CREATE INDEX "idx_reg_peso_lote" ON "public"."registro_peso"("id_lote" ASC);

-- CreateIndex
CREATE INDEX "idx_usuarios_rol" ON "public"."usuarios"("id_rol" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "idx_usuarios_username" ON "public"."usuarios"("username" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "public"."usuarios"("username" ASC);

-- AddForeignKey
ALTER TABLE "public"."animales" ADD CONSTRAINT "animales_id_raza_fkey" FOREIGN KEY ("id_raza") REFERENCES "public"."razas"("id_raza") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."bitacora" ADD CONSTRAINT "bitacora_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."calendario_sanitario" ADD CONSTRAINT "calendario_sanitario_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "public"."animales"("id_animal") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."calendario_sanitario" ADD CONSTRAINT "calendario_sanitario_id_tipo_evento_fkey" FOREIGN KEY ("id_tipo_evento") REFERENCES "public"."tipos_evento_sanitario"("id_tipo_evento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."calendario_sanitario" ADD CONSTRAINT "calendario_sanitario_programado_por_fkey" FOREIGN KEY ("programado_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."compras_realizadas" ADD CONSTRAINT "compras_realizadas_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "public"."solicitudes_compra"("id_solicitud") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."compras_realizadas" ADD CONSTRAINT "compras_realizadas_realizada_por_fkey" FOREIGN KEY ("realizada_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."detalle_compra" ADD CONSTRAINT "detalle_compra_id_compra_fkey" FOREIGN KEY ("id_compra") REFERENCES "public"."compras_realizadas"("id_compra") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."detalle_compra" ADD CONSTRAINT "detalle_compra_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "public"."insumos"("id_insumo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."detalle_solicitud_compra" ADD CONSTRAINT "detalle_solicitud_compra_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "public"."insumos"("id_insumo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."detalle_solicitud_compra" ADD CONSTRAINT "detalle_solicitud_compra_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "public"."solicitudes_compra"("id_solicitud") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."eventos_reproductivos" ADD CONSTRAINT "eventos_reproductivos_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "public"."animales"("id_animal") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."eventos_reproductivos" ADD CONSTRAINT "eventos_reproductivos_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "public"."lote_validacion_productiva"("id_lote") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."eventos_reproductivos" ADD CONSTRAINT "eventos_reproductivos_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."eventos_reproductivos" ADD CONSTRAINT "eventos_reproductivos_validado_por_fkey" FOREIGN KEY ("validado_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."eventos_sanitarios" ADD CONSTRAINT "eventos_sanitarios_autorizado_por_fkey" FOREIGN KEY ("autorizado_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."eventos_sanitarios" ADD CONSTRAINT "eventos_sanitarios_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "public"."animales"("id_animal") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."eventos_sanitarios" ADD CONSTRAINT "eventos_sanitarios_id_tipo_evento_fkey" FOREIGN KEY ("id_tipo_evento") REFERENCES "public"."tipos_evento_sanitario"("id_tipo_evento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."insumos" ADD CONSTRAINT "insumos_id_tipo_insumo_fkey" FOREIGN KEY ("id_tipo_insumo") REFERENCES "public"."tipos_insumo"("id_tipo_insumo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."lote_validacion_productiva" ADD CONSTRAINT "lote_validacion_productiva_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movimientos_inventario" ADD CONSTRAINT "fk_movimientos_registrado_por" FOREIGN KEY ("registrado_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "public"."insumos"("id_insumo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."produccion_leche" ADD CONSTRAINT "produccion_leche_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "public"."animales"("id_animal") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."produccion_leche" ADD CONSTRAINT "produccion_leche_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "public"."lote_validacion_productiva"("id_lote") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."produccion_leche" ADD CONSTRAINT "produccion_leche_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."produccion_leche" ADD CONSTRAINT "produccion_leche_validado_por_fkey" FOREIGN KEY ("validado_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."registro_peso" ADD CONSTRAINT "registro_peso_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "public"."animales"("id_animal") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."registro_peso" ADD CONSTRAINT "registro_peso_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "public"."lote_validacion_productiva"("id_lote") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."registro_peso" ADD CONSTRAINT "registro_peso_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."registro_peso" ADD CONSTRAINT "registro_peso_validado_por_fkey" FOREIGN KEY ("validado_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."solicitudes_compra" ADD CONSTRAINT "solicitudes_compra_aprobada_por_fkey" FOREIGN KEY ("aprobada_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."solicitudes_compra" ADD CONSTRAINT "solicitudes_compra_solicitada_por_fkey" FOREIGN KEY ("solicitada_por") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "public"."roles"("id_rol") ON DELETE NO ACTION ON UPDATE NO ACTION;
