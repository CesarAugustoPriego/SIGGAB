import { expect, test } from '@playwright/test';
import {
  buildUniqueUser,
  createUserFromForm,
  forceInvalidAccessToken,
  getUserCard,
  isAdminRoleLabel,
  login,
  loginAsAdmin,
  logoutFromSessionPage,
  logoutFromUsersPage,
  openSessionPage,
  openUsersAdminPage,
  selectRoleOption,
} from './helpers';

test('Auth: login, refresh con /auth/refresh, /auth/me y logout', async ({ page }) => {
  await loginAsAdmin(page);
  await openSessionPage(page);

  await forceInvalidAccessToken(page);
  await page.getByTestId('session-refresh-button').click();
  await expect(page.getByTestId('session-success-banner')).toContainText('Perfil validado a las');

  await logoutFromSessionPage(page);
});

test('Auth: credenciales invalidas muestra error 401 en UI', async ({ page }) => {
  const username = `usuario_invalido_${Date.now()}`;
  await login(page, username, 'PasswordInvalido2026!');
  await expect(page.getByTestId('login-error-banner')).toContainText('Credenciales invalidas o sesion expirada.');
});

test('Auth: cuenta bloqueada muestra mensaje 423 en UI', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 423,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        data: null,
        message: 'Cuenta temporalmente bloqueada',
        errors: [{ campo: 'username', mensaje: 'Cuenta bloqueada' }],
      }),
    });
  });

  await login(page, 'usuario_bloqueado', 'PasswordInvalido2026!');
  await expect(page.getByTestId('login-error-banner')).toContainText('Cuenta bloqueada temporalmente por seguridad. Intenta mas tarde.');
});

test('Usuarios: crear, editar y activar/desactivar usuario', async ({ page }) => {
  await loginAsAdmin(page);
  await openUsersAdminPage(page);

  const user = buildUniqueUser('crud');
  await createUserFromForm(page, user);

  const userCard = getUserCard(page, user.username);
  await expect(userCard).toBeVisible();

  await userCard.getByRole('button', { name: 'Editar' }).click();

  const updatedName = `${user.nombreCompleto} Actualizado`;
  await page.getByTestId('users-form-nombre-completo').fill(updatedName);
  await page.getByTestId('users-form-save-button').click();
  await expect(page.getByTestId('users-form-message')).toContainText('Usuario actualizado correctamente.');

  const updatedCard = getUserCard(page, user.username);
  await expect(updatedCard).toContainText(updatedName);

  await updatedCard.getByRole('button', { name: 'Desactivar' }).click();
  await expect(updatedCard.getByText('INACTIVO')).toBeVisible();

  await updatedCard.getByRole('button', { name: 'Activar' }).click();
  await expect(updatedCard.getByText('ACTIVO')).toBeVisible();
});

test('Guardas de ruta: usuario no admin no puede entrar a /app/usuarios', async ({ page }) => {
  await loginAsAdmin(page);
  await openUsersAdminPage(page);

  const user = buildUniqueUser('guard');
  const selectedRole = await createUserFromForm(page, user, true);

  expect(isAdminRoleLabel(selectedRole.label)).toBeFalsy();

  await logoutFromUsersPage(page);
  await login(page, user.username, user.password);
  await expect(page).toHaveURL(/#\/app$/);

  await page.goto('/#/app/usuarios');
  await expect(page).toHaveURL(/#\/app$/);
  await expect(page.getByRole('heading', { name: 'Sesion activa' })).toBeVisible();
});

test('Usuarios: manejo 403 al intentar crear usuario sin permisos', async ({ page }) => {
  await loginAsAdmin(page);
  await openUsersAdminPage(page);

  await page.route('**/api/usuarios', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          data: null,
          message: 'Acceso denegado',
          errors: [],
        }),
      });
      return;
    }

    await route.continue();
  });

  const user = buildUniqueUser('forbidden');
  await page.getByTestId('users-form-nombre-completo').fill(user.nombreCompleto);
  await page.getByTestId('users-form-username').fill(user.username);
  await selectRoleOption(page.getByTestId('users-form-id-rol'), false);
  await page.getByTestId('users-form-password').fill(user.password);
  await page.getByTestId('users-form-save-button').click();

  await expect(page.getByTestId('users-form-message')).toContainText('No tienes permisos para gestionar usuarios.');
});
