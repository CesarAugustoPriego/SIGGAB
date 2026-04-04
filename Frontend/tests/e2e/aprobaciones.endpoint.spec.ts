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

async function mockAprobacionesEndpoints(page: Page, mode: 'filled' | 'empty') {
  const calls = {
    sanitario: 0,
    peso: 0,
    leche: 0,
    repro: 0,
    compra: 0,
  };

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    
    // Sanitario
    if (path.endsWith('/eventos-sanitarios')) {
      if (url.searchParams.get('estado') === 'PENDIENTE') {
        calls.sanitario += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(apiEnvelope(mode === 'filled' ? [
            { idEvento: 201, fechaEvento: '2026-04-03', diagnostico: 'Mastitis leve', medicamento: 'Penicilina', dosis: '10ml', estadoAprobacion: 'PENDIENTE', animal: { numeroArete: 'MX-001' }, tipoEvento: { nombreTipo: 'Tratamiento' } }
          ] : [])),
        });
        return;
      }
    }

    // Productivo - Peso
    if (path.endsWith('/registros-peso')) {
      if (url.searchParams.get('estado') === 'PENDIENTE') {
        calls.peso += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(apiEnvelope(mode === 'filled' ? [
            { idRegistroPeso: 101, peso: 450.5, fechaRegistro: '2026-04-03', idLote: 1, animal: { numeroArete: 'MX-002' } }
          ] : [])),
        });
        return;
      }
    }

    // Productivo - Leche
    if (path.endsWith('/produccion-leche')) {
      if (url.searchParams.get('estado') === 'PENDIENTE') {
        calls.leche += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(apiEnvelope(mode === 'filled' ? [
            { idProduccion: 55, litrosProducidos: 22.4, fechaRegistro: '2026-04-03', idLote: 1, animal: { numeroArete: 'MX-003' } }
          ] : [])),
        });
        return;
      }
    }

    // Productivo - Reproductivo
    if (path.endsWith('/eventos-reproductivos')) {
      if (url.searchParams.get('estado') === 'PENDIENTE') {
        calls.repro += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(apiEnvelope(mode === 'filled' ? [
            { idEventoReproductivo: 12, tipoEvento: 'PARTO', observaciones: 'Parto gemelar', fechaEvento: '2026-04-03', idLote: 1, animal: { numeroArete: 'MX-004' } }
          ] : [])),
        });
        return;
      }
    }

    // Inventario - Compras
    if (path.endsWith('/solicitudes-compra')) {
      if (url.searchParams.get('estado') === 'PENDIENTE') {
        calls.compra += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(apiEnvelope(mode === 'filled' ? [
            { idSolicitud: 10, fechaSolicitud: '2026-04-03', observaciones: 'Urgente', detalles: [{}, {}], solicitante: { nombreCompleto: 'Juan Perez' } }
          ] : [])),
        });
        return;
      }
    }

    await route.continue();
  });

  return calls;
}

test('Aprobaciones: consume endpoints y renderiza todos los pendientes', async ({ page }) => {
  await loginAsAdmin(page);
  await mockAprobacionesEndpoints(page, 'filled');

  await page.goto('/#/app/aprobaciones');
  await expect(page.getByTestId('aprobaciones-header')).toBeVisible();

  // Tabs should display items
  await expect(page.locator('.productivo-tab', { hasText: 'Sanitarios' })).toHaveCount(0);
  await expect(page.locator('.productivo-tab', { hasText: 'Productivos' })).toBeVisible();
  await expect(page.locator('.productivo-tab', { hasText: 'Compras' })).toBeVisible();

  // Content should contain specific mocked text without brittle exact spacing
  await expect(page.getByText('450.5 kg')).toBeVisible(); 
  await expect(page.getByText('22.4 L')).toBeVisible(); 
  await expect(page.locator('.productivo-tipo').filter({ hasText: /^PARTO$/ })).toBeVisible();
  await expect(page.getByText('Urgente')).toBeVisible(); 
});

test('Aprobaciones: renderiza estado vacío cuando no hay pendientes', async ({ page }) => {
  await loginAsAdmin(page);
  const calls = await mockAprobacionesEndpoints(page, 'empty');

  await page.goto('/#/app/aprobaciones');
  await expect(page.getByTestId('aprobaciones-header')).toBeVisible();
  
  await expect.poll(() => calls.peso).toBeGreaterThan(0);
  await expect.poll(() => calls.compra).toBeGreaterThan(0);

  await expect(page.getByText('Todo al día')).toBeVisible();
  await expect(page.getByText('No hay registros pendientes de aprobación.')).toBeVisible();
});
