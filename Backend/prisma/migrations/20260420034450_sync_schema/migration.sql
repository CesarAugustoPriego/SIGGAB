/*
  Warnings:

  - You are about to alter the column `peso_inicial` on the `animales` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to drop the column `proveedor` on the `compras_realizadas` table. All the data in the column will be lost.
  - You are about to alter the column `total_real` on the `compras_realizadas` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `cantidad_real` on the `detalle_compra` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `precio_unitario` on the `detalle_compra` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `subtotal` on the `detalle_compra` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `cantidad` on the `detalle_solicitud_compra` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `precio_estimado` on the `detalle_solicitud_compra` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `subtotal_estimado` on the `detalle_solicitud_compra` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `stock_actual` on the `insumos` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `cantidad` on the `movimientos_inventario` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `litros_producidos` on the `produccion_leche` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `peso` on the `registro_peso` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - Made the column `fecha_ingreso` on table `animales` required. This step will fail if there are existing NULL values in that column.
  - Made the column `peso_inicial` on table `animales` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_raza` on table `animales` required. This step will fail if there are existing NULL values in that column.
  - Made the column `estado_actual` on table `animales` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_usuario` on table `bitacora` required. This step will fail if there are existing NULL values in that column.
  - Made the column `accion` on table `bitacora` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tabla_afectada` on table `bitacora` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_registro` on table `bitacora` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_accion` on table `bitacora` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_animal` on table `calendario_sanitario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_tipo_evento` on table `calendario_sanitario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_programada` on table `calendario_sanitario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `programado_por` on table `calendario_sanitario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `estado` on table `calendario_sanitario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_solicitud` on table `compras_realizadas` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_compra` on table `compras_realizadas` required. This step will fail if there are existing NULL values in that column.
  - Made the column `realizada_por` on table `compras_realizadas` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total_real` on table `compras_realizadas` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_compra` on table `detalle_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_insumo` on table `detalle_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cantidad_real` on table `detalle_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `precio_unitario` on table `detalle_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subtotal` on table `detalle_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_solicitud` on table `detalle_solicitud_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_insumo` on table `detalle_solicitud_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cantidad` on table `detalle_solicitud_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `precio_estimado` on table `detalle_solicitud_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subtotal_estimado` on table `detalle_solicitud_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_animal` on table `eventos_reproductivos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_lote` on table `eventos_reproductivos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tipo_evento` on table `eventos_reproductivos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_evento` on table `eventos_reproductivos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `registrado_por` on table `eventos_reproductivos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `estado_validacion` on table `eventos_reproductivos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_animal` on table `eventos_sanitarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_tipo_evento` on table `eventos_sanitarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_evento` on table `eventos_sanitarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `estado_aprobacion` on table `eventos_sanitarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nombre_insumo` on table `insumos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_tipo_insumo` on table `insumos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unidad_medida` on table `insumos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stock_actual` on table `insumos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `activo` on table `insumos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_inicio` on table `lote_validacion_productiva` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_fin` on table `lote_validacion_productiva` required. This step will fail if there are existing NULL values in that column.
  - Made the column `creado_por` on table `lote_validacion_productiva` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_creacion` on table `lote_validacion_productiva` required. This step will fail if there are existing NULL values in that column.
  - Made the column `estado` on table `lote_validacion_productiva` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_insumo` on table `movimientos_inventario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tipo_movimiento` on table `movimientos_inventario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cantidad` on table `movimientos_inventario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_movimiento` on table `movimientos_inventario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_animal` on table `produccion_leche` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_lote` on table `produccion_leche` required. This step will fail if there are existing NULL values in that column.
  - Made the column `litros_producidos` on table `produccion_leche` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_registro` on table `produccion_leche` required. This step will fail if there are existing NULL values in that column.
  - Made the column `registrado_por` on table `produccion_leche` required. This step will fail if there are existing NULL values in that column.
  - Made the column `estado_validacion` on table `produccion_leche` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nombre_raza` on table `razas` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_animal` on table `registro_peso` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_lote` on table `registro_peso` required. This step will fail if there are existing NULL values in that column.
  - Made the column `peso` on table `registro_peso` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_registro` on table `registro_peso` required. This step will fail if there are existing NULL values in that column.
  - Made the column `registrado_por` on table `registro_peso` required. This step will fail if there are existing NULL values in that column.
  - Made the column `estado_validacion` on table `registro_peso` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_solicitud` on table `solicitudes_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `solicitada_por` on table `solicitudes_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `estado_solicitud` on table `solicitudes_compra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nombre_tipo` on table `tipos_evento_sanitario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nombre_tipo` on table `tipos_insumo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_rol` on table `usuarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `estado` on table `usuarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_creacion` on table `usuarios` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "animales" DROP CONSTRAINT "animales_id_raza_fkey";

-- DropForeignKey
ALTER TABLE "bitacora" DROP CONSTRAINT "bitacora_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "calendario_sanitario" DROP CONSTRAINT "calendario_sanitario_id_animal_fkey";

-- DropForeignKey
ALTER TABLE "calendario_sanitario" DROP CONSTRAINT "calendario_sanitario_id_tipo_evento_fkey";

-- DropForeignKey
ALTER TABLE "calendario_sanitario" DROP CONSTRAINT "calendario_sanitario_programado_por_fkey";

-- DropForeignKey
ALTER TABLE "compras_realizadas" DROP CONSTRAINT "compras_realizadas_id_solicitud_fkey";

-- DropForeignKey
ALTER TABLE "compras_realizadas" DROP CONSTRAINT "compras_realizadas_realizada_por_fkey";

-- DropForeignKey
ALTER TABLE "detalle_compra" DROP CONSTRAINT "detalle_compra_id_compra_fkey";

-- DropForeignKey
ALTER TABLE "detalle_compra" DROP CONSTRAINT "detalle_compra_id_insumo_fkey";

-- DropForeignKey
ALTER TABLE "detalle_solicitud_compra" DROP CONSTRAINT "detalle_solicitud_compra_id_insumo_fkey";

-- DropForeignKey
ALTER TABLE "detalle_solicitud_compra" DROP CONSTRAINT "detalle_solicitud_compra_id_solicitud_fkey";

-- DropForeignKey
ALTER TABLE "eventos_reproductivos" DROP CONSTRAINT "eventos_reproductivos_id_animal_fkey";

-- DropForeignKey
ALTER TABLE "eventos_reproductivos" DROP CONSTRAINT "eventos_reproductivos_id_lote_fkey";

-- DropForeignKey
ALTER TABLE "eventos_reproductivos" DROP CONSTRAINT "eventos_reproductivos_registrado_por_fkey";

-- DropForeignKey
ALTER TABLE "eventos_reproductivos" DROP CONSTRAINT "eventos_reproductivos_validado_por_fkey";

-- DropForeignKey
ALTER TABLE "eventos_sanitarios" DROP CONSTRAINT "eventos_sanitarios_autorizado_por_fkey";

-- DropForeignKey
ALTER TABLE "eventos_sanitarios" DROP CONSTRAINT "eventos_sanitarios_id_animal_fkey";

-- DropForeignKey
ALTER TABLE "eventos_sanitarios" DROP CONSTRAINT "eventos_sanitarios_id_tipo_evento_fkey";

-- DropForeignKey
ALTER TABLE "insumos" DROP CONSTRAINT "insumos_id_tipo_insumo_fkey";

-- DropForeignKey
ALTER TABLE "lote_validacion_productiva" DROP CONSTRAINT "lote_validacion_productiva_creado_por_fkey";

-- DropForeignKey
ALTER TABLE "movimientos_inventario" DROP CONSTRAINT "fk_movimientos_registrado_por";

-- DropForeignKey
ALTER TABLE "movimientos_inventario" DROP CONSTRAINT "movimientos_inventario_id_insumo_fkey";

-- DropForeignKey
ALTER TABLE "produccion_leche" DROP CONSTRAINT "produccion_leche_id_animal_fkey";

-- DropForeignKey
ALTER TABLE "produccion_leche" DROP CONSTRAINT "produccion_leche_id_lote_fkey";

-- DropForeignKey
ALTER TABLE "produccion_leche" DROP CONSTRAINT "produccion_leche_registrado_por_fkey";

-- DropForeignKey
ALTER TABLE "produccion_leche" DROP CONSTRAINT "produccion_leche_validado_por_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "registro_peso" DROP CONSTRAINT "registro_peso_id_animal_fkey";

-- DropForeignKey
ALTER TABLE "registro_peso" DROP CONSTRAINT "registro_peso_id_lote_fkey";

-- DropForeignKey
ALTER TABLE "registro_peso" DROP CONSTRAINT "registro_peso_registrado_por_fkey";

-- DropForeignKey
ALTER TABLE "registro_peso" DROP CONSTRAINT "registro_peso_validado_por_fkey";

-- DropForeignKey
ALTER TABLE "solicitudes_compra" DROP CONSTRAINT "solicitudes_compra_aprobada_por_fkey";

-- DropForeignKey
ALTER TABLE "solicitudes_compra" DROP CONSTRAINT "solicitudes_compra_solicitada_por_fkey";

-- DropForeignKey
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_id_rol_fkey";

-- DropIndex
DROP INDEX "idx_bitacora_detalles";

-- AlterTable
ALTER TABLE "animales" ALTER COLUMN "fecha_ingreso" SET NOT NULL,
ALTER COLUMN "peso_inicial" SET NOT NULL,
ALTER COLUMN "peso_inicial" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "id_raza" SET NOT NULL,
ALTER COLUMN "estado_actual" SET NOT NULL,
ALTER COLUMN "estado_actual" SET DEFAULT 'ACTIVO';

-- AlterTable
ALTER TABLE "bitacora" ALTER COLUMN "id_usuario" SET NOT NULL,
ALTER COLUMN "accion" SET NOT NULL,
ALTER COLUMN "tabla_afectada" SET NOT NULL,
ALTER COLUMN "id_registro" SET NOT NULL,
ALTER COLUMN "fecha_accion" SET NOT NULL,
ALTER COLUMN "fecha_accion" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "calendario_sanitario" ALTER COLUMN "id_animal" SET NOT NULL,
ALTER COLUMN "id_tipo_evento" SET NOT NULL,
ALTER COLUMN "fecha_programada" SET NOT NULL,
ALTER COLUMN "programado_por" SET NOT NULL,
ALTER COLUMN "estado" SET NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "compras_realizadas" DROP COLUMN "proveedor",
ALTER COLUMN "id_solicitud" SET NOT NULL,
ALTER COLUMN "fecha_compra" SET NOT NULL,
ALTER COLUMN "realizada_por" SET NOT NULL,
ALTER COLUMN "total_real" SET NOT NULL,
ALTER COLUMN "total_real" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "detalle_compra" ALTER COLUMN "id_compra" SET NOT NULL,
ALTER COLUMN "id_insumo" SET NOT NULL,
ALTER COLUMN "cantidad_real" SET NOT NULL,
ALTER COLUMN "cantidad_real" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "precio_unitario" SET NOT NULL,
ALTER COLUMN "precio_unitario" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "subtotal" SET NOT NULL,
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "detalle_solicitud_compra" ALTER COLUMN "id_solicitud" SET NOT NULL,
ALTER COLUMN "id_insumo" SET NOT NULL,
ALTER COLUMN "cantidad" SET NOT NULL,
ALTER COLUMN "cantidad" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "precio_estimado" SET NOT NULL,
ALTER COLUMN "precio_estimado" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "subtotal_estimado" SET NOT NULL,
ALTER COLUMN "subtotal_estimado" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "eventos_reproductivos" ALTER COLUMN "id_animal" SET NOT NULL,
ALTER COLUMN "id_lote" SET NOT NULL,
ALTER COLUMN "tipo_evento" SET NOT NULL,
ALTER COLUMN "fecha_evento" SET NOT NULL,
ALTER COLUMN "registrado_por" SET NOT NULL,
ALTER COLUMN "estado_validacion" SET NOT NULL,
ALTER COLUMN "estado_validacion" SET DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "eventos_sanitarios" ALTER COLUMN "id_animal" SET NOT NULL,
ALTER COLUMN "id_tipo_evento" SET NOT NULL,
ALTER COLUMN "fecha_evento" SET NOT NULL,
ALTER COLUMN "estado_aprobacion" SET NOT NULL,
ALTER COLUMN "estado_aprobacion" SET DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "insumos" ALTER COLUMN "nombre_insumo" SET NOT NULL,
ALTER COLUMN "id_tipo_insumo" SET NOT NULL,
ALTER COLUMN "unidad_medida" SET NOT NULL,
ALTER COLUMN "stock_actual" SET NOT NULL,
ALTER COLUMN "stock_actual" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "activo" SET NOT NULL;

-- AlterTable
ALTER TABLE "lote_validacion_productiva" ALTER COLUMN "fecha_inicio" SET NOT NULL,
ALTER COLUMN "fecha_fin" SET NOT NULL,
ALTER COLUMN "creado_por" SET NOT NULL,
ALTER COLUMN "fecha_creacion" SET NOT NULL,
ALTER COLUMN "fecha_creacion" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "estado" SET NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "movimientos_inventario" ALTER COLUMN "id_insumo" SET NOT NULL,
ALTER COLUMN "tipo_movimiento" SET NOT NULL,
ALTER COLUMN "cantidad" SET NOT NULL,
ALTER COLUMN "cantidad" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "fecha_movimiento" SET NOT NULL;

-- AlterTable
ALTER TABLE "produccion_leche" ALTER COLUMN "id_animal" SET NOT NULL,
ALTER COLUMN "id_lote" SET NOT NULL,
ALTER COLUMN "litros_producidos" SET NOT NULL,
ALTER COLUMN "litros_producidos" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "fecha_registro" SET NOT NULL,
ALTER COLUMN "registrado_por" SET NOT NULL,
ALTER COLUMN "estado_validacion" SET NOT NULL,
ALTER COLUMN "estado_validacion" SET DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "razas" ALTER COLUMN "nombre_raza" SET NOT NULL;

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "fecha_expiracion" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "fecha_creacion" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "registro_peso" ALTER COLUMN "id_animal" SET NOT NULL,
ALTER COLUMN "id_lote" SET NOT NULL,
ALTER COLUMN "peso" SET NOT NULL,
ALTER COLUMN "peso" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "fecha_registro" SET NOT NULL,
ALTER COLUMN "registrado_por" SET NOT NULL,
ALTER COLUMN "estado_validacion" SET NOT NULL,
ALTER COLUMN "estado_validacion" SET DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "solicitudes_compra" ALTER COLUMN "fecha_solicitud" SET NOT NULL,
ALTER COLUMN "solicitada_por" SET NOT NULL,
ALTER COLUMN "estado_solicitud" SET NOT NULL,
ALTER COLUMN "estado_solicitud" SET DEFAULT 'PENDIENTE',
ALTER COLUMN "fecha_aprobacion" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tipos_evento_sanitario" ALTER COLUMN "nombre_tipo" SET NOT NULL;

-- AlterTable
ALTER TABLE "tipos_insumo" ALTER COLUMN "nombre_tipo" SET NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "expo_push_token" VARCHAR(255),
ALTER COLUMN "id_rol" SET NOT NULL,
ALTER COLUMN "estado" SET NOT NULL,
ALTER COLUMN "fecha_creacion" SET NOT NULL,
ALTER COLUMN "fecha_creacion" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "bloqueado_hasta" SET DATA TYPE TIMESTAMP(3);

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
ALTER TABLE "eventos_reproductivos" ADD CONSTRAINT "eventos_reproductivos_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lote_validacion_productiva"("id_lote") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- RenameIndex
ALTER INDEX "idx_animales_estado" RENAME TO "animales_estado_actual_idx";

-- RenameIndex
ALTER INDEX "idx_animales_raza" RENAME TO "animales_id_raza_idx";

-- RenameIndex
ALTER INDEX "idx_bitacora_tabla" RENAME TO "bitacora_tabla_afectada_idx";

-- RenameIndex
ALTER INDEX "idx_bitacora_usuario" RENAME TO "bitacora_id_usuario_idx";

-- RenameIndex
ALTER INDEX "idx_cal_san_animal" RENAME TO "calendario_sanitario_id_animal_idx";

-- RenameIndex
ALTER INDEX "idx_cal_san_estado" RENAME TO "calendario_sanitario_estado_idx";

-- RenameIndex
ALTER INDEX "idx_cal_san_fecha_prog" RENAME TO "calendario_sanitario_fecha_programada_idx";

-- RenameIndex
ALTER INDEX "idx_evt_repro_animal" RENAME TO "eventos_reproductivos_id_animal_idx";

-- RenameIndex
ALTER INDEX "idx_evt_repro_fecha" RENAME TO "eventos_reproductivos_fecha_evento_idx";

-- RenameIndex
ALTER INDEX "idx_evt_repro_lote" RENAME TO "eventos_reproductivos_id_lote_idx";

-- RenameIndex
ALTER INDEX "idx_eventos_san_animal" RENAME TO "eventos_sanitarios_id_animal_idx";

-- RenameIndex
ALTER INDEX "idx_eventos_san_estado" RENAME TO "eventos_sanitarios_estado_aprobacion_idx";

-- RenameIndex
ALTER INDEX "idx_eventos_san_fecha" RENAME TO "eventos_sanitarios_fecha_evento_idx";

-- RenameIndex
ALTER INDEX "idx_eventos_san_tipo" RENAME TO "eventos_sanitarios_id_tipo_evento_idx";

-- RenameIndex
ALTER INDEX "idx_mov_inv_fecha" RENAME TO "movimientos_inventario_fecha_movimiento_idx";

-- RenameIndex
ALTER INDEX "idx_mov_inv_insumo" RENAME TO "movimientos_inventario_id_insumo_idx";

-- RenameIndex
ALTER INDEX "idx_mov_inv_tipo" RENAME TO "movimientos_inventario_tipo_movimiento_idx";

-- RenameIndex
ALTER INDEX "idx_movimientos_registrado_por" RENAME TO "movimientos_inventario_registrado_por_idx";

-- RenameIndex
ALTER INDEX "idx_prod_leche_animal" RENAME TO "produccion_leche_id_animal_idx";

-- RenameIndex
ALTER INDEX "idx_prod_leche_fecha" RENAME TO "produccion_leche_fecha_registro_idx";

-- RenameIndex
ALTER INDEX "idx_prod_leche_lote" RENAME TO "produccion_leche_id_lote_idx";

-- RenameIndex
ALTER INDEX "idx_refresh_tokens_expira" RENAME TO "refresh_tokens_fecha_expiracion_idx";

-- RenameIndex
ALTER INDEX "idx_refresh_tokens_token" RENAME TO "refresh_tokens_token_idx";

-- RenameIndex
ALTER INDEX "idx_refresh_tokens_usuario" RENAME TO "refresh_tokens_id_usuario_idx";

-- RenameIndex
ALTER INDEX "idx_reg_peso_animal" RENAME TO "registro_peso_id_animal_idx";

-- RenameIndex
ALTER INDEX "idx_reg_peso_fecha" RENAME TO "registro_peso_fecha_registro_idx";

-- RenameIndex
ALTER INDEX "idx_reg_peso_lote" RENAME TO "registro_peso_id_lote_idx";

-- RenameIndex
ALTER INDEX "idx_usuarios_rol" RENAME TO "usuarios_id_rol_idx";
