import { expect, test, type Page } from '@playwright/test';
import { loginAsAdmin } from './helpers';

function apiEnvelope(data: unknown, message = 'OK') {
  return {
    success: true,
    data,
    message,
    errors: null,
  };
}

async function mockReportesEndpoints(page: Page, mode: 'success' | 'forbidden-productivo') {
  const calls = {
    tipos: 0,
    animales: 0,
    lotes: 0,
    sanitario: 0,
    productivo: 0,
    administrativo: 0,
    comparativo: 0,
  };

  await page.route('**/api/**', async (route) => {
    const requestUrl = new URL(route.request().url());
    const path = requestUrl.pathname;

    if (path.endsWith('/eventos-sanitarios/tipos')) {
      calls.tipos += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope([
          { idTipoEvento: 1, nombreTipo: 'Vacuna' },
          { idTipoEvento: 2, nombreTipo: 'Tratamiento' },
        ])),
      });
      return;
    }

    if (path.endsWith('/animales')) {
      calls.animales += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope([
          { idAnimal: 11, numeroArete: 'MX-REP-001' },
          { idAnimal: 12, numeroArete: 'MX-REP-002' },
        ])),
      });
      return;
    }

    if (path.endsWith('/lotes-productivos')) {
      calls.lotes += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope([
          { idLote: 91, fechaInicio: '2026-03-01', fechaFin: '2026-03-07', estado: 'APROBADO' },
        ])),
      });
      return;
    }

    if (path.endsWith('/reportes/sanitario')) {
      calls.sanitario += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          tipo: 'sanitario',
          periodo: { fechaInicio: '2026-03-01', fechaFin: '2026-03-31' },
          resumen: { totalRegistros: 1, aprobados: 1, rechazados: 0, pendientes: 0 },
          registros: [
            {
              idEvento: 501,
              idAnimal: 11,
              idTipoEvento: 1,
              fechaEvento: '2026-03-10',
              diagnostico: 'Aplicacion preventiva',
              medicamento: 'Ivermectina',
              dosis: '3 ml',
              estadoAprobacion: 'APROBADO',
              autorizadoPor: 1,
              animal: { idAnimal: 11, numeroArete: 'MX-REP-001' },
              tipoEvento: { idTipoEvento: 1, nombreTipo: 'Vacuna' },
            },
          ],
        })),
      });
      return;
    }

    if (path.endsWith('/reportes/productivo')) {
      calls.productivo += 1;

      if (mode === 'forbidden-productivo') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            data: null,
            message: 'No autorizado',
            errors: [],
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          tipo: 'productivo',
          periodo: { fechaInicio: '2026-03-01', fechaFin: '2026-03-31' },
          resumen: {
            totalRegistrosPeso: 1,
            promedioPesoKg: 245.4,
            totalRegistrosLeche: 1,
            totalLitrosLeche: 22.7,
            totalEventosReproductivos: 1,
            tasaNatalidadPorcentaje: 12.5,
          },
          registrosPeso: [
            {
              idRegistroPeso: 801,
              idAnimal: 11,
              idLote: 91,
              peso: 245.4,
              fechaRegistro: '2026-03-12',
              estadoValidacion: 'APROBADO',
              animal: { idAnimal: 11, numeroArete: 'MX-REP-001' },
            },
          ],
          produccionLeche: [
            {
              idProduccion: 901,
              idAnimal: 11,
              idLote: 91,
              litrosProducidos: 22.7,
              fechaRegistro: '2026-03-12',
              estadoValidacion: 'APROBADO',
              animal: { idAnimal: 11, numeroArete: 'MX-REP-001' },
            },
          ],
          eventosReproductivos: [
            {
              idEventoReproductivo: 777,
              idAnimal: 11,
              idLote: 91,
              tipoEvento: 'PARTO',
              fechaEvento: '2026-03-20',
              observaciones: null,
              estadoValidacion: 'APROBADO',
              animal: { idAnimal: 11, numeroArete: 'MX-REP-001' },
            },
          ],
        })),
      });
      return;
    }

    if (path.endsWith('/reportes/administrativo')) {
      calls.administrativo += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          tipo: 'administrativo',
          periodo: { fechaInicio: '2026-03-01', fechaFin: '2026-03-31' },
          resumen: {
            totalSolicitudes: 2,
            totalCompras: 1,
            montoCompras: 1300,
            totalMovimientosInventario: 4,
          },
          solicitudes: [],
          compras: [
            {
              idCompra: 700,
              idSolicitud: 333,
              fechaCompra: '2026-03-25',
              totalReal: 1300,
              realizador: { idUsuario: 1, nombreCompleto: 'Admin SIGGAB' },
              detalles: [],
            },
          ],
          movimientos: [],
          inventarioActual: [
            {
              idInsumo: 44,
              nombreInsumo: 'Sales minerales',
              unidadMedida: 'kg',
              stockActual: 50,
              tipoInsumo: { idTipoInsumo: 5, nombreTipo: 'Alimento' },
            },
          ],
        })),
      });
      return;
    }

    if (path.endsWith('/reportes/comparativo')) {
      calls.comparativo += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          tipo: 'comparativo',
          modulo: 'productivo',
          periodoA: { totalRegistrosPeso: 10 },
          periodoB: { totalRegistrosPeso: 12 },
          variacion: { totalRegistrosPeso: { delta: 2, porcentaje: 20 } },
        })),
      });
      return;
    }

    await route.continue();
  });

  return calls;
}

test('Reportes: consume endpoints JSON por modulo y renderiza resultados', async ({ page }) => {
  await loginAsAdmin(page);
  const calls = await mockReportesEndpoints(page, 'success');

  await page.goto('/#/app/reportes');
  await expect(page.getByTestId('reportes-header')).toBeVisible();

  await page.getByRole('button', { name: 'Generar' }).click();
  await expect(page.getByText('MX-REP-001')).toBeVisible();
  await expect.poll(() => calls.sanitario).toBeGreaterThan(0);

  await page.getByTestId('reportes-tab-productivo').click();
  await page.getByRole('button', { name: 'Generar' }).click();
  await expect(page.getByRole('cell', { name: 'PESO' })).toBeVisible();
  await expect.poll(() => calls.productivo).toBeGreaterThan(0);

  await page.getByTestId('reportes-tab-administrativo').click();
  await page.getByRole('button', { name: 'Generar' }).click();
  await expect(page.getByText('#700')).toBeVisible();
  await expect.poll(() => calls.administrativo).toBeGreaterThan(0);

  await page.getByTestId('reportes-tab-comparativo').click();
  await page.getByRole('button', { name: 'Generar' }).click();
  await expect(page.getByText('totalRegistrosPeso')).toBeVisible();
  await expect.poll(() => calls.comparativo).toBeGreaterThan(0);

  await expect.poll(() => calls.tipos).toBeGreaterThan(0);
  await expect.poll(() => calls.animales).toBeGreaterThan(0);
  await expect.poll(() => calls.lotes).toBeGreaterThan(0);
});

test('Reportes: muestra error cuando reporte productivo responde 403', async ({ page }) => {
  await loginAsAdmin(page);
  const calls = await mockReportesEndpoints(page, 'forbidden-productivo');

  await page.goto('/#/app/reportes');
  await expect(page.getByTestId('reportes-header')).toBeVisible();

  await page.getByTestId('reportes-tab-productivo').click();
  await page.getByRole('button', { name: 'Generar' }).click();

  await expect(page.getByText('No tienes permisos para consultar este reporte.')).toBeVisible();
  await expect.poll(() => calls.productivo).toBeGreaterThan(0);
});
