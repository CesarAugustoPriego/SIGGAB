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

async function mockDashboardEndpoints(page: Page, mode: 'success' | 'forbidden-resumen') {
  const calls = {
    resumen: 0,
    ganado: 0,
    produccion: 0,
    sanitario: 0,
    inventario: 0,
    bitacora: 0,
  };

  await page.route('**/api/dashboard/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path.endsWith('/dashboard/resumen')) {
      calls.resumen += 1;
      if (mode === 'forbidden-resumen') {
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
          totalAnimalesActivos: 120,
          vacunacionesMes: 15,
          pesosPendientesValidar: 4,
          alertasProximas7Dias: 2,
          solicitudesCompraPendientes: 3,
          insumosStockAgotado: 1,
          inventarioTotalItems: 22,
          inventarioTotalUnidades: 987.5,
          generadoEn: '2026-04-03T10:00:00.000Z',
        })),
      });
      return;
    }

    if (path.endsWith('/dashboard/ganado')) {
      calls.ganado += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          porEstado: [
            { estadoActual: 'ACTIVO', _count: { idAnimal: 100 } },
            { estadoActual: 'VENDIDO', _count: { idAnimal: 20 } },
          ],
          porRaza: [
            { idRaza: 1, nombreRaza: 'Holstein', _count: { idAnimal: 65 } },
            { idRaza: 2, nombreRaza: 'Simmental', _count: { idAnimal: 35 } },
          ],
          recienIngresados: [
            {
              idAnimal: 501,
              numeroArete: 'MX-DASH-501',
              nombre: 'Luna',
              fechaIngreso: '2026-04-01',
              raza: { nombreRaza: 'Holstein' },
            },
          ],
        })),
      });
      return;
    }

    if (path.endsWith('/dashboard/produccion')) {
      calls.produccion += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          peso: { gananciaPromedioKg: 14.5, totalRegistros: 40 },
          leche: { totalLitros: 1450, promedioLitros: 22.4, totalRegistros: 64 },
          eventosReproductivos: [{ tipoEvento: 'PARTO', _count: { idEventoReproductivo: 5 } }],
          tasas: {
            natalidadPorcentaje: 4.1,
            mortalidadPorcentaje: 1.2,
            partosPeriodo: 5,
            muertesPeriodo: 1,
          },
          periodo: '30 dias',
        })),
      });
      return;
    }

    if (path.endsWith('/dashboard/sanitario')) {
      calls.sanitario += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          proximosEventos: [
            {
              idCalendario: 301,
              fechaProgramada: '2026-04-07',
              estado: 'PENDIENTE',
              animal: { idAnimal: 501, numeroArete: 'MX-DASH-501' },
              tipoEvento: { nombreTipo: 'Vacuna' },
            },
          ],
          pendientesAprobacion: [],
        })),
      });
      return;
    }

    if (path.endsWith('/dashboard/inventario')) {
      calls.inventario += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          agotados: [],
          bajoStock: [
            {
              idInsumo: 88,
              nombreInsumo: 'Sales minerales',
              stockActual: 7,
              unidadMedida: 'kg',
              tipoInsumo: { nombreTipo: 'Alimento' },
            },
          ],
          movimientosRecientes: [],
        })),
      });
      return;
    }

    if (path.endsWith('/dashboard/bitacora')) {
      calls.bitacora += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope([
          {
            idBitacora: 9001,
            idUsuario: 1,
            accion: 'LOGIN',
            tablaAfectada: 'usuarios',
            idRegistro: 1,
            fechaHora: '2026-04-03T09:58:00.000Z',
            detalles: null,
            usuario: {
              idUsuario: 1,
              nombreCompleto: 'Administrador del Sistema',
              username: 'admin',
            },
          },
        ])),
      });
      return;
    }

    await route.continue();
  });

  return calls;
}

test('Dashboard: consume endpoints y renderiza paneles por rol Admin', async ({ page }) => {
  await loginAsAdmin(page);
  const calls = await mockDashboardEndpoints(page, 'success');

  await page.goto('/#/app/dashboard');
  await expect(page.getByTestId('dashboard-header')).toBeVisible();
  await expect(page.getByTestId('kpi-card-0')).toContainText('Animales activos');
  await expect(page.getByTestId('kpi-card-0')).toContainText('120');
  await expect(page.getByTestId('dash-ganado')).toBeVisible();
  await expect(page.getByTestId('dash-produccion')).toBeVisible();
  await expect(page.getByTestId('dash-sanitario')).toBeVisible();
  await expect(page.getByTestId('dash-inventario')).toBeVisible();
  await expect(page.getByTestId('dash-bitacora')).toBeVisible();

  await expect.poll(() => calls.resumen).toBeGreaterThan(0);
  await expect.poll(() => calls.ganado).toBeGreaterThan(0);
  await expect.poll(() => calls.produccion).toBeGreaterThan(0);
  await expect.poll(() => calls.sanitario).toBeGreaterThan(0);
  await expect.poll(() => calls.inventario).toBeGreaterThan(0);
  await expect.poll(() => calls.bitacora).toBeGreaterThan(0);
});

test('Dashboard: muestra mensaje cuando /dashboard/resumen responde 403', async ({ page }) => {
  await loginAsAdmin(page);
  await mockDashboardEndpoints(page, 'forbidden-resumen');

  await page.goto('/#/app/dashboard');
  await expect(page.getByTestId('dashboard-header')).toBeVisible();
  await expect(page.getByTestId('dashboard-error')).toContainText('No tienes permisos para esta seccion.');
});
