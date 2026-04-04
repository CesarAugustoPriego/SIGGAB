import { expect, test, type Page } from '@playwright/test';

const SESSION_KEY = 'siggab.auth.session';

type RoleCase = {
  label: string;
  roleName: string;
  idRol: number;
  visibleButtons: string[];
  blockedRoutes: string[];
};

const ALL_SESSION_BUTTONS = [
  'session-users-button',
  'session-ganado-button',
  'session-sanitario-button',
  'session-productivo-button',
  'session-inventario-button',
  'session-dashboard-button',
  'session-reportes-button',
  'session-aprobaciones-button',
  'session-auditoria-button',
  'session-respaldos-button',
] as const;

const ROLE_CASES: RoleCase[] = [
  {
    label: 'Propietario',
    roleName: 'Propietario',
    idRol: 1,
    visibleButtons: [
      'session-ganado-button',
      'session-sanitario-button',
      'session-productivo-button',
      'session-inventario-button',
      'session-dashboard-button',
      'session-reportes-button',
      'session-auditoria-button',
    ],
    blockedRoutes: ['/app/usuarios', '/app/aprobaciones', '/app/respaldos'],
  },
  {
    label: 'Administrador',
    roleName: 'Administrador',
    idRol: 2,
    visibleButtons: [...ALL_SESSION_BUTTONS],
    blockedRoutes: [],
  },
  {
    label: 'Medico Veterinario',
    roleName: 'Medico Veterinario',
    idRol: 3,
    visibleButtons: [
      'session-ganado-button',
      'session-sanitario-button',
      'session-productivo-button',
      'session-reportes-button',
      'session-aprobaciones-button',
    ],
    blockedRoutes: ['/app/usuarios', '/app/dashboard', '/app/auditoria', '/app/respaldos'],
  },
  {
    label: 'Produccion',
    roleName: 'Produccion',
    idRol: 4,
    visibleButtons: [
      'session-ganado-button',
      'session-productivo-button',
      'session-reportes-button',
    ],
    blockedRoutes: ['/app/usuarios', '/app/sanitario', '/app/inventario', '/app/dashboard', '/app/auditoria', '/app/respaldos', '/app/aprobaciones'],
  },
  {
    label: 'Campo',
    roleName: 'Campo',
    idRol: 5,
    visibleButtons: [
      'session-ganado-button',
      'session-sanitario-button',
    ],
    blockedRoutes: ['/app/usuarios', '/app/productivo', '/app/inventario', '/app/dashboard', '/app/reportes', '/app/auditoria', '/app/respaldos', '/app/aprobaciones'],
  },
  {
    label: 'Almacen',
    roleName: 'Almacen',
    idRol: 6,
    visibleButtons: [
      'session-inventario-button',
      'session-reportes-button',
    ],
    blockedRoutes: ['/app/usuarios', '/app/ganado', '/app/sanitario', '/app/productivo', '/app/dashboard', '/app/auditoria', '/app/respaldos', '/app/aprobaciones'],
  },
];

function apiSuccess(data: unknown, message = 'OK') {
  return {
    success: true,
    data,
    message,
    errors: null,
  };
}

function apiForbidden(message = 'No autorizado') {
  return {
    success: false,
    data: null,
    message,
    errors: [],
  };
}

async function bootstrapSessionForRole(page: Page, roleCase: RoleCase) {
  await page.addInitScript(({ key, roleName }) => {
    window.localStorage.setItem(key, JSON.stringify({
      accessToken: `token-${roleName}`,
      refreshToken: `refresh-${roleName}`,
      user: {
        idUsuario: 9000,
        nombreCompleto: `QA ${roleName}`,
        username: `qa_${roleName.toLowerCase().replace(/\s+/g, '_')}`,
        rol: roleName,
      },
    }));
  }, { key: SESSION_KEY, roleName: roleCase.roleName });

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path.endsWith('/auth/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiSuccess({
          idUsuario: 9000,
          nombreCompleto: `QA ${roleCase.roleName}`,
          username: `qa_${roleCase.roleName.toLowerCase().replace(/\s+/g, '_')}`,
          idRol: roleCase.idRol,
          activo: true,
          rol: {
            idRol: roleCase.idRol,
            nombreRol: roleCase.roleName,
          },
        })),
      });
      return;
    }

    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify(apiForbidden()),
    });
  });
}

for (const roleCase of ROLE_CASES) {
  test(`Roles smoke: ${roleCase.label} ve modulos correctos y respeta bloqueos de ruta`, async ({ page }) => {
    await bootstrapSessionForRole(page, roleCase);

    await page.goto('/#/app');
    await expect(page).toHaveURL(/#\/app$/);
    await expect(page.getByRole('heading', { name: 'Sesion activa' })).toBeVisible();

    for (const testId of ALL_SESSION_BUTTONS) {
      const locator = page.getByTestId(testId);
      if (roleCase.visibleButtons.includes(testId)) {
        await expect(locator).toBeVisible();
      } else {
        await expect(locator).toHaveCount(0);
      }
    }

    for (const blockedRoute of roleCase.blockedRoutes) {
      await page.goto(`/#${blockedRoute}`);
      await expect(page).toHaveURL(/#\/app$/);
      await expect(page.getByRole('heading', { name: 'Sesion activa' })).toBeVisible();
    }
  });
}
