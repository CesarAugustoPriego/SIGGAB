const prisma = require('../repositories/prisma');

/**
 * KPIs generales del rancho.
 */
async function getResumen() {
  const hoy = new Date();
  const en7Dias = new Date(hoy); en7Dias.setDate(hoy.getDate() + 7);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const [
    totalAnimalesActivos,
    vacunacionesMes,
    pesosPendientes,
    alertasProximas,
    solicitudesPendientes,
    stockAgotado,
    totalInsumosActivos,
    stockTotalUnidades,
  ] = await Promise.all([
    prisma.animal.count({ where: { estadoActual: 'ACTIVO' } }),
    prisma.eventoSanitario.count({
      where: { idTipoEvento: 1, fechaEvento: { gte: inicioMes } },
    }),
    prisma.registroPeso.count({ where: { estadoValidacion: 'PENDIENTE' } }),
    prisma.calendarioSanitario.count({
      where: { estado: 'PENDIENTE', fechaProgramada: { gte: hoy, lte: en7Dias } },
    }),
    prisma.solicitudCompra.count({ where: { estadoSolicitud: 'PENDIENTE' } }),
    prisma.insumo.count({ where: { stockActual: { lte: 0 }, activo: true } }),
    prisma.insumo.count({ where: { activo: true } }),
    prisma.insumo.aggregate({ where: { activo: true }, _sum: { stockActual: true } }),
  ]);

  return {
    totalAnimalesActivos,
    vacunacionesMes,
    pesosPendientesValidar: pesosPendientes,
    alertasProximas7Dias: alertasProximas,
    solicitudesCompraPendientes: solicitudesPendientes,
    insumosStockAgotado: stockAgotado,
    inventarioTotalItems: totalInsumosActivos,
    inventarioTotalUnidades: Number(stockTotalUnidades._sum.stockActual || 0),
    generadoEn: hoy.toISOString(),
  };
}

/**
 * Distribucion del hato por raza y estado.
 */
async function getGanado() {
  const [porEstado, porRaza, recienIngresados] = await Promise.all([
    prisma.animal.groupBy({ by: ['estadoActual'], _count: { idAnimal: true } }),
    prisma.animal.groupBy({
      by: ['idRaza'],
      where: { estadoActual: 'ACTIVO' },
      _count: { idAnimal: true },
    }),
    prisma.animal.findMany({
      where: { estadoActual: 'ACTIVO' },
      orderBy: { fechaIngreso: 'desc' },
      take: 5,
      include: { raza: true },
    }),
  ]);

  const razas = await prisma.raza.findMany({ where: { activo: true } });
  const porRazaConNombre = porRaza.map((g) => ({
    ...g,
    nombreRaza: razas.find((r) => r.idRaza === g.idRaza)?.nombreRaza || 'Desconocida',
  }));

  return { porEstado, porRaza: porRazaConNombre, recienIngresados };
}

/**
 * Indicadores productivos (ultimos 30 dias).
 */
