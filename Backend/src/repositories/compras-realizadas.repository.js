const prisma = require('./prisma');

async function findAll() {
  return prisma.compraRealizada.findMany({
    include: {
      solicitud: true,
      realizador: { select: { idUsuario: true, nombreCompleto: true } },
      detalles: { include: { insumo: true } },
    },
    orderBy: { fechaCompra: 'desc' },
  });
}

async function findById(id) {
  return prisma.compraRealizada.findUnique({
    where: { idCompra: id },
    include: {
      solicitud: { include: { detalles: { include: { insumo: true } } } },
      realizador: { select: { idUsuario: true, nombreCompleto: true } },
      detalles: { include: { insumo: true } },
      movimientos: true,
    },
  });
}

/**
 * Crea la compra + detalles + movimientos de entrada de inventario + actualiza stock
 * Todo en una sola transacción atómica (RN-16).
 */
async function createWithTransaction(compraData, detallesData, idUsuario) {
  return prisma.$transaction(async (tx) => {
    // 1. Crear la compra
    const compra = await tx.compraRealizada.create({ data: compraData });

    // 2. Crear detalles y movimientos por cada ítem
    for (const detalle of detallesData) {
      const subtotal = detalle.cantidadReal * detalle.precioUnitario;

      // Crear detalle de compra
      await tx.detalleCompra.create({
        data: {
          idCompra: compra.idCompra,
          idInsumo: detalle.idInsumo,
          cantidadReal: detalle.cantidadReal,
          precioUnitario: detalle.precioUnitario,
          subtotal,
        },
      });

      // Crear movimiento de ENTRADA en inventario
      await tx.movimientoInventario.create({
        data: {
          idInsumo: detalle.idInsumo,
          tipoMovimiento: 'ENTRADA',
          cantidad: detalle.cantidadReal,
          fechaMovimiento: compraData.fechaCompra,
          referenciaCompra: compra.idCompra,
          registradoPor: idUsuario,
        },
      });

      // Actualizar stock del insumo
      await tx.insumo.update({
        where: { idInsumo: detalle.idInsumo },
        data: { stockActual: { increment: detalle.cantidadReal } },
      });
    }

    // 3. Calcular total real
    const totalReal = detallesData.reduce((sum, d) => sum + d.cantidadReal * d.precioUnitario, 0);
    await tx.compraRealizada.update({
      where: { idCompra: compra.idCompra },
      data: { totalReal },
    });

    return tx.compraRealizada.findUnique({
      where: { idCompra: compra.idCompra },
      include: { detalles: { include: { insumo: true } }, movimientos: true },
    });
  });
}

module.exports = { findAll, findById, createWithTransaction };
