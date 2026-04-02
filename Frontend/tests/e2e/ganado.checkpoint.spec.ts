import { expect, type Page, test } from '@playwright/test';
import { buildUniqueAnimal, loginAsAdmin, openGanadoPage } from './helpers';

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
  await page.getByTestId('input-procedencia').fill(procedencia);
  await page.getByTestId('input-sanitario').fill('Sin hallazgos relevantes al ingreso.');
  await page.getByTestId('btn-submit').click();
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
    const procedenciaActualizada = `${animal.procedencia} Sector Norte`;
    await page.getByTestId('input-procedencia').fill(procedenciaActualizada);
    await page.getByTestId('btn-submit').click();
    await expect(page.getByTestId('ganado-form-message')).toContainText('Animal actualizado correctamente.');
    await expect(page.getByTestId(`card-${animal.numeroArete}`)).toContainText(procedenciaActualizada);

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
});
