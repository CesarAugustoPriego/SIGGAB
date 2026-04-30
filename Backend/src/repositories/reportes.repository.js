const prisma = require('./prisma');

function buildDateFilter(fechaInicio, fechaFin) {
  return {
    gte: new Date(fechaInicio),
    lte: new Date(fechaFin),
  };
}

function buildEndDateFilter(fechaFin) {
  return {
    lte: new Date(fechaFin),
  };
}

async function getSanitario(filters) {
  const where = {
    fechaEvento: buildDateFilter(filters.fechaInicio, filters.fechaFin),
  };

  if (filters.estadoAprobacion) where.estadoAprobacion = filters.estadoAprobacion;
  if (filters.idTipoEvento) where.idTipoEvento = Number(filters.idTipoEvento);

  return prisma.eventoSanitario.findMany({
    where,
    include: {
      animal: { select: { idAnimal: true, numeroArete: true } },
      tipoEvento: { select: { idTipoEvento: true, nombreTipo: true } },
      autorizador: { select: { idUsuario: true, nombreCompleto: true } },
    },
    orderBy: { fechaEvento: 'desc' },
  });
}

async function getProductivo(filters) {
  const rango = buildDateFilter(filters.fechaInicio, filters.fechaFin);

  const whereBase = {};
  if (filters.idAnimal) whereBase.idAnimal = Number(filters.idAnimal);

  const [registrosPeso, produccionLeche, eventosReproductivos] = await Promise.all([
    prisma.registroPeso.findMany({
      where: { ...whereBase, fechaRegistro: rango },
      include: { animal: { select: { idAnimal: true, numeroArete: true } } },
      orderBy: { fechaRegistro: 'desc' },
    }),
    prisma.produccionLeche.findMany({
      where: { ...whereBase, fechaRegistro: rango },
      include: { animal: { select: { idAnimal: true, numeroArete: true } } },
      orderBy: { fechaRegistro: 'desc' },
    }),
    prisma.eventoReproductivo.findMany({
      where: { ...whereBase, fechaEvento: rango },
      include: { animal: { select: { idAnimal: true, numeroArete: true } } },
      orderBy: { fechaEvento: 'desc' },
    }),
  ]);

  return { registrosPeso, produccionLeche, eventosReproductivos };
}

async function getAdministrativo(filters) {
  const rangoSolicitudes = buildDateFilter(filters.fechaInicio, filters.fechaFin);
  const rangoCompras = buildDateFilter(filters.fechaInicio, filters.fechaFin);
  const rangoMovimientos = buildDateFilter(filters.fechaInicio, filters.fechaFin);

  const [solicitudes, compras, movimientos, inventarioActual] = await Promise.all([
    prisma.solicitudCompra.findMany({
      where: { fechaSolicitud: rangoSolicitudes },
      include: {
        solicitante: { select: { idUsuario: true, nombreCompleto: true } },
        aprobador: { select: { idUsuario: true, nombreCompleto: true } },
        detalles: true,
      },
      orderBy: { fechaSolicitud: 'desc' },
    }),
    prisma.compraRealizada.findMany({
      where: { fechaCompra: rangoCompras },
      include: {
        realizador: { select: { idUsuario: true, nombreCompleto: true } },
        detalles: true,
      },
      orderBy: { fechaCompra: 'desc' },
    }),
    prisma.movimientoInventario.findMany({
      where: { fechaMovimiento: rangoMovimientos },
      include: {
        insumo: { include: { tipoInsumo: true } },
        registrador: { select: { idUsuario: true, nombreCompleto: true } },
      },
      orderBy: { fechaMovimiento: 'desc' },
    }),
    prisma.insumo.findMany({
      where: { activo: true },
      include: { tipoInsumo: true },
      orderBy: { nombreInsumo: 'asc' },
    }),
  ]);

  return { solicitudes, compras, movimientos, inventarioActual };
}

async function getSanitarioSummary(fechaInicio, fechaFin) {
  const rango = buildDateFilter(fechaInicio, fechaFin);

  const [total, aprobados, rechazados, pendientes] = await Promise.all([
    prisma.eventoSanitario.count({ where: { fechaEvento: rango } }),
    prisma.eventoSanitario.count({ where: { fechaEvento: rango, estadoAprobacion: 'APROBADO' } }),
    prisma.eventoSanitario.count({ where: { fechaEvento: rango, estadoAprobacion: 'RECHAZADO' } }),
    prisma.eventoSanitario.count({ where: { fechaEvento: rango, estadoAprobacion: 'PENDIENTE' } }),
  ]);

  return {
    totalEventos: total,
    aprobados,
    rechazados,
    pendientes,
  };
}

