const test = require('node:test');
const assert = require('node:assert/strict');

function loadReportesService(reportesRepositoryMock) {
  const repositoryPath = require.resolve('../../src/repositories/reportes.repository');
  const servicePath = require.resolve('../../src/services/reportes.service');

  const previousRepository = require.cache[repositoryPath];
  const previousService = require.cache[servicePath];

  require.cache[repositoryPath] = {
    id: repositoryPath,
    filename: repositoryPath,
    loaded: true,
    exports: reportesRepositoryMock,
  };
  delete require.cache[servicePath];

  const service = require(servicePath);

  return {
    service,
    restore() {
      if (previousRepository) require.cache[repositoryPath] = previousRepository;
      else delete require.cache[repositoryPath];

      if (previousService) require.cache[servicePath] = previousService;
      else delete require.cache[servicePath];
    },
  };
}

test('reportes.service.getSanitarioReport construye resumen y respeta filtros normalizados', async () => {
  const repositoryCalls = [];

  const reportesRepositoryMock = {
    getSanitario: async (filters) => {
      repositoryCalls.push(filters);
      return [
        { estadoAprobacion: 'APROBADO' },
        { estadoAprobacion: 'RECHAZADO' },
        { estadoAprobacion: 'PENDIENTE' },
        { estadoAprobacion: 'APROBADO' },
      ];
    },
  };

  const { service, restore } = loadReportesService(reportesRepositoryMock);

  try {
    const result = await service.getSanitarioReport({
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-31',
      estadoAprobacion: 'APROBADO',
      idTipoEvento: 2,
    });

    assert.equal(repositoryCalls.length, 1);
    assert.deepEqual(repositoryCalls[0], {
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-31',
      estadoAprobacion: 'APROBADO',
      idTipoEvento: 2,
    });

    assert.equal(result.tipo, 'sanitario');
    assert.deepEqual(result.periodo, { fechaInicio: '2026-01-01', fechaFin: '2026-01-31' });
    assert.deepEqual(result.resumen, {
      totalRegistros: 4,
      aprobados: 2,
      rechazados: 1,
      pendientes: 1,
    });
    assert.equal(result.registros.length, 4);
  } finally {
    restore();
  }
});

test('reportes.service.getProductivoReport calcula promedio, total leche y tasa de natalidad', async () => {
  const reportesRepositoryMock = {
    getProductivo: async () => ({
      registrosPeso: [
        { idAnimal: 1, peso: '210.0' },
        { idAnimal: 2, peso: 190 },
        { idAnimal: 1, peso: 230 },
      ],
      produccionLeche: [
        { litrosProducidos: '10.5' },
        { litrosProducidos: 9.5 },
      ],
      eventosReproductivos: [
        { tipoEvento: 'PARTO' },
        { tipoEvento: 'PARTO' },
        { tipoEvento: 'MONTA' },
      ],
    }),
  };

  const { service, restore } = loadReportesService(reportesRepositoryMock);

  try {
    const result = await service.getProductivoReport({
      fechaInicio: '2026-02-01',
      fechaFin: '2026-02-28',
    });

    assert.equal(result.tipo, 'productivo');
    assert.deepEqual(result.periodo, { fechaInicio: '2026-02-01', fechaFin: '2026-02-28' });
    assert.deepEqual(result.resumen, {
      totalRegistrosPeso: 3,
      promedioPesoKg: 210,
      totalRegistrosLeche: 2,
      totalLitrosLeche: 20,
      totalEventosReproductivos: 3,
      tasaNatalidadPorcentaje: 100,
    });
    assert.equal(result.registrosPeso.length, 3);
    assert.equal(result.produccionLeche.length, 2);
    assert.equal(result.eventosReproductivos.length, 3);
  } finally {
    restore();
  }
});

test('reportes.service.getAdministrativoReport calcula montos, stock y consumos por categoria', async () => {
  const reportesRepositoryMock = {
    getAdministrativo: async () => ({
      solicitudes: [{ idSolicitud: 1 }, { idSolicitud: 2 }],
      compras: [
        { totalReal: '150.50' },
        { totalReal: 49.5 },
      ],
      movimientos: [
        {
          tipoMovimiento: 'SALIDA',
          cantidad: '5',
          insumo: { tipoInsumo: { nombreTipo: 'Medicamentos' } },
        },
        {
          tipoMovimiento: 'SALIDA',
          cantidad: 8,
          insumo: { tipoInsumo: { nombreTipo: 'Alimento balanceado' } },
        },
        {
          tipoMovimiento: 'ENTRADA',
          cantidad: 20,
          insumo: { tipoInsumo: { nombreTipo: 'Medicamentos' } },
        },
      ],
      inventarioActual: [
        { stockActual: '10' },
        { stockActual: 20.75 },
      ],
    }),
  };

  const { service, restore } = loadReportesService(reportesRepositoryMock);

  try {
    const result = await service.getAdministrativoReport({
      fechaInicio: '2026-03-01',
      fechaFin: '2026-03-31',
    });

    assert.equal(result.tipo, 'administrativo');
    assert.deepEqual(result.periodo, { fechaInicio: '2026-03-01', fechaFin: '2026-03-31' });
    assert.deepEqual(result.resumen, {
      totalSolicitudes: 2,
      totalCompras: 2,
      montoCompras: 200,
      totalMovimientosInventario: 3,
      totalInsumosActivos: 2,
      stockTotalUnidades: 30.75,
      consumoMedicamentos: 5,
      consumoAlimentos: 8,
    });
  } finally {
    restore();
  }
});

test('reportes.service.getComparativoReport consulta periodos correctos y calcula variacion', async () => {
  const sanitarioSummaryCalls = [];
  const productivoSummaryCalls = [];

  const reportesRepositoryMock = {
    getSanitarioSummary: async (fechaInicio, fechaFin) => {
      sanitarioSummaryCalls.push({ fechaInicio, fechaFin });
      if (sanitarioSummaryCalls.length === 1) {
        return { totalEventos: 10, aprobados: 8, rechazados: 1, pendientes: 1 };
      }
      return { totalEventos: 12, aprobados: 9, rechazados: 2, pendientes: 1 };
    },
    getProductivoSummary: async (...args) => {
      productivoSummaryCalls.push(args);
      return {};
    },
  };

  const { service, restore } = loadReportesService(reportesRepositoryMock);

  try {
    const result = await service.getComparativoReport({
      modulo: 'sanitario',
      periodoAInicio: '2026-01-01',
      periodoAFin: '2026-01-15',
      periodoBInicio: '2026-01-16',
      periodoBFin: '2026-01-31',
    });

    assert.equal(result.tipo, 'comparativo');
    assert.equal(result.modulo, 'sanitario');
    assert.equal(productivoSummaryCalls.length, 0);
    assert.deepEqual(sanitarioSummaryCalls, [
      { fechaInicio: '2026-01-01', fechaFin: '2026-01-15' },
      { fechaInicio: '2026-01-16', fechaFin: '2026-01-31' },
    ]);
    assert.deepEqual(result.variacion.totalEventos, { delta: 2, porcentaje: 20 });
    assert.deepEqual(result.variacion.rechazados, { delta: 1, porcentaje: 100 });
  } finally {
    restore();
  }
});
