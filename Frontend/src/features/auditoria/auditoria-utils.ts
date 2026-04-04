function normalizeRole(value: string | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function canViewAuditoria(rol?: string): boolean {
  const normalized = normalizeRole(rol);
  return normalized === 'administrador' || normalized === 'propietario';
}
