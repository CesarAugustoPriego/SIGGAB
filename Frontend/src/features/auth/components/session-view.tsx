import { useState } from 'react';
import { useAuth } from '../auth-context';
import { Button } from '../../../shared/ui';

interface SessionViewProps {
  canManageUsers?: boolean;
  onGoUsersAdmin?: () => void;
  canViewGanado?: boolean;
  onGoGanado?: () => void;
  canViewSanitario?: boolean;
  onGoSanitario?: () => void;
  canViewProductivo?: boolean;
  onGoProductivo?: () => void;
  canViewInventario?: boolean;
  onGoInventario?: () => void;
  canViewDashboard?: boolean;
  onGoDashboard?: () => void;
  canViewReportes?: boolean;
  onGoReportes?: () => void;
}

export function SessionView({
  canManageUsers = false,
  onGoUsersAdmin,
  canViewGanado = false,
  onGoGanado,
  canViewSanitario = false,
  onGoSanitario,
  canViewProductivo = false,
  onGoProductivo,
  canViewInventario = false,
  onGoInventario,
  canViewDashboard = false,
  onGoDashboard,
  canViewReportes = false,
  onGoReportes,
}: SessionViewProps) {
  const { user, logout, refreshProfile, apiError } = useAuth();
  const [busyAction, setBusyAction] = useState<'me' | 'logout' | null>(null);
  const [lastCheck, setLastCheck] = useState('');

  const onRefresh = async () => {
    setBusyAction('me');
    try {
      await refreshProfile();
      setLastCheck(new Date().toLocaleTimeString());
    } finally {
      setBusyAction(null);
    }
  };

  const onLogout = async () => {
    setBusyAction('logout');
    try {
      await logout();
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <section className="session-shell">
      <article className="session-card">
        <h1>Sesion activa</h1>
        <p>
          Bienvenido <strong>{user?.nombreCompleto}</strong>
        </p>
        <p>
          Usuario: <strong>{user?.username}</strong> | Rol: <strong>{user?.rol || 'N/A'}</strong>
        </p>

        <div className="session-card__actions">
          <Button type="button" onClick={onRefresh} disabled={busyAction !== null} data-testid="session-refresh-button">
            {busyAction === 'me' ? 'Verificando...' : 'Probar /auth/me'}
          </Button>
          {canManageUsers ? (
            <Button type="button" variant="ghost" onClick={onGoUsersAdmin} data-testid="session-users-button">
              Gestion usuarios
            </Button>
          ) : null}
          {canViewGanado ? (
            <Button type="button" variant="ghost" onClick={onGoGanado} data-testid="session-ganado-button">
              Gestion ganado
            </Button>
          ) : null}
          {canViewSanitario ? (
            <Button type="button" variant="ghost" onClick={onGoSanitario} data-testid="session-sanitario-button">
              Gestion sanitario
            </Button>
          ) : null}
          {canViewProductivo ? (
            <Button type="button" variant="ghost" onClick={onGoProductivo} data-testid="session-productivo-button">
              Gestion productiva
            </Button>
          ) : null}
          {canViewInventario ? (
            <Button type="button" variant="ghost" onClick={onGoInventario} data-testid="session-inventario-button">
              Gestion inventario
            </Button>
          ) : null}
          {canViewDashboard ? (
            <Button type="button" variant="ghost" onClick={onGoDashboard} data-testid="session-dashboard-button">
              Dashboard
            </Button>
          ) : null}
          {canViewReportes ? (
            <Button type="button" variant="ghost" onClick={onGoReportes} data-testid="session-reportes-button">
              Reportes
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            onClick={onLogout}
            disabled={busyAction !== null}
            data-testid="session-logout-button"
          >
            {busyAction === 'logout' ? 'Cerrando...' : 'Cerrar sesion'}
          </Button>
        </div>

        {lastCheck ? <p className="success-banner" data-testid="session-success-banner">Perfil validado a las {lastCheck}</p> : null}
        {apiError ? <p className="error-banner">{apiError}</p> : null}
      </article>
    </section>
  );
}
