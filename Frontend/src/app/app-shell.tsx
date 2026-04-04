import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../features/auth/auth-context';
import { AuthPage, SessionView, type AuthView } from '../features/auth/components';
import { GanadoAdminPage } from '../features/ganado/components';
import { SanitarioAdminPage } from '../features/sanitario/components';
import { UsersAdminPage } from '../features/users/components';
import { ProductivoAdminPage } from '../features/productivo/components';
import { InventarioAdminPage } from '../features/inventario/components';
import { DashboardPage } from '../features/dashboard/components';
import { ReportesPage } from '../features/reportes/components';
import { AprobacionesPage } from '../features/aprobaciones/components';
import { AuditoriaPage } from '../features/auditoria/components';
import { RespaldosPage } from '../features/respaldos/components';
import { canViewGanado } from '../features/ganado/ganado-utils';
import { canViewSanitario } from '../features/sanitario/sanitario-utils';
import { canViewProductivo } from '../features/productivo/productivo-utils';
import { canViewInventario } from '../features/inventario/inventario-utils';
import { canViewDashboard } from '../features/dashboard/dashboard-utils';
import { canViewReportes } from '../features/reportes/reportes-utils';
import { canViewAprobaciones } from '../features/aprobaciones/aprobaciones-utils';
import { canViewAuditoria } from '../features/auditoria/auditoria-utils';
import { canViewRespaldos } from '../features/respaldos/respaldos-utils';
import { isAdministratorRole } from '../features/users/users-utils';
import {
  getAuthViewFromRoute,
  getDefaultProtectedRoute,
  getDefaultPublicRoute,
  getRouteFromAuthView,
  isProtectedRoute,
  navigateToRoute,
  parseRouteFromHash,
  type AppRoute,
} from './auth-routes';

