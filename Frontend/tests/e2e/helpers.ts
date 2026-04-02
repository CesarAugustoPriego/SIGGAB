import { expect, type Locator, type Page } from '@playwright/test';

const SESSION_KEY = 'siggab.auth.session';

export const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'SiggabAdmin2026!';

export interface TestUser {
  nombreCompleto: string;
  username: string;
  password: string;
}

export interface TestAnimal {
  numeroArete: string;
  procedencia: string;
}

export interface RoleOption {
  value: string;
  label: string;
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function buildUniqueUser(prefix: string): TestUser {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  const suffix = `${stamp}${random}`;

  return {
    nombreCompleto: `QA ${prefix} ${suffix}`,
    username: `${prefix}_${suffix}`.slice(0, 40),
    password: `Sggb!${suffix}A1`,
  };
}

export function buildUniqueAnimal(prefix: string): TestAnimal {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  const suffix = `${stamp}${random}`.slice(-8);

  return {
    numeroArete: `MX-E2E-${prefix.toUpperCase()}-${suffix}`,
    procedencia: `Rancho QA ${suffix}`,
  };
}

export async function openLoginPage(page: Page) {
  await page.goto('/#/auth/login');
  await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
}

export async function login(page: Page, username: string, password: string) {
  await openLoginPage(page);
  await page.getByTestId('login-username-input').fill(username);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();
}

export async function loginAsAdmin(page: Page) {
  await login(page, ADMIN_USERNAME, ADMIN_PASSWORD);
  await expect(page).toHaveURL(/#\/app(\/usuarios)?$/);
}

export async function openUsersAdminPage(page: Page) {
  await page.goto('/#/app/usuarios');
  await expect(page.getByTestId('users-admin-header')).toBeVisible();
}

export async function openSessionPage(page: Page) {
  await page.goto('/#/app');
  await expect(page.getByRole('heading', { name: 'Sesion activa' })).toBeVisible();
}

export async function openGanadoPage(page: Page) {
  await page.goto('/#/app/ganado');
  await expect(page.getByTestId('ganado-admin-header')).toBeVisible();
}

export async function logoutFromUsersPage(page: Page) {
  await page.getByTestId('users-sidebar-logout-button').click();
  await expect(page).toHaveURL(/#\/auth\/login$/);
}

export async function logoutFromSessionPage(page: Page) {
  await page.getByTestId('session-logout-button').click();
  await expect(page).toHaveURL(/#\/auth\/login$/);
}

export async function forceInvalidAccessToken(page: Page) {
  await page.evaluate((sessionKey) => {
    const raw = window.localStorage.getItem(sessionKey);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { accessToken?: string };
    parsed.accessToken = 'token-invalido-e2e';
    window.localStorage.setItem(sessionKey, JSON.stringify(parsed));
  }, SESSION_KEY);
}

export async function selectRoleOption(selectLocator: Locator, preferNonAdmin: boolean): Promise<RoleOption> {
  const role = await selectLocator.evaluate((select, chooseNonAdmin) => {
    const options = Array.from(select.options)
      .filter((option) => option.value)
      .map((option) => ({
        value: option.value,
        label: option.textContent?.trim() || '',
      }));

    if (options.length === 0) return null;

    if (chooseNonAdmin) {
      const nonAdmin = options.find((option) => {
        const normalized = option.label
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return !normalized.includes('administrador');
      });

      if (nonAdmin) return nonAdmin;
    }

    return options[0];
  }, preferNonAdmin);

  if (!role) {
    throw new Error('No hay roles disponibles en el select de usuarios.');
  }

  await selectLocator.selectOption(role.value);
  return role;
}

export async function createUserFromForm(page: Page, user: TestUser, preferNonAdminRole = false) {
  await page.getByTestId('users-form-nombre-completo').fill(user.nombreCompleto);
  await page.getByTestId('users-form-username').fill(user.username);
  const role = await selectRoleOption(page.getByTestId('users-form-id-rol'), preferNonAdminRole);
  await page.getByTestId('users-form-password').fill(user.password);
  await page.getByTestId('users-form-save-button').click();
  await expect(page.getByTestId('users-form-message')).toContainText('Usuario creado correctamente.');
  return role;
}

export function getUserCard(page: Page, username: string) {
  return page.locator('.users-list-item', { hasText: `@${username}` }).first();
}

export function isAdminRoleLabel(label: string) {
  return normalizeText(label).includes('administrador');
}
