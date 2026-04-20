import { expect, type Page, test } from '@playwright/test';
import {
  buildUniqueAnimal,
  buildUniqueUser,
  login,
  loginAsAdmin,
  logoutFromUsersPage,
  openGanadoPage,
  openUsersAdminPage,
} from './helpers';

async function selectAnyRaza(page: Page) {
  const select = page.getByTestId('select-raza');
  const options = await select.locator('option').count();
  if (options < 2) {
    throw new Error('No hay razas disponibles para registrar ganado.');
  }
  await select.selectOption({ index: 1 });
}

async function registerAnimal(page: Page, numeroArete: string, procedencia: string) {
  await page.getByTestId('input-arete').fill(numeroArete);
  await page.getByTestId('input-fecha').fill('2026-04-01');
  await page.getByTestId('input-peso').fill('250');
  await page.getByTestId('input-edad').fill('18');
  await selectAnyRaza(page);
  await page.getByTestId('select-sexo').selectOption('HEMBRA');
  await page.getByTestId('input-procedencia').selectOption('ADQUIRIDA');
  await page.getByTestId('input-sanitario').fill('Sin hallazgos relevantes al ingreso.');
  await page.getByTestId('btn-submit').click();
}

async function selectGanadoNonAdminRole(page: Page) {
  const select = page.getByTestId('users-form-id-rol');
  const selected = await select.evaluate((el) => {
    const normalize = (value: string) => value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const options = Array.from((el as HTMLSelectElement).options)
      .filter((option) => option.value)
      .map((option) => ({
        value: option.value,
        label: option.textContent?.trim() || '',
        normalized: normalize(option.textContent || ''),
      }));

    const prioridad = [
      'campo',
      'produccion',
      'medico veterinario',
      'propietario',
    ];

    for (const roleName of prioridad) {
      const match = options.find((option) => option.normalized.includes(roleName));
      if (match) return { value: match.value, label: match.label };
    }

    return null;
  });

  if (!selected) {
    throw new Error('No se encontro rol no-admin con acceso esperado a Ganado.');
  }

  await select.selectOption(selected.value);
  return selected.label;
}

test.describe('Checkpoint Ganado', () => {
  test('RF03: registrar animal con arete unico', async ({ page }) => {
    await loginAsAdmin(page);
    await openGanadoPage(page);

    const animal = buildUniqueAnimal('alta');
    await registerAnimal(page, animal.numeroArete, animal.procedencia);

    await expect(page.getByTestId('ganado-form-message')).toContainText('Animal registrado correctamente.');
    await expect(page.getByTestId(`card-${animal.numeroArete}`)).toBeVisible();
  });

  test('RF15 + RN08: editar y dar de baja animal', async ({ page }) => {
    await loginAsAdmin(page);
    await openGanadoPage(page);

    const animal = buildUniqueAnimal('baja');
    await registerAnimal(page, animal.numeroArete, animal.procedencia);
    await expect(page.getByTestId(`card-${animal.numeroArete}`)).toBeVisible();

    await page.getByTestId(`btn-editar-${animal.numeroArete}`).click();
    const procedenciaActualizada = 'NACIDA';
    await page.getByTestId('input-procedencia').selectOption(procedenciaActualizada);
    await page.getByTestId('btn-submit').click();
    await expect(page.getByTestId('ganado-form-message')).toContainText('Animal actualizado correctamente.');
    await expect(page.getByTestId(`card-${animal.numeroArete}`)).toContainText('Nacida en rancho');

    await page.getByTestId(`btn-baja-${animal.numeroArete}`).click();
    await page.getByTestId('select-motivo').selectOption('MUERTO');
    await page.getByTestId('input-baja-motivo').fill('Baja de prueba automatizada.');
    await page.getByTestId('input-baja-fecha').fill('2026-04-01');
    await page.getByTestId('btn-confirmar-baja').click();
    await expect(page.getByTestId('ganado-form-message')).toContainText('dado de baja');

    await expect(page.getByTestId(`card-${animal.numeroArete}`)).not.toBeVisible();
    await page.getByTestId('filter-estado').selectOption('MUERTO');
    await expect(page.getByTestId(`card-${animal.numeroArete}`)).toBeVisible();
    await expect(page.getByTestId(`card-${animal.numeroArete}`)).toContainText('MUERTO');
  });

  test('RF04 web: busqueda por arete y ver historial', async ({ page }) => {
    await loginAsAdmin(page);
    await openGanadoPage(page);

    const animal = buildUniqueAnimal('hist');
    await registerAnimal(page, animal.numeroArete, animal.procedencia);

    await page.getByTestId('input-buscar-arete').fill(animal.numeroArete);
    await page.getByTestId('btn-buscar').click();
    await expect(page.locator('.ganado-search-result').getByText(animal.numeroArete)).toBeVisible();
    await page.getByRole('button', { name: 'Ver historial' }).click();
    await expect(page.getByRole('heading', { name: 'Historial por arete' })).toBeVisible();
  });

  test('RF03: rechaza numero de arete duplicado', async ({ page }) => {
    await loginAsAdmin(page);
    await openGanadoPage(page);

    const animal = buildUniqueAnimal('dup');
    await registerAnimal(page, animal.numeroArete, animal.procedencia);
    await expect(page.getByTestId('ganado-form-message')).toContainText('registrado correctamente');

    await registerAnimal(page, animal.numeroArete, animal.procedencia);
    await expect(page.getByTestId('ganado-form-message')).toContainText(/arete|existe|registrado/i);
    await expect(page.getByTestId(`card-${animal.numeroArete}`)).toHaveCount(1);
  });

  test('Permisos: usuario no admin no puede editar ni dar baja', async ({ page }) => {
    await loginAsAdmin(page);
    await openGanadoPage(page);

    const animal = buildUniqueAnimal('perm');
    await registerAnimal(page, animal.numeroArete, animal.procedencia);
    await expect(page.getByTestId(`card-${animal.numeroArete}`)).toBeVisible();

    await openUsersAdminPage(page);

    const user = buildUniqueUser('ganado_perm');
    await page.getByTestId('users-form-nombre-completo').fill(user.nombreCompleto);
    await page.getByTestId('users-form-username').fill(user.username);
    await selectGanadoNonAdminRole(page);
    await page.getByTestId('users-form-password').fill(user.password);
    await page.getByTestId('users-form-save-button').click();
    await expect(page.getByTestId('users-form-message')).toContainText('Usuario creado correctamente');

    await logoutFromUsersPage(page);

    await login(page, user.username, user.password);
    await expect(page).toHaveURL(/#\/app$/);
    await page.getByTestId('session-ganado-button').click();
    await expect(page).toHaveURL(/#\/app\/ganado$/);
    await expect(page.getByTestId('ganado-admin-header')).toBeVisible();
    await page.getByTestId('filter-arete').fill(animal.numeroArete);

    await expect(page.getByTestId(`card-${animal.numeroArete}`)).toBeVisible();
    await expect(page.getByTestId(`btn-editar-${animal.numeroArete}`)).toHaveCount(0);
    await expect(page.getByTestId(`btn-baja-${animal.numeroArete}`)).toHaveCount(0);
  });
});
