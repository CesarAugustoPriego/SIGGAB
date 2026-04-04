const test = require('node:test');
const assert = require('node:assert/strict');

function loadDashboardService(prismaMock) {
  const prismaPath = require.resolve('../../src/repositories/prisma');
  const servicePath = require.resolve('../../src/services/dashboard.service');

  const previousPrisma = require.cache[prismaPath];
  const previousService = require.cache[servicePath];

  require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: prismaMock,
  };
  delete require.cache[servicePath];

  const service = require(servicePath);

  return {
    service,
    restore() {
      if (previousPrisma) require.cache[prismaPath] = previousPrisma;
      else delete require.cache[prismaPath];

      if (previousService) require.cache[servicePath] = previousService;
      else delete require.cache[servicePath];
    },
  };
}

test('dashboard.service.getResumen mapea KPIs y aplica filtros esperados', async () => {
  const insumoCountCalls = [];
  const aggregateCalls = [];

  const prismaMock = {
    animal: {
      count: async ({ where }) => {
        assert.deepEqual(where, { estadoActual: 'ACTIVO' });
        return 42;
      },
    },
    eventoSanitario: {
      count: async ({ where }) => {
        assert.equal(where.idTipoEvento, 1);
        assert.ok(where.fechaEvento.gte instanceof Date);
        return 8;
      },
    },
    registroPeso: {
      count: async ({ where }) => {
        assert.deepEqual(where, { estadoValidacion: 'PENDIENTE' });
        return 5;
      },
    },
    calendarioSanitario: {
      count: async ({ where }) => {
        assert.equal(where.estado, 'PENDIENTE');
        assert.ok(where.fechaProgramada.gte instanceof Date);
        assert.ok(where.fechaProgramada.lte instanceof Date);
        return 3;
      },
    },
    solicitudCompra: {
      count: async ({ where }) => {
        assert.deepEqual(where, { estadoSolicitud: 'PENDIENTE' });
        return 4;
      },
    },
    insumo: {
      count: async ({ where }) => {
        insumoCountCalls.push(where);
        if (where.stockActual) return 2;
        return 19;
      },
      aggregate: async ({ where, _sum }) => {
        aggregateCalls.push({ where, _sum });
        return { _sum: { stockActual: 321.5 } };
      },
    },
  };

  const { service, restore } = loadDashboardService(prismaMock);

  try {
    const result = await service.getResumen();

    assert.equal(result.totalAnimalesActivos, 42);
    assert.equal(result.vacunacionesMes, 8);
    assert.equal(result.pesosPendientesValidar, 5);
    assert.equal(result.alertasProximas7Dias, 3);
    assert.equal(result.solicitudesCompraPendientes, 4);
    assert.equal(result.insumosStockAgotado, 2);
    assert.equal(result.inventarioTotalItems, 19);
    assert.equal(result.inventarioTotalUnidades, 321.5);
    assert.ok(typeof result.generadoEn === 'string');
    assert.ok(Number.isFinite(Date.parse(result.generadoEn)));

    assert.equal(insumoCountCalls.length, 2);
    assert.deepEqual(insumoCountCalls[0], { stockActual: { lte: 0 }, activo: true });
    assert.deepEqual(insumoCountCalls[1], { activo: true });

    assert.equal(aggregateCalls.length, 1);
    assert.deepEqual(aggregateCalls[0], {
      where: { activo: true },
      _sum: { stockActual: true },
    });
  } finally {
    restore();
  }
});

test('dashboard.service.getProduccion calcula metricas productivas y tasas', async () => {
  const prismaMock = {
    produccionLeche: {
      aggregate: async () => ({
        _sum: { litrosProducidos: 100.25 },
        _avg: { litrosProducidos: 20.05 },
        _count: { idProduccion: 5 },
      }),
    },
    eventoReproductivo: {
      groupBy: async () => ([
        { tipoEvento: 'PARTO', _count: { idEventoReproductivo: 2 } },
        { tipoEvento: 'CELO', _count: { idEventoReproductivo: 1 } },
      ]),
    },
    animal: {
      count: async ({ where }) => {
        if (where.estadoActual === 'ACTIVO') return 10;
        if (where.estadoActual === 'MUERTO') return 1;
        return 0;
      },
    },
    registroPeso: {
      findMany: async () => ([
        { peso: 240, animal: { pesoInicial: 210 } },
        { peso: 260, animal: { pesoInicial: 220 } },
      ]),
    },
  };

  const { service, restore } = loadDashboardService(prismaMock);

  try {
    const result = await service.getProduccion();

    assert.equal(result.peso.gananciaPromedioKg, 35);
    assert.equal(result.peso.totalRegistros, 2);
    assert.equal(result.leche.totalLitros, 100.25);
    assert.equal(result.leche.promedioLitros, 20.05);
    assert.equal(result.leche.totalRegistros, 5);
    assert.equal(result.tasas.partosPeriodo, 2);
    assert.equal(result.tasas.muertesPeriodo, 1);
    assert.equal(result.tasas.natalidadPorcentaje, 20);
    assert.equal(result.tasas.mortalidadPorcentaje, 9.09);
    assert.equal(result.periodo, '30 dias');
  } finally {
    restore();
  }
});

test('dashboard.service.getBitacora respeta limite maximo de 500', async () => {
  const calls = [];

  const prismaMock = {
    bitacora: {
      findMany: async (args) => {
        calls.push(args);
        return [];
      },
    },
  };

  const { service, restore } = loadDashboardService(prismaMock);

  try {
    await service.getBitacora(999);
    await service.getBitacora(50);

    assert.equal(calls.length, 2);
    assert.equal(calls[0].take, 500);
    assert.equal(calls[1].take, 50);
    assert.deepEqual(calls[0].orderBy, { fechaHora: 'desc' });
    assert.deepEqual(calls[0].include, {
      usuario: {
        select: {
          idUsuario: true,
          nombreCompleto: true,
          username: true,
          rol: { select: { idRol: true, nombreRol: true } },
        },
      },
    });
  } finally {
    restore();
  }
});
