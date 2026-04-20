function normalizeRole(roleName: string | undefined): string {
  return (roleName || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hasRole(roleName: string | undefined, allowed: string[]) {
  return allowed.includes(normalizeRole(roleName));
}

export interface MobileModule {
  key: string;
  title: string;
  description: string;
}

export function isAdministratorRole(roleName: string | undefined) {
  return normalizeRole(roleName) === 'administrador';
}

export function canViewDashboard(roleName: string | undefined) {
  return hasRole(roleName, ['propietario', 'administrador']);
}

export function canViewGanado(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'medico veterinario',
    'veterinario',
    'produccion',
    'campo',
  ]);
}

export function canCreateAnimal(roleName: string | undefined) {
  return hasRole(roleName, [
    'administrador',
    'medico veterinario',
    'produccion',
    'campo',
  ]);
}

export function canEditAnimal(roleName: string | undefined) {
  return hasRole(roleName, ['administrador']);
}

export function canBajaAnimal(roleName: string | undefined) {
  return hasRole(roleName, ['administrador']);
}

export function canViewAnimalHistorial(roleName: string | undefined) {
  return canViewGanado(roleName);
}

export function canViewSanitario(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'medico veterinario',
    'veterinario',
    'campo',
  ]);
}

export function canViewSanitarioRecords(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'medico veterinario',
    'veterinario',
  ]);
}

export function canCreateSanitarioEvento(roleName: string | undefined) {
  return hasRole(roleName, [
    'medico veterinario',
    'veterinario',
    'campo',
  ]);
}

export function canEditSanitarioEvento(roleName: string | undefined) {
  return hasRole(roleName, [
    'medico veterinario',
    'veterinario',
  ]);
}

export function canApproveSanitarioEvento(roleName: string | undefined) {
  return hasRole(roleName, [
    'medico veterinario',
    'veterinario',
  ]);
}

export function canViewCalendarioSanitario(roleName: string | undefined) {
  return canViewSanitarioRecords(roleName);
}

export function canCreateCalendarioSanitario(roleName: string | undefined) {
  return hasRole(roleName, [
    'medico veterinario',
    'veterinario',
  ]);
}

export function canCompleteCalendarioSanitario(roleName: string | undefined) {
  return canCreateCalendarioSanitario(roleName);
}

export function canViewProductivo(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'produccion',
    'campo',
  ]);
}

export function canViewEventosReproductivos(roleName: string | undefined) {
  return canViewProductivo(roleName) || hasRole(roleName, [
    'medico veterinario',
    'veterinario',
  ]);
}

export function canCreateEventoReproductivo(roleName: string | undefined) {
  return hasRole(roleName, [
    'administrador',
    'produccion',
    'campo',
    'medico veterinario',
    'veterinario',
  ]);
}

export function canViewInventario(roleName: string | undefined) {
  return hasRole(roleName, ['propietario', 'administrador', 'almacen']);
}

export function canViewReportes(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'medico veterinario',
    'veterinario',
    'produccion',
    'almacen',
  ]);
}

export function canViewAprobaciones(roleName: string | undefined) {
  return hasRole(roleName, ['administrador', 'medico veterinario', 'veterinario']);
}

export function canViewAuditoria(roleName: string | undefined) {
  return hasRole(roleName, ['propietario', 'administrador']);
}

export function canViewRespaldos(roleName: string | undefined) {
  return isAdministratorRole(roleName);
}

const ALL_MODULES: MobileModule[] = [
  { key: 'dashboard', title: 'Dashboard', description: 'Indicadores ejecutivos en tiempo real (RF10).' },
  { key: 'ganado', title: 'Ganado', description: 'Registro y trazabilidad completa de animales (RF03-RF04).' },
  { key: 'sanitario', title: 'Sanitario', description: 'Eventos sanitarios y calendario veterinario (RF05-RF06).' },
  { key: 'productivo', title: 'Productivo', description: 'Peso, leche y eventos reproductivos (RF07).' },
  { key: 'inventario', title: 'Inventario', description: 'Insumos, movimientos y existencias (RF08).' },
  { key: 'reportes', title: 'Reportes', description: 'Consultas sanitarias, productivas y administrativas (RF09).' },
  { key: 'aprobaciones', title: 'Aprobaciones', description: 'Validación y autorización por rol (RF12-RF15).' },
  { key: 'auditoria', title: 'Auditoría', description: 'Bitácora de acciones críticas del sistema (RF14).' },
  { key: 'usuarios', title: 'Usuarios', description: 'Gestión de usuarios y roles del sistema (RF02).' },
  { key: 'respaldos', title: 'Respaldos', description: 'Gestión de respaldos automáticos y manuales (RF11).' },
];

export function getVisibleModulesForRole(roleName: string | undefined): MobileModule[] {
  return ALL_MODULES.filter((module) => {
    if (module.key === 'dashboard') return canViewDashboard(roleName);
    if (module.key === 'ganado') return canViewGanado(roleName);
    if (module.key === 'sanitario') return canViewSanitario(roleName);
    if (module.key === 'productivo') return canViewEventosReproductivos(roleName);
    if (module.key === 'inventario') return canViewInventario(roleName);
    if (module.key === 'reportes') return canViewReportes(roleName);
    if (module.key === 'aprobaciones') return canViewAprobaciones(roleName);
    if (module.key === 'auditoria') return canViewAuditoria(roleName);
    if (module.key === 'respaldos') return canViewRespaldos(roleName);
    if (module.key === 'usuarios') return isAdministratorRole(roleName);
    return false;
  });
}
