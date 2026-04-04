import { expect, test, type Page } from '@playwright/test';

const SESSION_KEY = 'siggab.auth.session';

function apiEnvelope(data: unknown, message = 'OK') {
  return {
    success: true,
    data,
    message,
    errors: null,
  };
}

async function seedOwnerSession(page: Page) {
  await page.addInitScript(({ key }) => {
    window.localStorage.setItem(key, JSON.stringify({
      accessToken: 'owner-access-token-e2e',
      refreshToken: 'owner-refresh-token-e2e',
      user: {
        idUsuario: 9001,
        nombreCompleto: 'Propietario SIGGAB',
        username: 'owner.e2e',
        rol: 'Propietario',
      },
    }));
  }, { key: SESSION_KEY });
}

async function mockAuditoriaEndpoints(page: Page) {
  const calls = {
    me: 0,
    bitacora: 0,
  };

  await page.route('**/api/auth/me', async (route) => {
    calls.me += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiEnvelope({
        idUsuario: 9001,
        nombreCompleto: 'Propietario SIGGAB',
        username: 'owner.e2e',
        idRol: 1,
        activo: true,
        rol: {
          idRol: 1,
          nombreRol: 'Propietario',
        },
      })),
    });
  });

  await page.route('**/api/dashboard/bitacora**', async (route) => {
    calls.bitacora += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiEnvelope([
        {
          idBitacora: 70001,
          idUsuario: 1,
          accion: 'LOGIN',
          tablaAfectada: 'usuarios',
          idRegistro: 1,
          fechaHora: '2026-04-03T10:10:00.000Z',
          detalles: null,
          usuario: {
            idUsuario: 1,
            nombreCompleto: 'Administrador del Sistema',
            username: 'admin',
            rol: {
              idRol: 2,
              nombreRol: 'Administrador',
            },
          },
        },
      ])),
    });
  });

  return calls;
}

test('Auditoria: Propietario puede consultar bitacora (RF14)', async ({ page }) => {
  await seedOwnerSession(page);
  const calls = await mockAuditoriaEndpoints(page);

  await page.goto('/#/app/auditoria');
  await expect(page).toHaveURL(/#\/app\/auditoria$/);
  await expect(page.getByTestId('auditoria-header')).toBeVisible();
  await expect(page.getByText('LOGIN')).toBeVisible();

  await expect(page.locator('.users-admin-sidebar__nav-item', { hasText: 'Auditoria' })).toBeVisible();
  await expect(page.locator('.users-admin-sidebar__nav-item', { hasText: 'Usuarios' })).toHaveCount(0);
  await expect(page.locator('.users-admin-sidebar__nav-item', { hasText: 'Respaldos' })).toHaveCount(0);

  await expect.poll(() => calls.me).toBeGreaterThan(0);
  await expect.poll(() => calls.bitacora).toBeGreaterThan(0);
});
