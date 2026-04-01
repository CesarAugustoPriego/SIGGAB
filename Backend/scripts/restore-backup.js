#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const prisma = require('../src/repositories/prisma');

function parseArgs(argv) {
  const parsed = {
    file: null,
    dryRun: false,
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--file') {
      parsed.file = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (arg === '--dry-run' || arg === '--preview') {
      parsed.dryRun = true;
      continue;
    }
    if (arg === 'preview') {
      parsed.dryRun = true;
      continue;
    }
    if (arg === '--force') {
      parsed.force = true;
      continue;
    }
    if (arg === 'force') {
      parsed.force = true;
      continue;
    }
    if (!arg.startsWith('--') && !parsed.file) {
      parsed.file = arg;
    }
  }

  if (!parsed.force && !parsed.dryRun) {
    parsed.dryRun = true;
  }

  return parsed;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function computeCounts(data) {
  return {
    roles: ensureArray(data.roles).length,
    usuarios: ensureArray(data.usuarios).length,
    bitacora: ensureArray(data.bitacora).length,
    razas: ensureArray(data.razas).length,
    animales: ensureArray(data.animales).length,
    tiposEventoSanitario: ensureArray(data.tiposEventoSanitario).length,
    eventosSanitarios: ensureArray(data.eventosSanitarios).length,
    calendarioSanitario: ensureArray(data.calendarioSanitario).length,
    lotesProductivos: ensureArray(data.lotesProductivos).length,
    registrosPeso: ensureArray(data.registrosPeso).length,
    produccionLeche: ensureArray(data.produccionLeche).length,
    eventosReproductivos: ensureArray(data.eventosReproductivos).length,
    tiposInsumo: ensureArray(data.tiposInsumo).length,
    insumos: ensureArray(data.insumos).length,
    solicitudesCompra: ensureArray(data.solicitudesCompra).length,
    detalleSolicitudCompra: ensureArray(data.detalleSolicitudCompra).length,
    comprasRealizadas: ensureArray(data.comprasRealizadas).length,
    detalleCompra: ensureArray(data.detalleCompra).length,
    movimientosInventario: ensureArray(data.movimientosInventario).length,
  };
}

async function resetSerialSequences(tx) {
  const sequenceConfig = [
    ['roles', 'id_rol'],
    ['usuarios', 'id_usuario'],
    ['bitacora', 'id_bitacora'],
    ['razas', 'id_raza'],
    ['animales', 'id_animal'],
    ['tipos_evento_sanitario', 'id_tipo_evento'],
    ['eventos_sanitarios', 'id_evento'],
    ['calendario_sanitario', 'id_calendario'],
    ['lote_validacion_productiva', 'id_lote'],
    ['registro_peso', 'id_registro_peso'],
    ['produccion_leche', 'id_produccion'],
    ['eventos_reproductivos', 'id_evento_reproductivo'],
    ['tipos_insumo', 'id_tipo_insumo'],
    ['insumos', 'id_insumo'],
    ['movimientos_inventario', 'id_movimiento'],
    ['solicitudes_compra', 'id_solicitud'],
    ['detalle_solicitud_compra', 'id_detalle'],
    ['compras_realizadas', 'id_compra'],
    ['detalle_compra', 'id_detalle_compra'],
    ['refresh_tokens', 'id_refresh_token'],
  ];

  for (const [tableName, columnName] of sequenceConfig) {
    const query = `
      SELECT setval(
        pg_get_serial_sequence('"${tableName}"', '${columnName}'),
        COALESCE((SELECT MAX("${columnName}") FROM "${tableName}"), 1),
        COALESCE((SELECT MAX("${columnName}") FROM "${tableName}"), 0) > 0
      );
    `;
    await tx.$executeRawUnsafe(query);
  }
}

async function restoreBackup(data) {
  await prisma.$transaction(async (tx) => {
    // Limpieza en orden inverso para respetar FK.
    await tx.detalleCompra.deleteMany();
    await tx.movimientoInventario.deleteMany();
    await tx.compraRealizada.deleteMany();
    await tx.detalleSolicitudCompra.deleteMany();
    await tx.solicitudCompra.deleteMany();
    await tx.insumo.deleteMany();
    await tx.tipoInsumo.deleteMany();
    await tx.eventoReproductivo.deleteMany();
    await tx.produccionLeche.deleteMany();
    await tx.registroPeso.deleteMany();
    await tx.loteValidacionProductiva.deleteMany();
    await tx.calendarioSanitario.deleteMany();
    await tx.eventoSanitario.deleteMany();
    await tx.tipoEventoSanitario.deleteMany();
    await tx.animal.deleteMany();
    await tx.raza.deleteMany();
    await tx.bitacora.deleteMany();
    await tx.refreshToken.deleteMany();
    await tx.usuario.deleteMany();
    await tx.rol.deleteMany();

    // Insercion en orden directo.
    if (ensureArray(data.roles).length) {
      await tx.rol.createMany({ data: data.roles });
    }
    if (ensureArray(data.usuarios).length) {
      await tx.usuario.createMany({ data: data.usuarios });
    }
    if (ensureArray(data.razas).length) {
      await tx.raza.createMany({ data: data.razas });
    }
    if (ensureArray(data.animales).length) {
      await tx.animal.createMany({ data: data.animales });
    }
    if (ensureArray(data.tiposEventoSanitario).length) {
      await tx.tipoEventoSanitario.createMany({ data: data.tiposEventoSanitario });
    }
    if (ensureArray(data.eventosSanitarios).length) {
      await tx.eventoSanitario.createMany({ data: data.eventosSanitarios });
    }
    if (ensureArray(data.calendarioSanitario).length) {
      await tx.calendarioSanitario.createMany({ data: data.calendarioSanitario });
    }
    if (ensureArray(data.lotesProductivos).length) {
      await tx.loteValidacionProductiva.createMany({ data: data.lotesProductivos });
    }
    if (ensureArray(data.registrosPeso).length) {
      await tx.registroPeso.createMany({ data: data.registrosPeso });
    }
    if (ensureArray(data.produccionLeche).length) {
      await tx.produccionLeche.createMany({ data: data.produccionLeche });
    }
    if (ensureArray(data.eventosReproductivos).length) {
      await tx.eventoReproductivo.createMany({ data: data.eventosReproductivos });
    }
    if (ensureArray(data.tiposInsumo).length) {
      await tx.tipoInsumo.createMany({ data: data.tiposInsumo });
    }
    if (ensureArray(data.insumos).length) {
      await tx.insumo.createMany({ data: data.insumos });
    }
    if (ensureArray(data.solicitudesCompra).length) {
      await tx.solicitudCompra.createMany({ data: data.solicitudesCompra });
    }
    if (ensureArray(data.detalleSolicitudCompra).length) {
      await tx.detalleSolicitudCompra.createMany({ data: data.detalleSolicitudCompra });
    }
    if (ensureArray(data.comprasRealizadas).length) {
      await tx.compraRealizada.createMany({ data: data.comprasRealizadas });
    }
    if (ensureArray(data.detalleCompra).length) {
      await tx.detalleCompra.createMany({ data: data.detalleCompra });
    }
    if (ensureArray(data.movimientosInventario).length) {
      await tx.movimientoInventario.createMany({ data: data.movimientosInventario });
    }
    if (ensureArray(data.bitacora).length) {
      await tx.bitacora.createMany({ data: data.bitacora });
    }

    await resetSerialSequences(tx);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    throw new Error('Uso: npm run backup:restore -- --file <ruta-backup.json> [preview|force]');
  }

  const backupPath = path.isAbsolute(args.file)
    ? args.file
    : path.resolve(process.cwd(), args.file);

  const exists = await fs.access(backupPath).then(() => true).catch(() => false);
  if (!exists) {
    throw new Error(`No se encontro el archivo de respaldo: ${backupPath}`);
  }

  const payloadRaw = await fs.readFile(backupPath, 'utf-8');
  const payload = JSON.parse(payloadRaw);
  if (!payload || typeof payload !== 'object' || !payload.data || typeof payload.data !== 'object') {
    throw new Error('El archivo de respaldo no tiene la estructura esperada { metadata, data }');
  }

  const counts = computeCounts(payload.data);
  console.log('Resumen de respaldo a restaurar:');
  for (const [tableName, count] of Object.entries(counts)) {
    console.log(`  - ${tableName}: ${count}`);
  }

  if (args.dryRun) {
    console.log('\nDry-run completado. No se aplicaron cambios en la base de datos.');
    return;
  }

  if (!args.force) {
    console.log('\nPreview completado. No se aplicaron cambios en la base de datos.');
    console.log('Para restaurar de forma real usa el modo force.');
    return;
  }

  console.log('\nIniciando restauracion completa...');
  await restoreBackup(payload.data);
  console.log('Restauracion completada exitosamente.');
}

main()
  .catch((error) => {
    console.error('Error en restauracion de respaldo:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
