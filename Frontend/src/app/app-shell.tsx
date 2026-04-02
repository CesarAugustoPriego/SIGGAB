import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../features/auth/auth-context';
import { AuthPage, SessionView, type AuthView } from '../features/auth/components';
import { GanadoAdminPage } from '../features/ganado/components';
import { UsersAdminPage } from '../features/users/components';
import { canViewGanado } from '../features/ganado/ganado-utils';
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
    }
  }, [hasGanadoAccess, isAdmin, navigate, route, status]);

  const onNavigateModule = useCallback((moduleName: string) => {
    if (moduleName === 'Ganado') {
      navigate('/app/ganado');
      return;
    }

    if (moduleName === 'Usuarios' && isAdmin) {
      navigate('/app/usuarios');
      return;
    }

    navigate('/app');
  }, [isAdmin, navigate]);

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
      ) : route === '/app' ? (
        <SessionView
          canManageUsers={isAdmin}
          onGoUsersAdmin={() => navigate('/app/usuarios')}
          canViewGanado={hasGanadoAccess}
          onGoGanado={() => navigate('/app/ganado')}
        />
      ) : (
        <AuthPage view={authView} onChangeView={onAuthViewChange} />
      )}
    </main>
  );
}
