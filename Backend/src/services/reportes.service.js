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

function toNumber(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toDateOnly(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function normalizeAdvancedFilters(filters = {}) {
  const parsed = normalizeFilters(filters);
  return {
    ...parsed,
    edadMinimaMeses: Number(filters.edadMinimaMeses || 0),
  };
}

function metricVariation(label, periodoA, periodoB, unit = '') {
  const a = toNumber(periodoA);
  const b = toNumber(periodoB);
  const delta = b - a;
  const porcentaje = a !== 0 ? (delta / a) * 100 : (b === 0 ? 0 : 100);
  return {
    label,
    periodoA: Number(a.toFixed(2)),
    periodoB: Number(b.toFixed(2)),
    delta: Number(delta.toFixed(2)),
    porcentaje: Number(porcentaje.toFixed(2)),
    unit,
  };
}

function stockStatus(stock) {
  const value = toNumber(stock);
  if (value <= 0) return 'CRITICO';
  if (value <= 10) return 'BAJO';
  return 'OPTIMO';
}

function groupBy(items, keyGetter) {
  return items.reduce((acc, item) => {
    const key = keyGetter(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function summarizeInventory(insumos) {
  const categorias = Object.entries(groupBy(insumos, (item) => item.categoria)).map(([categoria, items]) => ({
    categoria,
    totalInsumos: items.length,
    stockTotal: Number(items.reduce((sum, item) => sum + item.stockActual, 0).toFixed(2)),
  }));

  const estados = Object.entries(groupBy(insumos, (item) => item.estado)).map(([estado, items]) => ({
    estado,
    total: items.length,
  }));

  return { categorias, estados };
}

async function getInventarioReport(filters = {}) {
  const parsed = normalizeAdvancedFilters(filters);
  const raw = await reportesRepository.getInventarioVisual(parsed);

  const insumos = raw
    .map((item) => {
      const stockActual = toNumber(item.stockActual);
      return {
        idInsumo: item.idInsumo,
        nombre: item.nombreInsumo,
        categoria: item.tipoInsumo?.nombreTipo || 'Sin categoria',
        stockActual,
        unidadMedida: item.unidadMedida,
        estado: stockStatus(stockActual),
        puntoReorden: null,
        caducidad: null,
      };
    })
    .filter((item) => !parsed.categoria || item.categoria === parsed.categoria);

  const { categorias, estados } = summarizeInventory(insumos);
  const criticos = insumos.filter((item) => item.estado === 'CRITICO').length;
  const bajos = insumos.filter((item) => item.estado === 'BAJO').length;
  const optimos = insumos.filter((item) => item.estado === 'OPTIMO').length;

  return {
    tipo: 'inventario',
    periodo: { fechaInicio: parsed.fechaInicio, fechaFin: parsed.fechaFin },
    resumen: {
      totalInsumos: insumos.length,
      criticos,
      bajos,
      optimos,
      stockTotalUnidades: Number(insumos.reduce((sum, item) => sum + item.stockActual, 0).toFixed(2)),
    },
    categorias,
    estados,
    insumos,
  };
}

function classifySanitario(animal, evento) {
  const texto = [
    evento?.tipoEvento?.nombreTipo,
    evento?.diagnostico,
    evento?.medicamento,
    evento?.dosis,
    animal.estadoSanitarioInicial,
  ].filter(Boolean).join(' ').toLowerCase();

  if (
    texto.includes('enferm')
    || texto.includes('padec')
    || texto.includes('cojera')
    || texto.includes('infeccion')
    || texto.includes('neumon')
    || texto.includes('lesion')
  ) {
    return 'ENFERMO';
  }

  if (
    texto.includes('trat')
    || texto.includes('despar')
    || Boolean(evento?.medicamento)
    || Boolean(evento?.dosis)
  ) {
    return 'EN_TRATAMIENTO';
  }

  return 'SANO';
}

function sanitaryLabel(status) {
  if (status === 'EN_TRATAMIENTO') return 'En Tratamiento';
  if (status === 'ENFERMO') return 'Enfermo';
  return 'Sano';
}

function mapSanitarioAnimal(animal) {
  const latestEvent = animal.eventosSanitarios?.[0] || null;
  const latestWeight = animal.registrosPeso?.[0]?.peso ?? animal.pesoInicial;
  const estadoSanitario = classifySanitario(animal, latestEvent);
  return {
    idAnimal: animal.idAnimal,
    arete: animal.numeroArete,
    raza: animal.raza?.nombreRaza || 'Sin raza',
    edadMeses: animal.edadEstimada || 0,
    sexo: animal.sexo,
    pesoKg: Number(toNumber(latestWeight).toFixed(2)),
    estadoSanitario,
    estadoSanitarioLabel: sanitaryLabel(estadoSanitario),
    tratamiento: latestEvent
      ? (latestEvent.medicamento || latestEvent.tipoEvento?.nombreTipo || latestEvent.diagnostico || 'Ninguno')
      : 'Ninguno',
    ultimoEvento: latestEvent ? {
      idEvento: latestEvent.idEvento,
      fechaEvento: toDateOnly(latestEvent.fechaEvento),
      tipoEvento: latestEvent.tipoEvento?.nombreTipo || null,
      diagnostico: latestEvent.diagnostico || null,
    } : null,
  };
}

async function buildSanitarioSnapshot(filters = {}) {
  const parsed = normalizeAdvancedFilters(filters);
  const raw = await reportesRepository.getSanitarioHato(parsed);
  let animales = raw.map(mapSanitarioAnimal);

  if (parsed.estado) {
    animales = animales.filter((item) => item.estadoSanitario === parsed.estado);
  }

  const sanos = animales.filter((item) => item.estadoSanitario === 'SANO').length;
  const enTratamiento = animales.filter((item) => item.estadoSanitario === 'EN_TRATAMIENTO').length;
  const enfermos = animales.filter((item) => item.estadoSanitario === 'ENFERMO').length;

  return {
    periodo: { fechaInicio: parsed.fechaInicio, fechaFin: parsed.fechaFin },
    resumen: {
      totalEvaluados: animales.length,
      sanos,
      enTratamiento,
      enfermos,
    },
    distribucion: [
      { estado: 'SANO', label: 'Sanos', total: sanos },
      { estado: 'EN_TRATAMIENTO', label: 'En Tratamiento', total: enTratamiento },
      { estado: 'ENFERMO', label: 'Enfermos', total: enfermos },
    ],
    animales,
  };
}

async function getSanitarioHatoReport(filters = {}) {
  const snapshot = await buildSanitarioSnapshot(filters);
  return {
    tipo: 'sanitario-hato',
    ...snapshot,
  };
}

async function getSanitarioComparativoReport(filters = {}) {
  const parsed = normalizeComparativo({
    modulo: 'sanitario',
    periodoAInicio: filters.periodoAInicio,
    periodoAFin: filters.periodoAFin,
    periodoBInicio: filters.periodoBInicio,
    periodoBFin: filters.periodoBFin,
  });

  const [periodoA, periodoB] = await Promise.all([
    buildSanitarioSnapshot({ fechaInicio: parsed.periodoAInicio, fechaFin: parsed.periodoAFin }),
    buildSanitarioSnapshot({ fechaInicio: parsed.periodoBInicio, fechaFin: parsed.periodoBFin }),
  ]);

  return {
    tipo: 'sanitario-comparativo',
    periodoA: { ...periodoA.periodo, ...periodoA.resumen },
    periodoB: { ...periodoB.periodo, ...periodoB.resumen },
    metricas: [
      metricVariation('Total', periodoA.resumen.totalEvaluados, periodoB.resumen.totalEvaluados, 'animales'),
      metricVariation('Sanos', periodoA.resumen.sanos, periodoB.resumen.sanos, 'animales'),
      metricVariation('Enfermos', periodoA.resumen.enfermos, periodoB.resumen.enfermos, 'animales'),
    ],
  };
}

function weightAtPeriodEnd(animal, fechaFin) {
  const end = new Date(fechaFin);
  const latest = (animal.registrosPeso || [])
    .filter((item) => new Date(item.fechaRegistro) <= end)
    .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))[0];

  return latest?.peso ?? animal.pesoInicial;
}

function gpdForAnimal(animal, fechaInicio, fechaFin) {
  const start = new Date(fechaInicio);
  const end = new Date(fechaFin);
  const registrosPorDia = new Map();

  (animal.registrosPeso || [])
    .filter((item) => {
      const date = new Date(item.fechaRegistro);
      return date <= end;
    })
    .sort((a, b) => {
      const dateDiff = new Date(a.fechaRegistro) - new Date(b.fechaRegistro);
      if (dateDiff !== 0) return dateDiff;
      return (a.idRegistroPeso || 0) - (b.idRegistroPeso || 0);
    })
    .forEach((item) => {
      registrosPorDia.set(toDateOnly(item.fechaRegistro), item);
    });

  const registros = Array.from(registrosPorDia.values());
  if (registros.length < 2) return null;

  const previousOrStart = registros
    .filter((item) => new Date(item.fechaRegistro) <= start)
    .at(-1);
  const firstInRange = registros.find((item) => new Date(item.fechaRegistro) >= start);
  const first = previousOrStart || firstInRange;
  const last = registros.at(-1);

  if (!first || !last) return null;

  const days = Math.round((new Date(last.fechaRegistro) - new Date(first.fechaRegistro)) / 86400000);
  if (days <= 0) return null;

  return (toNumber(last.peso) - toNumber(first.peso)) / days;
}

async function buildProductividadSnapshot(filters = {}) {
  const parsed = normalizeAdvancedFilters(filters);
  const raw = await reportesRepository.getProductividad(parsed);

  const animales = raw.map((animal) => {
    const pesoKg = toNumber(weightAtPeriodEnd(animal, parsed.fechaFin));
    const gpd = gpdForAnimal(animal, parsed.fechaInicio, parsed.fechaFin);
    return {
      idAnimal: animal.idAnimal,
      arete: animal.numeroArete,
      raza: animal.raza?.nombreRaza || 'Sin raza',
      edadMeses: animal.edadEstimada || 0,
      pesoKg: Number(pesoKg.toFixed(2)),
      gpdKgDia: gpd === null ? null : Number(gpd.toFixed(3)),
    };
  });

  const pesoTotalKg = animales.reduce((sum, animal) => sum + animal.pesoKg, 0);
  const gpdValues = animales.map((animal) => animal.gpdKgDia).filter((value) => value !== null);
  const gpdPromedioKgDia = gpdValues.length
    ? gpdValues.reduce((sum, value) => sum + value, 0) / gpdValues.length
    : 0;

  return {
    periodo: { fechaInicio: parsed.fechaInicio, fechaFin: parsed.fechaFin },
    filtros: { edadMinimaMeses: parsed.edadMinimaMeses },
    resumen: {
      totalAnimales: animales.length,
      pesoTotalKg: Number(pesoTotalKg.toFixed(2)),
      pesoPromedioKg: animales.length ? Number((pesoTotalKg / animales.length).toFixed(2)) : 0,
      gpdPromedioKgDia: Number(gpdPromedioKgDia.toFixed(3)),
    },
    metricas: [
      { label: 'Peso Total', value: Number(pesoTotalKg.toFixed(2)), unit: 'kg' },
      { label: 'Peso Promedio', value: animales.length ? Number((pesoTotalKg / animales.length).toFixed(2)) : 0, unit: 'kg' },
      { label: 'GPD Promedio', value: Number(gpdPromedioKgDia.toFixed(3)), unit: 'kg/dia' },
    ],
    animales,
  };
}

async function getProductividadReport(filters = {}) {
  const snapshot = await buildProductividadSnapshot(filters);
  return {
    tipo: 'productividad',
    ...snapshot,
  };
}

function lossCategory(animal) {
  const motivo = String(animal.motivoBaja || '').toLowerCase();
  if (motivo.includes('accident')) return 'Accidente';
  if (motivo.includes('enferm') || motivo.includes('neum') || motivo.includes('infeccion')) return 'Enfermedad';
  if (motivo.includes('venta') || animal.estadoActual === 'VENDIDO') return 'Venta';
  if (motivo.includes('transfer') || animal.estadoActual === 'TRANSFERIDO') return 'Transferencia';
  if (motivo.includes('muerte') || animal.estadoActual === 'MUERTO') return 'Muerte';
  return 'Otro';
}

function lossWeight(animal) {
  const fechaBaja = animal.fechaBaja ? new Date(animal.fechaBaja) : null;
  const latest = (animal.registrosPeso || []).find((registro) => (
    !fechaBaja || new Date(registro.fechaRegistro) <= fechaBaja
  ));
  return toNumber(latest?.peso ?? animal.pesoInicial);
}

async function buildPerdidasSnapshot(filters = {}) {
  const parsed = normalizeAdvancedFilters(filters);
  const raw = await reportesRepository.getBajas(parsed);
  const bajas = raw.map((animal) => ({
    idAnimal: animal.idAnimal,
    arete: animal.numeroArete,
    fechaBaja: toDateOnly(animal.fechaBaja),
    estadoActual: animal.estadoActual,
    motivo: lossCategory(animal),
    motivoDetalle: animal.motivoBaja || '',
    pesoKg: Number(lossWeight(animal).toFixed(2)),
    raza: animal.raza?.nombreRaza || 'Sin raza',
  })).filter((item) => !parsed.motivo || item.motivo === parsed.motivo);

  const pesoTotalPerdidoKg = bajas.reduce((sum, item) => sum + item.pesoKg, 0);
  const porMotivo = Object.entries(groupBy(bajas, (item) => item.motivo)).map(([motivo, items]) => {
    const pesoKg = items.reduce((sum, item) => sum + item.pesoKg, 0);
    return {
      motivo,
      bajas: items.length,
      pesoKg: Number(pesoKg.toFixed(2)),
      porcentaje: bajas.length ? Number(((items.length / bajas.length) * 100).toFixed(2)) : 0,
    };
  });

  const porPeriodo = Object.entries(groupBy(bajas, (item) => String(item.fechaBaja || '').slice(0, 7) || 'Sin fecha'))
    .map(([periodo, items]) => ({
      periodo,
      bajas: items.length,
      pesoKg: Number(items.reduce((sum, item) => sum + item.pesoKg, 0).toFixed(2)),
    }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo));

  return {
    periodo: { fechaInicio: parsed.fechaInicio, fechaFin: parsed.fechaFin },
    resumen: {
      bajasTotales: bajas.length,
      pesoTotalPerdidoKg: Number(pesoTotalPerdidoKg.toFixed(2)),
      filtroActivo: parsed.motivo || 'No',
    },
    porMotivo,
    porPeriodo,
    bajas,
  };
}

async function getPerdidasReport(filters = {}) {
  const snapshot = await buildPerdidasSnapshot(filters);
  return {
    tipo: 'perdidas',
    ...snapshot,
  };
}

async function getPerdidasComparativoReport(filters = {}) {
  const parsed = normalizeComparativo({
    modulo: 'perdidas',
    periodoAInicio: filters.periodoAInicio,
    periodoAFin: filters.periodoAFin,
    periodoBInicio: filters.periodoBInicio,
    periodoBFin: filters.periodoBFin,
  });

  const [periodoA, periodoB] = await Promise.all([
    buildPerdidasSnapshot({ fechaInicio: parsed.periodoAInicio, fechaFin: parsed.periodoAFin }),
    buildPerdidasSnapshot({ fechaInicio: parsed.periodoBInicio, fechaFin: parsed.periodoBFin }),
  ]);

  const motivos = Array.from(new Set([
    ...periodoA.porMotivo.map((item) => item.motivo),
    ...periodoB.porMotivo.map((item) => item.motivo),
  ]));

  return {
    tipo: 'perdidas-comparativo',
    periodoA: { ...periodoA.periodo, ...periodoA.resumen },
    periodoB: { ...periodoB.periodo, ...periodoB.resumen },
    metricas: [
      metricVariation('Bajas', periodoA.resumen.bajasTotales, periodoB.resumen.bajasTotales, 'bajas'),
      metricVariation('Peso Perdido', periodoA.resumen.pesoTotalPerdidoKg, periodoB.resumen.pesoTotalPerdidoKg, 'kg'),
    ],
    motivos: motivos.map((motivo) => {
      const a = periodoA.porMotivo.find((item) => item.motivo === motivo);
      const b = periodoB.porMotivo.find((item) => item.motivo === motivo);
      return {
        motivo,
        periodoA: a?.bajas || 0,
        periodoB: b?.bajas || 0,
        pesoA: a?.pesoKg || 0,
        pesoB: b?.pesoKg || 0,
      };
    }),
  };
}

async function getComparativoFechasReport(filters = {}) {
  const parsed = normalizeComparativo({
    modulo: filters.modulo || 'productividad',
    periodoAInicio: filters.periodoAInicio,
    periodoAFin: filters.periodoAFin,
    periodoBInicio: filters.periodoBInicio,
    periodoBFin: filters.periodoBFin,
  });
  const modulo = filters.modulo || 'productividad';

  if (modulo === 'sanitario') {
    return getSanitarioComparativoReport(parsed);
  }

  if (modulo === 'perdidas') {
    return getPerdidasComparativoReport(parsed);
  }

  const [periodoA, periodoB] = await Promise.all([
    buildProductividadSnapshot({
      fechaInicio: parsed.periodoAInicio,
      fechaFin: parsed.periodoAFin,
      edadMinimaMeses: filters.edadMinimaMeses || 0,
    }),
    buildProductividadSnapshot({
      fechaInicio: parsed.periodoBInicio,
      fechaFin: parsed.periodoBFin,
      edadMinimaMeses: filters.edadMinimaMeses || 0,
    }),
  ]);

  return {
    tipo: 'comparativo-fechas',
    modulo: 'productividad',
    periodoA: { ...periodoA.periodo, ...periodoA.resumen },
    periodoB: { ...periodoB.periodo, ...periodoB.resumen },
    metricas: [
      metricVariation('Animales', periodoA.resumen.totalAnimales, periodoB.resumen.totalAnimales, 'animales'),
      metricVariation('Peso Total', periodoA.resumen.pesoTotalKg, periodoB.resumen.pesoTotalKg, 'kg'),
      metricVariation('Peso Promedio', periodoA.resumen.pesoPromedioKg, periodoB.resumen.pesoPromedioKg, 'kg'),
      metricVariation('GPD Promedio', periodoA.resumen.gpdPromedioKgDia, periodoB.resumen.gpdPromedioKgDia, 'kg/dia'),
    ],
  };
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
  if (reportType === 'inventario') {
    return toCsv(data.insumos.map((item) => ({
      nombre: item.nombre,
      categoria: item.categoria,
      stock: item.stockActual,
      unidad: item.unidadMedida,
      estado: item.estado,
    })));
  }

  if (reportType === 'sanitario-hato') {
    return toCsv(data.animales.map((item) => ({
      arete: item.arete,
      raza: item.raza,
      edadMeses: item.edadMeses,
      sexo: item.sexo,
      pesoKg: item.pesoKg,
      estadoSanitario: item.estadoSanitarioLabel,
      tratamiento: item.tratamiento,
    })));
  }

  if (reportType === 'productividad') {
    return toCsv(data.animales.map((item) => ({
      arete: item.arete,
      raza: item.raza,
      edadMeses: item.edadMeses,
      pesoKg: item.pesoKg,
      gpdKgDia: item.gpdKgDia ?? '',
    })));
  }

  if (reportType === 'perdidas') {
    return toCsv(data.porMotivo.map((item) => ({
      motivo: item.motivo,
      bajas: item.bajas,
      pesoKg: item.pesoKg,
      porcentaje: item.porcentaje,
    })));
  }

  if (
    reportType === 'sanitario-comparativo'
    || reportType === 'comparativo-fechas'
    || reportType === 'perdidas-comparativo'
  ) {
    return toCsv((data.metricas || []).map((item) => ({
      indicador: item.label,
      periodoA: item.periodoA,
      periodoB: item.periodoB,
      delta: item.delta,
      porcentaje: item.porcentaje,
      unidad: item.unit,
    })));
  }

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
  getInventarioReport,
  getSanitarioHatoReport,
  getSanitarioComparativoReport,
  getProductividadReport,
  getComparativoFechasReport,
  getPerdidasReport,
  getPerdidasComparativoReport,
  reportToCsv,
  reportToPdf,
};