async function getProductivoSummary(fechaInicio, fechaFin) {
  const rango = buildDateFilter(fechaInicio, fechaFin);

  const [pesoAgg, lecheAgg, eventosAgg] = await Promise.all([
    prisma.registroPeso.aggregate({
      where: { fechaRegistro: rango },
      _count: { idRegistroPeso: true },
      _avg: { peso: true },
    }),
    prisma.produccionLeche.aggregate({
      where: { fechaRegistro: rango },
      _count: { idProduccion: true },
      _sum: { litrosProducidos: true },
    }),
    prisma.eventoReproductivo.groupBy({
      by: ['tipoEvento'],
      where: { fechaEvento: rango },
      _count: { idEventoReproductivo: true },
    }),
  ]);

  const totalEventosReproductivos = eventosAgg.reduce((sum, item) => sum + item._count.idEventoReproductivo, 0);
  const totalPartos = eventosAgg
    .filter((item) => item.tipoEvento === 'PARTO')
    .reduce((sum, item) => sum + item._count.idEventoReproductivo, 0);

  return {
    totalRegistrosPeso: pesoAgg._count.idRegistroPeso,
    promedioPesoKg: Number(pesoAgg._avg.peso || 0),
    totalRegistrosLeche: lecheAgg._count.idProduccion,
    totalLitrosLeche: Number(lecheAgg._sum.litrosProducidos || 0),
    totalEventosReproductivos,
    totalPartos,
  };
}

async function getInventarioVisual() {
  return prisma.insumo.findMany({
    where: { activo: true },
    include: { tipoInsumo: true },
    orderBy: { nombreInsumo: 'asc' },
  });
}

async function getSanitarioHato(filters) {
  const eventoRange = filters.fechaInicio
    ? buildDateFilter(filters.fechaInicio, filters.fechaFin)
    : buildEndDateFilter(filters.fechaFin);

  return prisma.animal.findMany({
    where: { estadoActual: 'ACTIVO' },
    include: {
      raza: true,
      eventosSanitarios: {
        where: {
          fechaEvento: eventoRange,
          estadoAprobacion: 'APROBADO',
        },
        include: { tipoEvento: true },
        orderBy: { fechaEvento: 'desc' },
        take: 1,
      },
      registrosPeso: {
        where: {
          fechaRegistro: buildEndDateFilter(filters.fechaFin),
          estadoValidacion: 'APROBADO',
        },
        orderBy: { fechaRegistro: 'desc' },
        take: 1,
      },
    },
    orderBy: { numeroArete: 'asc' },
  });
}

async function getProductividad(filters) {
  const where = { estadoActual: 'ACTIVO' };
  if (filters.edadMinimaMeses !== undefined) {
    where.edadEstimada = { gte: Number(filters.edadMinimaMeses) };
  }

  return prisma.animal.findMany({
    where,
    include: {
      raza: true,
      registrosPeso: {
        where: {
          fechaRegistro: buildEndDateFilter(filters.fechaFin),
          estadoValidacion: 'APROBADO',
        },
        orderBy: { fechaRegistro: 'asc' },
      },
    },
    orderBy: { numeroArete: 'asc' },
  });
}

async function getBajas(filters) {
  const where = {
    estadoActual: { not: 'ACTIVO' },
    fechaBaja: buildDateFilter(filters.fechaInicio, filters.fechaFin),
  };

  return prisma.animal.findMany({
    where,
    include: {
      raza: true,
      registrosPeso: {
        where: {
          fechaRegistro: buildEndDateFilter(filters.fechaFin),
          estadoValidacion: 'APROBADO',
        },
        orderBy: { fechaRegistro: 'desc' },
      },
    },
    orderBy: { fechaBaja: 'desc' },
  });
}

module.exports = {
  getSanitario,
  getProductivo,
  getAdministrativo,
  getSanitarioSummary,
  getProductivoSummary,
  getInventarioVisual,
  getSanitarioHato,
  getProductividad,
  getBajas,
};