export function AppShell() {
  const { status, user } = useAuth();
  const [route, setRoute] = useState<AppRoute>(() => parseRouteFromHash(window.location.hash));

  const isAdmin = useMemo(() => isAdministratorRole(user?.rol), [user?.rol]);
  const hasGanadoAccess = useMemo(() => canViewGanado(user?.rol), [user?.rol]);
  const hasSanitarioAccess = useMemo(() => canViewSanitario(user?.rol), [user?.rol]);
  const hasProductivoAccess = useMemo(() => canViewProductivo(user?.rol), [user?.rol]);
  const hasInventarioAccess = useMemo(() => canViewInventario(user?.rol), [user?.rol]);
  const hasDashboardAccess = useMemo(() => canViewDashboard(user?.rol), [user?.rol]);
  const hasReportesAccess = useMemo(() => canViewReportes(user?.rol), [user?.rol]);
  const hasAprobacionesAccess = useMemo(() => canViewAprobaciones(user?.rol), [user?.rol]);
  const hasAuditoriaAccess = useMemo(() => canViewAuditoria(user?.rol), [user?.rol]);
  const hasRespaldosAccess = useMemo(() => canViewRespaldos(user?.rol), [user?.rol]);

  const navigate = useCallback((nextRoute: AppRoute, replace = false) => {
    setRoute(nextRoute);
    navigateToRoute(nextRoute, replace);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRouteFromHash(window.location.hash));
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const canonicalHash = `#${route}`;
    if (window.location.hash !== canonicalHash) {
      window.history.replaceState(null, '', canonicalHash);
    }
  }, [route]);

  useEffect(() => {
    if (status === 'booting') return;

    if (status === 'authenticated' && route.startsWith('/auth')) {
      navigate(isAdmin ? '/app/usuarios' : getDefaultProtectedRoute(), true);
      return;
    }

    if (status === 'unauthenticated' && isProtectedRoute(route)) {
      navigate(getDefaultPublicRoute(), true);
      return;
    }

    if (status === 'authenticated' && route === '/app/usuarios' && !isAdmin) {
      navigate('/app', true);
      return;
    }

    if (status === 'authenticated' && route === '/app/ganado' && !hasGanadoAccess) {
      navigate('/app', true);
      return;
    }

    if (status === 'authenticated' && route === '/app/sanitario' && !hasSanitarioAccess) {
      navigate('/app', true);
    }

    if (status === 'authenticated' && route === '/app/productivo' && !hasProductivoAccess) {
      navigate('/app', true);
    }

    if (status === 'authenticated' && route === '/app/inventario' && !hasInventarioAccess) {
      navigate('/app', true);
    }

    if (status === 'authenticated' && route === '/app/dashboard' && !hasDashboardAccess) {
      navigate('/app', true);
    }
    if (status === 'authenticated' && route === '/app/reportes' && !hasReportesAccess) {
      navigate('/app', true);
      return;
    }
    if (status === 'authenticated' && route === '/app/aprobaciones' && !hasAprobacionesAccess) {
      navigate('/app', true);
      return;
    }
    if (status === 'authenticated' && route === '/app/auditoria' && !hasAuditoriaAccess) {
      navigate('/app', true);
      return;
    }
    if (status === 'authenticated' && route === '/app/respaldos' && !hasRespaldosAccess) {
      navigate('/app', true);
      return;
    }
  }, [hasGanadoAccess, hasSanitarioAccess, hasProductivoAccess, hasInventarioAccess, hasDashboardAccess, hasReportesAccess, hasAprobacionesAccess, hasAuditoriaAccess, hasRespaldosAccess, isAdmin, navigate, route, status]);

  const onNavigateModule = useCallback((moduleName: string) => {
    if (moduleName === 'Ganado') {
      navigate('/app/ganado');
      return;
    }

    if (moduleName === 'Productivo' && hasProductivoAccess) {
      navigate('/app/productivo');
      return;
    }

    if (moduleName === 'Sanitario' && hasSanitarioAccess) {
      navigate('/app/sanitario');
      return;
    }

    if (moduleName === 'Inventario' && hasInventarioAccess) {
      navigate('/app/inventario');
      return;
    }

    if (moduleName === 'Dashboard' && hasDashboardAccess) {
      navigate('/app/dashboard');
      return;
    }

    if (moduleName === 'Reportes' && hasReportesAccess) {
      navigate('/app/reportes');
      return;
    }

    if (moduleName === 'Aprobaciones' && hasAprobacionesAccess) {
      navigate('/app/aprobaciones');
      return;
    }

    if (moduleName === 'Auditoria' && hasAuditoriaAccess) {
      navigate('/app/auditoria');
      return;
    }
    if (moduleName === 'Respaldos' && hasRespaldosAccess) {
      navigate('/app/respaldos');
      return;
    }

    if (moduleName === 'Usuarios' && isAdmin) {
      navigate('/app/usuarios');
      return;
    }

    navigate('/app');
  }, [hasSanitarioAccess, hasProductivoAccess, hasInventarioAccess, hasDashboardAccess, hasReportesAccess, hasAprobacionesAccess, hasAuditoriaAccess, hasRespaldosAccess, isAdmin, navigate]);

  const authView = useMemo<AuthView>(() => getAuthViewFromRoute(route), [route]);

  const onAuthViewChange = useCallback((nextView: AuthView) => {
    navigate(getRouteFromAuthView(nextView));
  }, [navigate]);

  if (status === 'booting') {
    return (
      <main className="app-shell">
        <section className="app-shell__loading">
          <p>Validando sesion...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {route === '/app/usuarios' ? (
        <UsersAdminPage
          onGoHome={() => navigate('/app')}
          onNavigateModule={onNavigateModule}
        />
      ) : route === '/app/ganado' ? (
        <GanadoAdminPage
          onGoHome={() => navigate('/app')}
          onGoUsersAdmin={isAdmin ? () => navigate('/app/usuarios') : undefined}
          onNavigateModule={onNavigateModule}
        />
      ) : route === '/app/sanitario' ? (
        <SanitarioAdminPage
          onGoHome={() => navigate('/app')}
          onGoUsersAdmin={isAdmin ? () => navigate('/app/usuarios') : undefined}
          onNavigateModule={onNavigateModule}
        />
      ) : route === '/app/productivo' ? (
        <ProductivoAdminPage
          onGoHome={() => navigate('/app')}
          onGoUsersAdmin={isAdmin ? () => navigate('/app/usuarios') : undefined}
          onNavigateModule={onNavigateModule}
        />
      ) : route === '/app/inventario' ? (
        <InventarioAdminPage
          onGoHome={() => navigate('/app')}
          onGoUsersAdmin={isAdmin ? () => navigate('/app/usuarios') : undefined}
          onNavigateModule={onNavigateModule}
        />
      ) : route === '/app/dashboard' ? (
        <DashboardPage
          onGoHome={() => navigate('/app')}
          onGoUsersAdmin={isAdmin ? () => navigate('/app/usuarios') : undefined}
          onNavigateModule={onNavigateModule}
        />
      ) : route === '/app/reportes' ? (
        <ReportesPage
          onGoHome={() => navigate('/app')}
          onGoUsersAdmin={isAdmin ? () => navigate('/app/usuarios') : undefined}
          onNavigateModule={onNavigateModule}
        />
      ) : route === '/app/aprobaciones' ? (
        <AprobacionesPage
          onGoHome={() => navigate('/app')}
          onGoUsersAdmin={isAdmin ? () => navigate('/app/usuarios') : undefined}
          onNavigateModule={onNavigateModule}
        />
      ) : route === '/app/auditoria' ? (
        <AuditoriaPage
          onGoHome={() => navigate('/app')}
          onGoUsersAdmin={isAdmin ? () => navigate('/app/usuarios') : undefined}
          onNavigateModule={onNavigateModule}
        />
      ) : route === '/app/respaldos' ? (
        <RespaldosPage
          onGoHome={() => navigate('/app')}
          onNavigateModule={onNavigateModule}
        />
      ) : route === '/app' ? (
        <SessionView
          canManageUsers={isAdmin}
          onGoUsersAdmin={() => navigate('/app/usuarios')}
          canViewGanado={hasGanadoAccess}
          onGoGanado={() => navigate('/app/ganado')}
          canViewSanitario={hasSanitarioAccess}
          onGoSanitario={() => navigate('/app/sanitario')}
          canViewProductivo={hasProductivoAccess}
          onGoProductivo={() => navigate('/app/productivo')}
          canViewInventario={hasInventarioAccess}
          onGoInventario={() => navigate('/app/inventario')}
          canViewDashboard={hasDashboardAccess}
          onGoDashboard={() => navigate('/app/dashboard')}
          canViewReportes={hasReportesAccess}
          onGoReportes={() => navigate('/app/reportes')}
          canViewAprobaciones={hasAprobacionesAccess}
          onGoAprobaciones={() => navigate('/app/aprobaciones')}
          canViewAuditoria={hasAuditoriaAccess}
          onGoAuditoria={() => navigate('/app/auditoria')}
          canViewRespaldos={hasRespaldosAccess}
          onGoRespaldos={() => navigate('/app/respaldos')}
        />
      ) : (
        <AuthPage view={authView} onChangeView={onAuthViewChange} />
      )}
    </main>
  );
}
