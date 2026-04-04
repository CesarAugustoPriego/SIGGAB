/**
 * SIGGAB — Shared navigation items with Lucide icons.
 * Used by all module pages for sidebar rendering.
 */
import type { LucideIcon } from './icon';
import {
  LayoutDashboard,
  Beef,
  HeartPulse,
  BarChart3,
  Package,
  FileText,
  CheckCircle,
  Shield,
  Users,
  Database,
} from './icon';

export interface NavItem {
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Ganado', icon: Beef },
  { label: 'Sanitario', icon: HeartPulse },
  { label: 'Productivo', icon: BarChart3 },
  { label: 'Inventario', icon: Package },
  { label: 'Reportes', icon: FileText },
  { label: 'Aprobaciones', icon: CheckCircle },
  { label: 'Auditoria', icon: Shield },
  { label: 'Usuarios', icon: Users },
  { label: 'Respaldos', icon: Database },
];
