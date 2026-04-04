import type { NavItem } from '../../shared/ui/nav-items';
import { canViewAprobaciones } from '../aprobaciones/aprobaciones-utils';
import { canViewAuditoria } from '../auditoria/auditoria-utils';
import { canViewDashboard } from '../dashboard/dashboard-utils';
import { canViewGanado } from '../ganado/ganado-utils';
import { canViewInventario } from '../inventario/inventario-utils';
import { canViewProductivo } from '../productivo/productivo-utils';
import { canViewReportes } from '../reportes/reportes-utils';
import { canViewRespaldos } from '../respaldos/respaldos-utils';
import { canViewSanitario } from '../sanitario/sanitario-utils';
import { isAdministratorRole } from '../users/users-utils';

export function canViewNavItem(label: string, roleName: string | undefined) {
  if (label === 'Dashboard') return canViewDashboard(roleName);
  if (label === 'Ganado') return canViewGanado(roleName);
  if (label === 'Sanitario') return canViewSanitario(roleName);
  if (label === 'Produccion') return canViewProductivo(roleName);
  if (label === 'Inventario') return canViewInventario(roleName);
  if (label === 'Reportes') return canViewReportes(roleName);
  if (label === 'Aprobaciones') return canViewAprobaciones(roleName);
  if (label === 'Auditoria') return canViewAuditoria(roleName);
  if (label === 'Usuarios') return isAdministratorRole(roleName);
  if (label === 'Respaldos') return canViewRespaldos(roleName);
  return false;
}

export function getVisibleNavItemsForRole(roleName: string | undefined, items: NavItem[]) {
  return items.filter((item) => canViewNavItem(item.label, roleName));
}