async function getProduccion() {
  const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30);

  const [
    lecheTotalMes,
    eventosRepro,
    totalAnimalesActivos,
    totalMuertes30,
    registrosPesoAprobados,
  ] = await Promise.all([
    prisma.produccionLeche.aggregate({
      where: { fechaRegistro: { gte: hace30 }, estadoValidacion: 'APROBADO' },
      _sum: { litrosProducidos: true },
      _avg: { litrosProducidos: true },
      _count: { idProduccion: true },
    }),
    prisma.eventoReproductivo.groupBy({
      by: ['tipoEvento'],
      where: { fechaEvento: { gte: hace30 } },
      _count: { idEventoReproductivo: true },
    }),
    prisma.animal.count({ where: { estadoActual: 'ACTIVO' } }),
    prisma.animal.count({
      where: {
        estadoActual: 'MUERTO',
        fechaBaja: { gte: hace30 },
      },
    }),
    prisma.registroPeso.findMany({
      where: { fechaRegistro: { gte: hace30 }, estadoValidacion: 'APROBADO' },
      include: { animal: { select: { pesoInicial: true } } },
    }),
  ]);

  const totalPartos = eventosRepro
    .filter((item) => item.tipoEvento === 'PARTO')
    .reduce((sum, item) => sum + item._count.idEventoReproductivo, 0);

  const gananciaPesoPromedioKg = registrosPesoAprobados.length
    ? registrosPesoAprobados.reduce((sum, item) => sum + (Number(item.peso) - Number(item.animal.pesoInicial)), 0) / registrosPesoAprobados.length
    : 0;

  const tasaNatalidad = totalAnimalesActivos > 0
    ? (totalPartos / totalAnimalesActivos) * 100
    : 0;

  const basePoblacional = totalAnimalesActivos + totalMuertes30;
  const tasaMortalidad = basePoblacional > 0
    ? (totalMuertes30 / basePoblacional) * 100
    : 0;

  return {
    peso: {
      gananciaPromedioKg: Number(gananciaPesoPromedioKg.toFixed(2)),
      totalRegistros: registrosPesoAprobados.length,
    },
    leche: {
      totalLitros: Number(lecheTotalMes._sum.litrosProducidos || 0),
      promedioLitros: Number(lecheTotalMes._avg.litrosProducidos || 0),
      totalRegistros: lecheTotalMes._count.idProduccion,
    },
    eventosReproductivos: eventosRepro,
    tasas: {
      natalidadPorcentaje: Number(tasaNatalidad.toFixed(2)),
      mortalidadPorcentaje: Number(tasaMortalidad.toFixed(2)),
      partosPeriodo: totalPartos,
      muertesPeriodo: totalMuertes30,
    },
    periodo: '30 dias',
  };
}

/**
 * Estado sanitario: proximos eventos y pendientes por aprobar.
 */
async function getSanitario() {
  const hoy = new Date();
  const en15Dias = new Date(hoy); en15Dias.setDate(hoy.getDate() + 15);

  const [proximos, pendientesAprobacion] = await Promise.all([
    prisma.calendarioSanitario.findMany({
      where: { estado: 'PENDIENTE', fechaProgramada: { gte: hoy, lte: en15Dias } },
      include: {
        animal: { select: { idAnimal: true, numeroArete: true } },
        tipoEvento: true,
      },
      orderBy: { fechaProgramada: 'asc' },
      take: 20,
    }),
    prisma.eventoSanitario.findMany({
      where: { estadoAprobacion: 'PENDIENTE' },
      include: {
        animal: { select: { idAnimal: true, numeroArete: true } },
        tipoEvento: true,
      },
      orderBy: { fechaEvento: 'desc' },
      take: 20,
    }),
  ]);

  return { proximosEventos: proximos, pendientesAprobacion };
}

/**
 * Estado del inventario: insumos con stock cero o critico.
 */
async function getInventario() {
  const [agotados, bajoStock, movimientosRecientes] = await Promise.all([
    prisma.insumo.findMany({
      where: { stockActual: { lte: 0 }, activo: true },
      include: { tipoInsumo: true },
    }),
    prisma.insumo.findMany({
      where: { stockActual: { gt: 0, lte: 10 }, activo: true },
      include: { tipoInsumo: true },
      orderBy: { stockActual: 'asc' },
    }),
    prisma.movimientoInventario.findMany({
      orderBy: { fechaMovimiento: 'desc' },
      take: 10,
      include: { insumo: { select: { idInsumo: true, nombreInsumo: true, unidadMedida: true } } },
    }),
  ]);

  return { agotados, bajoStock, movimientosRecientes };
}

/**
 * Bitacora de auditoria (ultimas 500 acciones).
 */
async function getBitacora(limit = 100) {
  return prisma.bitacora.findMany({
    orderBy: { fechaHora: 'desc' },
    take: Math.min(limit, 500),
    include: { usuario: { select: { idUsuario: true, nombreCompleto: true, username: true } } },
  });
}

module.exports = { getResumen, getGanado, getProduccion, getSanitario, getInventario, getBitacora };
