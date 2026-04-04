export type AuthRouteView = 'login' | 'register';

export type AppRoute = '/auth/login' | '/auth/register' | '/app' | '/app/usuarios' | '/app/ganado' | '/app/sanitario' | '/app/productivo' | '/app/inventario' | '/app/dashboard' | '/app/reportes' | '/app/aprobaciones' | '/app/auditoria' | '/app/respaldos';

const DEFAULT_PUBLIC_ROUTE: AppRoute = '/auth/login';
const DEFAULT_PROTECTED_ROUTE: AppRoute = '/app';

export function parseRouteFromHash(hash: string): AppRoute {
  const normalized = hash.replace(/^#/, '').trim();

  if (normalized === '/auth/register') return '/auth/register';
  if (normalized === '/app/usuarios') return '/app/usuarios';
  if (normalized === '/app/ganado') return '/app/ganado';
  if (normalized === '/app/sanitario') return '/app/sanitario';
  if (normalized === '/app/productivo') return '/app/productivo';
  if (normalized === '/app/inventario') return '/app/inventario';
  if (normalized === '/app/dashboard') return '/app/dashboard';
  if (normalized === '/app/reportes') return '/app/reportes';
  if (normalized === '/app/aprobaciones') return '/app/aprobaciones';
  if (normalized === '/app/auditoria') return '/app/auditoria';
  if (normalized === '/app/respaldos') return '/app/respaldos';
  if (normalized === '/app') return '/app';
  return '/auth/login';
}

export function routeToHash(route: AppRoute) {
  return `#${route}`;
}

export function navigateToRoute(route: AppRoute, replace = false) {
  const nextHash = routeToHash(route);
  if (replace) {
    window.history.replaceState(null, '', nextHash);
    return;
  }

  window.location.hash = nextHash;
}

export function getDefaultPublicRoute() {
  return DEFAULT_PUBLIC_ROUTE;
}

export function getDefaultProtectedRoute() {
  return DEFAULT_PROTECTED_ROUTE;
}

export function isProtectedRoute(route: AppRoute) {
  return route.startsWith('/app');
}

export function getAuthViewFromRoute(route: AppRoute): AuthRouteView {
  return route === '/auth/register' ? 'register' : 'login';
}

export function getRouteFromAuthView(view: AuthRouteView): AppRoute {
  return view === 'register' ? '/auth/register' : '/auth/login';
}
