const prisma = require('../repositories/prisma');

/**
 * Servicio de bitácora para registrar acciones en la tabla bitacora.
 * Se usa desde los services (no como middleware de request),
 * para poder capturar el contexto exacto de cada operación.
 */
async function registrarAccion({ idUsuario, accion, tablaAfectada, idRegistro, detalles = null }) {
  try {
    await prisma.bitacora.create({
      data: {
        idUsuario,
        accion,
        tablaAfectada,
        idRegistro,
        detalles,
      },
    });
  } catch (error) {
    // No bloquear la operación principal si la bitácora falla
    console.error('⚠️ Error al registrar en bitácora:', error.message);
  }
}

module.exports = { registrarAccion };
