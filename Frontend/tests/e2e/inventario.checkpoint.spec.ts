import { expect, test } from '@playwright/test';
import {
  buildUniqueUser,
  login,
  loginAsAdmin,
  logoutFromUsersPage,
  openUsersAdminPage,
} from './helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openInventarioPage(page: import('@playwright/test').Page) {
  await page.goto('/#/app/inventario');
  await expect(page.getByTestId('inventario-admin-header')).toBeVisible();
}

async function selectAlmacenRole(page: import('@playwright/test').Page) {
  const select = page.getByTestId('users-form-id-rol');
  const options = select.locator('option');
  const count = await options.count();

  for (let i = 0; i < count; i++) {
    const text = await options.nth(i).textContent();
    if (text && text.toLowerCase().includes('almac')) {
      await select.selectOption({ index: i });
      return true;
    }
  }
  return false;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Módulo Inventario', () => {

  test('Navegación: acceso desde pantalla principal', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/#/app');
    await expect(page.getByTestId('session-inventario-button')).toBeVisible();
    await page.getByTestId('session-inventario-button').click();
    await expect(page).toHaveURL(/#\/app\/inventario$/);
    await expect(page.getByTestId('inventario-admin-header')).toBeVisible();
  });

  test('Tabs: todas las pestañas visibles para Admin', async ({ page }) => {
    await loginAsAdmin(page);
    await openInventarioPage(page);

    await expect(page.getByTestId('tab-insumos')).toBeVisible();
    await expect(page.getByTestId('tab-tipos')).toBeVisible();
    await expect(page.getByTestId('tab-movimientos')).toBeVisible();
    await expect(page.getByTestId('tab-solicitudes')).toBeVisible();
    await expect(page.getByTestId('tab-compras')).toBeVisible();
  });

  test('Tipos: crear tipo de insumo (Admin)', async ({ page }) => {
    await loginAsAdmin(page);
    await openInventarioPage(page);

    await page.getByTestId('tab-tipos').click();
    await expect(page.getByTestId('tipo-nombre')).toBeVisible();

    const tipoName = `TestTipo-${Date.now()}`;
    await page.getByTestId('tipo-nombre').fill(tipoName);
    await page.getByTestId('tipo-desc').fill('Tipo creado por test automatizado');
    await page.getByTestId('btn-guardar-tipo').click();

    await expect(page.getByTestId('inventario-message')).toContainText(/creado|tipo/i);
  });

  test('Insumos: registrar nuevo insumo', async ({ page }) => {
    await loginAsAdmin(page);
    await openInventarioPage(page);

    // Primero crear un tipo para poder asignarlo
    await page.getByTestId('tab-tipos').click();
    await expect(page.getByTestId('tipo-nombre')).toBeVisible();
    const tipoName = `QATipo-${Date.now()}`;
    await page.getByTestId('tipo-nombre').fill(tipoName);
    await page.getByTestId('btn-guardar-tipo').click();
    await expect(page.getByTestId('inventario-message')).toContainText(/creado|tipo/i);

    // Ir a tab insumos
    await page.getByTestId('tab-insumos').click();
    await expect(page.getByTestId('insumo-nombre')).toBeVisible();

    await page.getByTestId('insumo-nombre').fill(`Insumo QA ${Date.now()}`);

    // Seleccionar tipo recién creado
    const tipoSelect = page.getByTestId('insumo-tipo');
    const tipoOptions = tipoSelect.locator('option');
    const count = await tipoOptions.count();
    if (count >= 2) {
      await tipoSelect.selectOption({ index: count - 1 }); // último = recién creado
    }

    await page.getByTestId('insumo-unidad').fill('ml');
    await page.getByTestId('insumo-stock').fill('100');
    await page.getByTestId('insumo-desc').fill('Insumo de test');
    await page.getByTestId('btn-guardar-insumo').click();

    await expect(page.getByTestId('inventario-message')).toContainText(/registrad|insumo/i);
  });

  test('Movimientos: registrar salida de inventario', async ({ page }) => {
    await loginAsAdmin(page);
    await openInventarioPage(page);

    await page.getByTestId('tab-movimientos').click();
    await expect(page.getByTestId('mov-insumo')).toBeVisible();

    const insumoSelect = page.getByTestId('mov-insumo');
    const insumoOptions = await insumoSelect.locator('option').count();

    if (insumoOptions >= 2) {
      await insumoSelect.selectOption({ index: 1 });
      await page.getByTestId('mov-tipo').selectOption('SALIDA');
      await page.getByTestId('mov-cantidad').fill('5');
      await page.getByTestId('mov-fecha').fill('2026-04-01');
      await page.getByTestId('btn-guardar-mov').click();

      await expect(page.getByTestId('inventario-message')).toContainText(/registrad|movimiento|stock/i);
    }
  });

  test('Solicitudes: flujo completo (solo Almacén crea)', async ({ page }) => {
    await loginAsAdmin(page);

    // Crear usuario Almacén
    await openUsersAdminPage(page);
    const almUser = buildUniqueUser('almacen_inv');
    await page.getByTestId('users-form-nombre-completo').fill(almUser.nombreCompleto);
    await page.getByTestId('users-form-username').fill(almUser.username);
    const found = await selectAlmacenRole(page);
    if (!found) {
      // Si no hay rol Almacén, skip gracefully
      test.skip();
      return;
    }
    await page.getByTestId('users-form-password').fill(almUser.password);
    await page.getByTestId('users-form-save-button').click();
    await expect(page.getByTestId('users-form-message')).toContainText('Usuario creado');

    await logoutFromUsersPage(page);

    // Login como Almacén
    await login(page, almUser.username, almUser.password);
    await expect(page).toHaveURL(/#\/app$/);

    // Navegar a inventario
    await page.getByTestId('session-inventario-button').click();
    await expect(page).toHaveURL(/#\/app\/inventario$/);

    // Tab solicitudes
    await page.getByTestId('tab-solicitudes').click();
    await expect(page.getByTestId('sol-fecha')).toBeVisible();

    // Llenar formulario de solicitud
    await page.getByTestId('sol-fecha').fill('2026-04-01');
    await page.getByTestId('sol-obs').fill('Solicitud automática de test');

    // Agregar detalle
    await page.getByTestId('btn-add-sol-detalle').click();
    const detInsumoSelect = page.getByTestId('sol-det-insumo-0');
    const detOptions = await detInsumoSelect.locator('option').count();
    if (detOptions >= 2) {
      await detInsumoSelect.selectOption({ index: 1 });
      await page.getByTestId('sol-det-cant-0').fill('50');
      await page.getByTestId('sol-det-precio-0').fill('12.5');

      await page.getByTestId('btn-crear-solicitud').click();
      await expect(page.getByTestId('inventario-message')).toContainText(/creada|solicitud|pendiente/i);
    }
  });

  test('Sidebar: navegar entre módulos', async ({ page }) => {
    await loginAsAdmin(page);
    await openInventarioPage(page);

    // Navegar a Ganado desde sidebar
    await page.getByTestId('inventario-nav-ganado').click();
    await expect(page).toHaveURL(/#\/app\/ganado$/);

    // Volver a Inventario
    await page.getByTestId('ganado-nav-inventario').click();
    await expect(page).toHaveURL(/#\/app\/inventario$/);
  });

  test('Permisos: Producción no ve botón inventario', async ({ page }) => {
    await loginAsAdmin(page);

    // Crear usuario Producción
    await openUsersAdminPage(page);
    const prodUser = buildUniqueUser('prod_inv');
    await page.getByTestId('users-form-nombre-completo').fill(prodUser.nombreCompleto);
    await page.getByTestId('users-form-username').fill(prodUser.username);

    const rolSelect = page.getByTestId('users-form-id-rol');
    const rolOptions = rolSelect.locator('option');
    const rolCount = await rolOptions.count();
    let prodFound = false;
    for (let i = 0; i < rolCount; i++) {
      const text = await rolOptions.nth(i).textContent();
      if (text && text.toLowerCase().includes('produc')) {
        await rolSelect.selectOption({ index: i });
        prodFound = true;
        break;
      }
    }
    if (!prodFound && rolCount >= 3) {
      await rolSelect.selectOption({ index: 2 });
    }

    await page.getByTestId('users-form-password').fill(prodUser.password);
    await page.getByTestId('users-form-save-button').click();
    await expect(page.getByTestId('users-form-message')).toContainText('Usuario creado');

    await logoutFromUsersPage(page);

    await login(page, prodUser.username, prodUser.password);
    await expect(page).toHaveURL(/#\/app$/);

    // Verificar que NO ve botón de inventario
    const inventarioBtn = page.getByTestId('session-inventario-button');
    await expect(inventarioBtn).toHaveCount(0);
  });
});
