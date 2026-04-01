const reportesRepository = require('../repositories/reportes.repository');
const { toCsv } = require('../utils/csv');
const { reportToPdf } = require('../utils/pdf');

function getDefaultRange() {
  const fechaFin = new Date();
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaFin.getDate() - 30);
  return { fechaInicio, fechaFin };
}

function normalizeFilters(filters = {}) {
  const defaults = getDefaultRange();
  const fechaInicio = filters.fechaInicio ? new Date(filters.fechaInicio) : defaults.fechaInicio;
  const fechaFin = filters.fechaFin ? new Date(filters.fechaFin) : defaults.fechaFin;

  if (fechaFin < fechaInicio) {
    throw Object.assign(new Error('fechaFin debe ser mayor o igual a fechaInicio'), { statusCode: 400 });
  }

  return {
    ...filters,
    fechaInicio: fechaInicio.toISOString().slice(0, 10),
    fechaFin: fechaFin.toISOString().slice(0, 10),
  };
}

function normalizeComparativo(filters) {
  return {
    modulo: filters.modulo,
    periodoAInicio: new Date(filters.periodoAInicio).toISOString().slice(0, 10),
    periodoAFin: new Date(filters.periodoAFin).toISOString().slice(0, 10),
    periodoBInicio: new Date(filters.periodoBInicio).toISOString().slice(0, 10),
    periodoBFin: new Date(filters.periodoBFin).toISOString().slice(0, 10),
  };
}

async function getSanitarioReport(filters = {}) {
  const parsed = normalizeFilters(filters);
  const registros = await reportesRepository.getSanitario(parsed);

  const resumen = {
    totalRegistros: registros.length,
    aprobados: registros.filter((r) => r.estadoAprobacion === 'APROBADO').length,
    rechazados: registros.filter((r) => r.estadoAprobacion === 'RECHAZADO').length,
    pendientes: registros.filter((r) => r.estadoAprobacion === 'PENDIENTE').length,
  };

  return {
    tipo: 'sanitario',
    periodo: { fechaInicio: parsed.fechaInicio, fechaFin: parsed.fechaFin },
    resumen,
    registros,
  };
}

async function getProductivoReport(filters = {}) {
  const parsed = normalizeFilters(filters);
  const payload = await reportesRepository.getProductivo(parsed);

  const promedioPeso = payload.registrosPeso.length
    ? payload.registrosPeso.reduce((sum, item) => sum + Number(item.peso), 0) / payload.registrosPeso.length
    : 0;
  const totalLeche = payload.produccionLeche.reduce((sum, item) => sum + Number(item.litrosProducidos), 0);

  const totalPartos = payload.eventosReproductivos.filter((item) => item.tipoEvento === 'PARTO').length;
  const totalAnimalesRegistrados = new Set(payload.registrosPeso.map((r) => r.idAnimal)).size || 1;
  const tasaNatalidad = (totalPartos / totalAnimalesRegistrados) * 100;

  return {
    tipo: 'productivo',
    periodo: { fechaInicio: parsed.fechaInicio, fechaFin: parsed.fechaFin },
    resumen: {
      totalRegistrosPeso: payload.registrosPeso.length,
      promedioPesoKg: Number(promedioPeso.toFixed(2)),
      totalRegistrosLeche: payload.produccionLeche.length,
      totalLitrosLeche: Number(totalLeche.toFixed(2)),
      totalEventosReproductivos: payload.eventosReproductivos.length,
      tasaNatalidadPorcentaje: Number(tasaNatalidad.toFixed(2)),
    },
    ...payload,
  };
}

async function getAdministrativoReport(filters = {}) {
  const parsed = normalizeFilters(filters);
  const payload = await reportesRepository.getAdministrativo(parsed);

  const montoCompras = payload.compras.reduce((sum, item) => sum + Number(item.totalReal), 0);
  const stockTotal = payload.inventarioActual.reduce((sum, item) => sum + Number(item.stockActual), 0);

  const salidas = payload.movimientos.filter((m) => m.tipoMovimiento === 'SALIDA');
  const consumoMedicamentos = salidas
    .filter((m) => (m.insumo?.tipoInsumo?.nombreTipo || '').toLowerCase().includes('medic'))
    .reduce((sum, m) => sum + Number(m.cantidad), 0);
  const consumoAlimentos = salidas
    .filter((m) => (m.insumo?.tipoInsumo?.nombreTipo || '').toLowerCase().includes('alimen'))
    .reduce((sum, m) => sum + Number(m.cantidad), 0);

  return {
    tipo: 'administrativo',
    periodo: { fechaInicio: parsed.fechaInicio, fechaFin: parsed.fechaFin },
    resumen: {
      totalSolicitudes: payload.solicitudes.length,
      totalCompras: payload.compras.length,
      montoCompras: Number(montoCompras.toFixed(2)),
      totalMovimientosInventario: payload.movimientos.length,
      totalInsumosActivos: payload.inventarioActual.length,
      stockTotalUnidades: Number(stockTotal.toFixed(2)),
      consumoMedicamentos: Number(consumoMedicamentos.toFixed(2)),
      consumoAlimentos: Number(consumoAlimentos.toFixed(2)),
    },
    ...payload,
  };
}

