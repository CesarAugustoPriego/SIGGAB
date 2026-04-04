export function canViewAuditoria(rol?: string): boolean {
  if (!rol) return false;
  return rol.toUpperCase().includes('ADMIN');
}
