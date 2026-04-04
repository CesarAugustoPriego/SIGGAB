import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();

const checks = [
  {
    file: 'src/features/auth/components/login-view.tsx',
    testIds: [
      'login-username-input',
      'login-password-input',
      'login-submit-button',
      'login-error-banner',
    ],
  },
  {
    file: 'src/features/auth/components/session-view.tsx',
    testIds: [
      'session-refresh-button',
      'session-users-button',
      'session-logout-button',
      'session-success-banner',
    ],
  },
  {
    file: 'src/features/users/components/users-admin-page.tsx',
    testIds: [
      'users-admin-header',
      'users-sidebar-logout-button',
      'users-form-nombre-completo',
      'users-form-username',
      'users-form-id-rol',
      'users-form-password',
      'users-form-save-button',
      'users-form-message',
      'users-list',
      'users-list-item-',
      'users-edit-button-',
      'users-toggle-button-',
      'users-nav-',
    ],
  },
  {
    file: 'src/features/ganado/components/ganado-admin-page.tsx',
    testIds: [
      'ganado-admin-header',
      'input-arete',
      'input-fecha',
      'input-peso',
      'input-edad',
      'select-raza',
      'input-procedencia',
      'input-sanitario',
      'btn-submit',
      'input-buscar-arete',
      'btn-buscar',
      'filter-estado',
      'filter-raza',
      'filter-arete',
      'btn-limpiar-filtros',
      'card-',
      'btn-editar-',
      'btn-baja-',
      'btn-historial-',
      'select-motivo',
      'input-baja-fecha',
      'btn-confirmar-baja',
    ],
  },
  {
    file: 'src/features/aprobaciones/components/aprobaciones-page.tsx',
    testIds: [
      'aprobaciones-header'
    ],
  },
  {
    file: 'src/features/auditoria/components/auditoria-page.tsx',
    testIds: [
      'auditoria-page',
      'auditoria-header',
    ],
  },
  {
    file: 'src/features/respaldos/components/respaldos-page.tsx',
    testIds: [
      'respaldos-header',
      'respaldos-run-manual',
      'respaldos-refresh-list',
      'respaldos-history-list',
      'respaldos-download-',
    ],
  },
];

const missing = [];

for (const check of checks) {
  const absPath = path.join(workspaceRoot, check.file);

  if (!fs.existsSync(absPath)) {
    missing.push(`[MISSING FILE] ${check.file}`);
    continue;
  }

  const fileContent = fs.readFileSync(absPath, 'utf8');

  for (const testId of check.testIds) {
    if (!fileContent.includes(testId)) {
      missing.push(`${check.file} -> ${testId}`);
    }
  }
}

if (missing.length > 0) {
  console.error('ERROR: contrato de data-testid roto.\n');
  for (const issue of missing) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('OK: contrato de data-testid verificado.');
