import { expect, test } from '@playwright/test';
import {
  buildUniqueAnimal,
  buildUniqueUser,
  login,
  loginAsAdmin,
  logoutFromUsersPage,
  openUsersAdminPage,
} from './helpers';

// ─── Helper: Abrir página de producción ───────────────────────────────────────

async function openProductivoPage(page: import('@playwright/test').Page) {
  await page.goto('/#/app/productivo');
  await expect(page.getByTestId('productivo-admin-header')).toBeVisible();
}

// ─── Helper: Registrar animal rápido desde Ganado ──────────────────────────

async function registerAnimalForProductivo(page: import('@playwright/test').Page, arete: string) {
  await page.goto('/#/app/ganado');
  await expect(page.getByTestId('ganado-admin-header')).toBeVisible();

  await page.getByTestId('input-arete').fill(arete);
  await page.getByTestId('input-fecha').fill('2026-04-01');
  await page.getByTestId('input-peso').fill('300');
  await page.getByTestId('input-edad').fill('24');

  const razaSelect = page.getByTestId('select-raza');
  const optionCount = await razaSelect.locator('option').count();
  if (optionCount >= 2) {
    await razaSelect.selectOption({ index: 1 });
  }

  await page.getByTestId('input-procedencia').fill('Rancho Productivo QA');
  await page.getByTestId('input-sanitario').fill('Sano al ingreso para test productivo');
  await page.getByTestId('btn-submit').click();
  await expect(page.getByTestId('ganado-form-message')).toContainText('registrado correctamente');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Módulo Productivo', () => {

  test('Navegación: acceso desde pantalla principal', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/#/app');
    await expect(page.getByTestId('session-productivo-button')).toBeVisible();
    await page.getByTestId('session-productivo-button').click();
    await expect(page).toHaveURL(/#\/app\/productivo$/);
    await expect(page.getByTestId('productivo-admin-header')).toBeVisible();
  });

  test('Tabs: todas las pestañas visibles para Admin', async ({ page }) => {
    await loginAsAdmin(page);
    await openProductivoPage(page);

    await expect(page.getByTestId('tab-lotes')).toBeVisible();
    await expect(page.getByTestId('tab-peso')).toBeVisible();
    await expect(page.getByTestId('tab-leche')).toBeVisible();
    await expect(page.getByTestId('tab-reproductivo')).toBeVisible();
  });

  test('Lotes: crear lote de validación', async ({ page }) => {
    await loginAsAdmin(page);
    await openProductivoPage(page);

    // Debería estar en tab lotes por defecto
    await expect(page.getByTestId('lote-fecha-inicio')).toBeVisible();

    await page.getByTestId('lote-fecha-inicio').fill('2026-04-01');
    await page.getByTestId('lote-fecha-fin').fill('2026-04-30');
    await page.getByTestId('btn-crear-lote').click();

    await expect(page.getByTestId('productivo-message')).toContainText('Lote creado');
  });

  test('Peso: registrar peso de animal', async ({ page }) => {
    await loginAsAdmin(page);

    // Primero crear un animal
    const animal = buildUniqueAnimal('prodpeso');
    await registerAnimalForProductivo(page, animal.numeroArete);

    // Ir a productivo
    await openProductivoPage(page);

    // Crear lote
    await page.getByTestId('lote-fecha-inicio').fill('2026-03-01');
    await page.getByTestId('lote-fecha-fin').fill('2026-03-31');
    await page.getByTestId('btn-crear-lote').click();
    await expect(page.getByTestId('productivo-message')).toContainText('Lote creado');

    // Cambiar a tab peso
    await page.getByTestId('tab-peso').click();
    await expect(page.getByTestId('peso-animal')).toBeVisible();

    // Seleccionar animal (buscar por arete en el select)
    const animalSelect = page.getByTestId('peso-animal');
    const animalOptions = animalSelect.locator('option');
    const count = await animalOptions.count();

    // Buscar la opción que contiene el arete
    let animalOptionFound = false;
    for (let i = 0; i < count; i++) {
      const text = await animalOptions.nth(i).textContent();
      if (text && text.includes(animal.numeroArete)) {
        await animalSelect.selectOption({ index: i });
        animalOptionFound = true;
        break;
      }
    }

    if (animalOptionFound) {
      // Seleccionar lote (el primero disponible)
      const loteSelect = page.getByTestId('peso-lote');
      const loteOptions = await loteSelect.locator('option').count();
      if (loteOptions >= 2) {
        await loteSelect.selectOption({ index: 1 });
      }

      await page.getByTestId('peso-kg').fill('285');
      await page.getByTestId('peso-fecha').fill('2026-03-15');
      await page.getByTestId('btn-guardar-peso').click();
      await expect(page.getByTestId('productivo-message')).toContainText(/registrad|pendiente/i);
    }
  });

  test('Leche: registrar producción de leche', async ({ page }) => {
    await loginAsAdmin(page);

    const animal = buildUniqueAnimal('prodleche');
    await registerAnimalForProductivo(page, animal.numeroArete);

    await openProductivoPage(page);

    // Crear lote
    await page.getByTestId('lote-fecha-inicio').fill('2026-02-01');
    await page.getByTestId('lote-fecha-fin').fill('2026-02-28');
    await page.getByTestId('btn-crear-lote').click();
    await expect(page.getByTestId('productivo-message')).toContainText('Lote creado');

    // Tab leche
    await page.getByTestId('tab-leche').click();
    await expect(page.getByTestId('leche-animal')).toBeVisible();

    const animalSelect = page.getByTestId('leche-animal');
    const animalOptions = animalSelect.locator('option');
    const count = await animalOptions.count();

    let found = false;
    for (let i = 0; i < count; i++) {
      const text = await animalOptions.nth(i).textContent();
      if (text && text.includes(animal.numeroArete)) {
        await animalSelect.selectOption({ index: i });
        found = true;
        break;
      }
    }

    if (found) {
      const loteSelect = page.getByTestId('leche-lote');
      const loteOpts = await loteSelect.locator('option').count();
      if (loteOpts >= 2) {
        await loteSelect.selectOption({ index: 1 });
      }

      await page.getByTestId('leche-litros').fill('22.5');
      await page.getByTestId('leche-fecha').fill('2026-02-15');
      await page.getByTestId('btn-guardar-leche').click();
      await expect(page.getByTestId('productivo-message')).toContainText(/registrad|pendiente/i);
    }
  });

  test('Reproductivo: registrar evento reproductivo', async ({ page }) => {
    await loginAsAdmin(page);

    const animal = buildUniqueAnimal('prodrepro');
    await registerAnimalForProductivo(page, animal.numeroArete);

    await openProductivoPage(page);

    // Crear lote
    await page.getByTestId('lote-fecha-inicio').fill('2026-01-01');
    await page.getByTestId('lote-fecha-fin').fill('2026-01-31');
    await page.getByTestId('btn-crear-lote').click();
    await expect(page.getByTestId('productivo-message')).toContainText('Lote creado');

    // Tab reproductivo
    await page.getByTestId('tab-reproductivo').click();
    await expect(page.getByTestId('evento-animal')).toBeVisible();

    const animalSelect = page.getByTestId('evento-animal');
    const animalOptions = animalSelect.locator('option');
    const count = await animalOptions.count();

    let found = false;
    for (let i = 0; i < count; i++) {
      const text = await animalOptions.nth(i).textContent();
      if (text && text.includes(animal.numeroArete)) {
        await animalSelect.selectOption({ index: i });
        found = true;
        break;
      }
    }

    if (found) {
      const loteSelect = page.getByTestId('evento-lote');
      const loteOpts = await loteSelect.locator('option').count();
      if (loteOpts >= 2) {
        await loteSelect.selectOption({ index: 1 });
      }

      await page.getByTestId('evento-tipo').selectOption('PARTO');
      await page.getByTestId('evento-fecha').fill('2026-01-20');
      await page.getByTestId('evento-obs').fill('Parto sin complicaciones — test automatizado');
      await page.getByTestId('btn-guardar-evento').click();
      await expect(page.getByTestId('productivo-message')).toContainText(/registrad|pendiente/i);
    }
  });

  test('Sidebar: navegar entre módulos', async ({ page }) => {
    await loginAsAdmin(page);
    await openProductivoPage(page);

    // Navegar a Ganado desde sidebar
    await page.getByTestId('productivo-nav-ganado').click();
    await expect(page).toHaveURL(/#\/app\/ganado$/);

    // Volver a Produccion
    await page.getByTestId('ganado-nav-produccion').click();
    await expect(page).toHaveURL(/#\/app\/productivo$/);
  });

  test('Permisos: usuario sin acceso no ve pantalla', async ({ page }) => {
    await loginAsAdmin(page);

    // Crear usuario Almacén (no tiene acceso a productivo)
    await openUsersAdminPage(page);
    const user = buildUniqueUser('almacen_prod');
    await page.getByTestId('users-form-nombre-completo').fill(user.nombreCompleto);
    await page.getByTestId('users-form-username').fill(user.username);

    // Seleccionar rol Almacén
    const rolSelect = page.getByTestId('users-form-id-rol');
    const rolOptions = rolSelect.locator('option');
    const rolCount = await rolOptions.count();
    let almacenFound = false;
    for (let i = 0; i < rolCount; i++) {
      const text = await rolOptions.nth(i).textContent();
      if (text && text.toLowerCase().includes('almac')) {
        await rolSelect.selectOption({ index: i });
        almacenFound = true;
        break;
      }
    }

    if (!almacenFound && rolCount >= 2) {
      // Fallback: seleccionar cualquier rol no admin
      await rolSelect.selectOption({ index: rolCount - 1 });
    }

    await page.getByTestId('users-form-password').fill(user.password);
    await page.getByTestId('users-form-save-button').click();
    await expect(page.getByTestId('users-form-message')).toContainText('Usuario creado');

    await logoutFromUsersPage(page);

    await login(page, user.username, user.password);
    await expect(page).toHaveURL(/#\/app$/);

    // Verificar que NO ve botón de productivo en home
    // (Almacén no tiene acceso según canViewProductivo)
    const productivoBtn = page.getByTestId('session-productivo-button');
    await expect(productivoBtn).toHaveCount(0);
  });
});