function calculateVariation(periodoA, periodoB) {
  const variacion = {};
  for (const key of Object.keys(periodoA)) {
    const valorA = Number(periodoA[key] || 0);
    const valorB = Number(periodoB[key] || 0);
    const delta = valorB - valorA;
    const porcentaje = valorA !== 0 ? (delta / valorA) * 100 : (valorB === 0 ? 0 : 100);

    variacion[key] = {
      delta: Number(delta.toFixed(2)),
      porcentaje: Number(porcentaje.toFixed(2)),
    };
  }
  return variacion;
}

async function getComparativoReport(filters = {}) {
  const parsed = normalizeComparativo(filters);

  const [periodoA, periodoB] = await Promise.all([
    parsed.modulo === 'sanitario'
      ? reportesRepository.getSanitarioSummary(parsed.periodoAInicio, parsed.periodoAFin)
      : reportesRepository.getProductivoSummary(parsed.periodoAInicio, parsed.periodoAFin),
    parsed.modulo === 'sanitario'
      ? reportesRepository.getSanitarioSummary(parsed.periodoBInicio, parsed.periodoBFin)
      : reportesRepository.getProductivoSummary(parsed.periodoBInicio, parsed.periodoBFin),
  ]);

  return {
    tipo: 'comparativo',
    modulo: parsed.modulo,
    periodoA: {
      ...periodoA,
      fechaInicio: parsed.periodoAInicio,
      fechaFin: parsed.periodoAFin,
    },
    periodoB: {
      ...periodoB,
      fechaInicio: parsed.periodoBInicio,
      fechaFin: parsed.periodoBFin,
    },
    variacion: calculateVariation(periodoA, periodoB),
  };
}

function reportToCsv(reportType, data) {
  if (reportType === 'sanitario') {
    const rows = data.registros.map((item) => ({
      idEvento: item.idEvento,
      fechaEvento: item.fechaEvento.toISOString().slice(0, 10),
      numeroArete: item.animal.numeroArete,
      tipoEvento: item.tipoEvento.nombreTipo,
      estadoAprobacion: item.estadoAprobacion,
      diagnostico: item.diagnostico || '',
      medicamento: item.medicamento || '',
      dosis: item.dosis || '',
    }));
    return toCsv(rows);
  }

  if (reportType === 'productivo') {
    const rows = [
      ...data.registrosPeso.map((item) => ({
        modulo: 'registro_peso',
        idRegistro: item.idRegistroPeso,
        fecha: item.fechaRegistro.toISOString().slice(0, 10),
        numeroArete: item.animal.numeroArete,
        valor: item.peso,
        unidad: 'kg',
        estado: item.estadoValidacion,
      })),
      ...data.produccionLeche.map((item) => ({
        modulo: 'produccion_leche',
        idRegistro: item.idProduccion,
        fecha: item.fechaRegistro.toISOString().slice(0, 10),
        numeroArete: item.animal.numeroArete,
        valor: item.litrosProducidos,
        unidad: 'litros',
        estado: item.estadoValidacion,
      })),
      ...data.eventosReproductivos.map((item) => ({
        modulo: 'eventos_reproductivos',
        idRegistro: item.idEventoReproductivo,
        fecha: item.fechaEvento.toISOString().slice(0, 10),
        numeroArete: item.animal.numeroArete,
        valor: item.tipoEvento,
        unidad: '',
        estado: item.estadoValidacion,
      })),
    ];
    return toCsv(rows);
  }

  if (reportType === 'comparativo') {
    const rows = Object.entries(data.variacion).map(([indicador, info]) => ({
      indicador,
      delta: info.delta,
      porcentaje: info.porcentaje,
    }));
    return toCsv(rows);
  }

  const rows = [
    ...data.solicitudes.map((item) => ({
      modulo: 'solicitudes_compra',
      idRegistro: item.idSolicitud,
      fecha: item.fechaSolicitud.toISOString().slice(0, 10),
      estado: item.estadoSolicitud,
      monto: item.detalles.reduce((sum, detail) => sum + Number(detail.subtotalEstimado), 0),
    })),
    ...data.compras.map((item) => ({
      modulo: 'compras_realizadas',
      idRegistro: item.idCompra,
      fecha: item.fechaCompra.toISOString().slice(0, 10),
      estado: 'COMPLETADA',
      monto: item.totalReal,
    })),
    ...data.movimientos.map((item) => ({
      modulo: 'movimientos_inventario',
      idRegistro: item.idMovimiento,
      fecha: item.fechaMovimiento.toISOString().slice(0, 10),
      estado: item.tipoMovimiento,
      monto: '',
    })),
  ];
  return toCsv(rows);
}

module.exports = {
  getSanitarioReport,
  getProductivoReport,
  getAdministrativoReport,
  getComparativoReport,
  reportToCsv,
  reportToPdf,
};
