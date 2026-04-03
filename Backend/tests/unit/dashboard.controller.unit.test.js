const test = require('node:test');
const assert = require('node:assert/strict');

function loadDashboardController({ dashboardServiceMock, sendSuccessMock }) {
  const servicePath = require.resolve('../../src/services/dashboard.service');
  const responsePath = require.resolve('../../src/utils/response');
  const controllerPath = require.resolve('../../src/controllers/dashboard.controller');

  const previousService = require.cache[servicePath];
  const previousResponse = require.cache[responsePath];
  const previousController = require.cache[controllerPath];

  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: dashboardServiceMock,
  };
  require.cache[responsePath] = {
    id: responsePath,
    filename: responsePath,
    loaded: true,
    exports: { sendSuccess: sendSuccessMock },
  };
  delete require.cache[controllerPath];

  const controller = require(controllerPath);

  return {
    controller,
    restore() {
      if (previousService) require.cache[servicePath] = previousService;
      else delete require.cache[servicePath];

      if (previousResponse) require.cache[responsePath] = previousResponse;
      else delete require.cache[responsePath];

      if (previousController) require.cache[controllerPath] = previousController;
      else delete require.cache[controllerPath];
    },
  };
}

test('dashboard.controller.getResumen responde con payload y mensaje estandar', async () => {
  const expected = { totalAnimalesActivos: 10 };
  const sendSuccessCalls = [];
  const serviceCalls = [];

  const { controller, restore } = loadDashboardController({
    dashboardServiceMock: {
      getResumen: async () => {
        serviceCalls.push('getResumen');
        return expected;
      },
    },
    sendSuccessMock: (res, data, message) => {
      sendSuccessCalls.push({ res, data, message });
      return { success: true };
    },
  });

  try {
    const res = {};
    const nextCalls = [];

    await controller.getResumen({}, res, (err) => nextCalls.push(err));

    assert.deepEqual(serviceCalls, ['getResumen']);
    assert.equal(nextCalls.length, 0);
    assert.equal(sendSuccessCalls.length, 1);
    assert.equal(sendSuccessCalls[0].res, res);
    assert.deepEqual(sendSuccessCalls[0].data, expected);
    assert.equal(sendSuccessCalls[0].message, 'Resumen del sistema obtenido');
  } finally {
    restore();
  }
});

test('dashboard.controller.getBitacora usa limit query y fallback a 100', async () => {
  const receivedLimits = [];

  const { controller, restore } = loadDashboardController({
    dashboardServiceMock: {
      getBitacora: async (limit) => {
        receivedLimits.push(limit);
        return [];
      },
    },
    sendSuccessMock: (_res, data, message) => ({ data, message }),
  });

  try {
    await controller.getBitacora({ query: { limit: '250' } }, {}, () => {});
    await controller.getBitacora({ query: { limit: 'invalido' } }, {}, () => {});
    await controller.getBitacora({ query: {} }, {}, () => {});

    assert.deepEqual(receivedLimits, [250, 100, 100]);
  } finally {
    restore();
  }
});

test('dashboard.controller.getStream abre SSE y limpia intervalo al cerrar', async () => {
  const setHeaderCalls = [];
  const writeCalls = [];
  const clearIntervalCalls = [];
  const serviceCalls = [];

  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;

  let intervalMs = 0;
  let intervalCallback = null;
  let closeHandler = null;

  global.setInterval = (cb, ms) => {
    intervalCallback = cb;
    intervalMs = ms;
    return 777;
  };
  global.clearInterval = (id) => {
    clearIntervalCalls.push(id);
  };

  const { controller, restore } = loadDashboardController({
    dashboardServiceMock: {
      getResumen: async () => {
        serviceCalls.push('getResumen');
        return { totalAnimalesActivos: 20 };
      },
    },
    sendSuccessMock: () => {
      throw new Error('sendSuccess no debe usarse en SSE');
    },
  });

  try {
    const req = {
      on(event, cb) {
        if (event === 'close') closeHandler = cb;
      },
    };

    let ended = false;
    const res = {
      setHeader(key, value) {
        setHeaderCalls.push([key, value]);
      },
      flushHeaders() {},
      write(value) {
        writeCalls.push(value);
      },
      end() {
        ended = true;
      },
    };

    const nextCalls = [];

    await controller.getStream(req, res, (err) => nextCalls.push(err));

    assert.equal(nextCalls.length, 0);
    assert.deepEqual(setHeaderCalls, [
      ['Content-Type', 'text/event-stream'],
      ['Cache-Control', 'no-cache'],
      ['Connection', 'keep-alive'],
    ]);
    assert.equal(intervalMs, 15000);
    assert.equal(typeof intervalCallback, 'function');
    assert.equal(serviceCalls.length, 1);
    assert.equal(writeCalls[0], 'event: dashboard-resumen\n');
    assert.ok(writeCalls[1].startsWith('data: {"totalAnimalesActivos":20}'));

    assert.equal(typeof closeHandler, 'function');
    closeHandler();
    assert.deepEqual(clearIntervalCalls, [777]);
    assert.equal(ended, true);
  } finally {
    restore();
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  }
});
