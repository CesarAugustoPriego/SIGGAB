const test = require('node:test');
const assert = require('node:assert/strict');

function loadReportesController({ reportesServiceMock, sendSuccessMock }) {
  const servicePath = require.resolve('../../src/services/reportes.service');
  const responsePath = require.resolve('../../src/utils/response');
  const controllerPath = require.resolve('../../src/controllers/reportes.controller');

  const previousService = require.cache[servicePath];
  const previousResponse = require.cache[responsePath];
  const previousController = require.cache[controllerPath];

  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: reportesServiceMock,
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

function createResponseDouble() {
  const headers = [];
  let statusCode = null;
  let sentPayload = null;

  return {
    res: {
      setHeader(key, value) {
        headers.push([key, value]);
      },
      status(code) {
        statusCode = code;
        return {
          send(payload) {
            sentPayload = payload;
            return payload;
          },
        };
      },
    },
    get headers() {
      return headers;
    },
    get statusCode() {
      return statusCode;
    },
    get sentPayload() {
      return sentPayload;
    },
  };
}

test('reportes.controller.getSanitario usa sendSuccess en formato JSON', async () => {
  const sendSuccessCalls = [];
  const serviceCalls = [];

  const { controller, restore } = loadReportesController({
    reportesServiceMock: {
      getSanitarioReport: async (query) => {
        serviceCalls.push(query);
        return { tipo: 'sanitario' };
      },
    },
    sendSuccessMock: (res, data, message) => {
      sendSuccessCalls.push({ res, data, message });
      return { ok: true };
    },
  });

  try {
    const req = { query: {} };
    const res = {};
    const nextCalls = [];

    await controller.getSanitario(req, res, (error) => nextCalls.push(error));

    assert.equal(nextCalls.length, 0);
    assert.deepEqual(serviceCalls, [req.query]);
    assert.equal(sendSuccessCalls.length, 1);
    assert.equal(sendSuccessCalls[0].res, res);
    assert.deepEqual(sendSuccessCalls[0].data, { tipo: 'sanitario' });
    assert.equal(sendSuccessCalls[0].message, 'Reporte sanitario generado');
  } finally {
    restore();
  }
});

test('reportes.controller.getProductivo responde CSV con headers de descarga', async () => {
  const csvCalls = [];
  const sendSuccessCalls = [];

  const { controller, restore } = loadReportesController({
    reportesServiceMock: {
      getProductivoReport: async () => ({ tipo: 'productivo' }),
      reportToCsv: (reportType, report) => {
        csvCalls.push({ reportType, report });
        return 'col1,col2\n1,2';
      },
    },
    sendSuccessMock: (...args) => {
      sendSuccessCalls.push(args);
    },
  });

  try {
    const response = createResponseDouble();
    const req = { query: { formato: 'csv' } };

    await controller.getProductivo(req, response.res, () => {});

    assert.equal(sendSuccessCalls.length, 0);
    assert.equal(csvCalls.length, 1);
    assert.equal(csvCalls[0].reportType, 'productivo');
    assert.deepEqual(csvCalls[0].report, { tipo: 'productivo' });
    assert.equal(response.statusCode, 200);
    assert.equal(response.sentPayload, 'col1,col2\n1,2');
    assert.deepEqual(response.headers[0], ['Content-Type', 'text/csv; charset=utf-8']);
    assert.match(response.headers[1][1], /^attachment; filename="reporte-productivo-.*\.csv"$/);
  } finally {
    restore();
  }
});

test('reportes.controller.getAdministrativo responde PDF con buffer adjunto', async () => {
  const pdfCalls = [];
  const expectedPdf = Buffer.from('pdf-binary-data');

  const { controller, restore } = loadReportesController({
    reportesServiceMock: {
      getAdministrativoReport: async () => ({ tipo: 'administrativo' }),
      reportToPdf: async (reportType, report) => {
        pdfCalls.push({ reportType, report });
        return expectedPdf;
      },
    },
    sendSuccessMock: () => {
      throw new Error('sendSuccess no debe invocarse para PDF');
    },
  });

  try {
    const response = createResponseDouble();
    const req = { query: { formato: 'pdf' } };

    await controller.getAdministrativo(req, response.res, () => {});

    assert.equal(pdfCalls.length, 1);
    assert.equal(pdfCalls[0].reportType, 'administrativo');
    assert.deepEqual(pdfCalls[0].report, { tipo: 'administrativo' });
    assert.equal(response.statusCode, 200);
    assert.equal(response.sentPayload, expectedPdf);
    assert.deepEqual(response.headers[0], ['Content-Type', 'application/pdf']);
    assert.match(response.headers[1][1], /^attachment; filename="reporte-administrativo-.*\.pdf"$/);
  } finally {
    restore();
  }
});

test('reportes.controller.getComparativo propaga errores al middleware global', async () => {
  const expectedError = Object.assign(new Error('Fallo comparativo'), { statusCode: 500 });
  const sendSuccessCalls = [];

  const { controller, restore } = loadReportesController({
    reportesServiceMock: {
      getComparativoReport: async () => {
        throw expectedError;
      },
    },
    sendSuccessMock: (...args) => {
      sendSuccessCalls.push(args);
    },
  });

  try {
    const nextCalls = [];

    await controller.getComparativo({ query: {} }, {}, (error) => nextCalls.push(error));

    assert.equal(sendSuccessCalls.length, 0);
    assert.equal(nextCalls.length, 1);
    assert.equal(nextCalls[0], expectedError);
  } finally {
    restore();
  }
});
