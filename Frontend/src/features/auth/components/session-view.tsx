import { useState } from 'react';
import { useAuth } from '../auth-context';
import { Button, Users, Beef, HeartPulse, BarChart3, Package, LayoutDashboard, FileText, LogOut, RefreshCw, CheckCircle, Shield, Database } from '../../../shared/ui';

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
  canViewAprobaciones?: boolean;
  onGoAprobaciones?: () => void;
  canViewAuditoria?: boolean;
  onGoAuditoria?: () => void;
  canViewRespaldos?: boolean;
  onGoRespaldos?: () => void;
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
  canViewAprobaciones = false,
  onGoAprobaciones,
  canViewAuditoria = false,
  onGoAuditoria,
  canViewRespaldos = false,
  onGoRespaldos,
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
            <RefreshCw size={15} aria-hidden />
            {busyAction === 'me' ? 'Verificando...' : 'Probar /auth/me'}
          </Button>
          {canManageUsers ? (
            <Button type="button" variant="ghost" onClick={onGoUsersAdmin} data-testid="session-users-button">
              <Users size={15} aria-hidden /> Gestion usuarios
            </Button>
          ) : null}
          {canViewGanado ? (
            <Button type="button" variant="ghost" onClick={onGoGanado} data-testid="session-ganado-button">
              <Beef size={15} aria-hidden /> Gestion ganado
            </Button>
          ) : null}
          {canViewSanitario ? (
            <Button type="button" variant="ghost" onClick={onGoSanitario} data-testid="session-sanitario-button">
              <HeartPulse size={15} aria-hidden /> Gestion sanitario
            </Button>
          ) : null}
          {canViewProductivo ? (
            <Button type="button" variant="ghost" onClick={onGoProductivo} data-testid="session-productivo-button">
              <BarChart3 size={15} aria-hidden /> Gestion productiva
            </Button>
          ) : null}
          {canViewInventario ? (
            <Button type="button" variant="ghost" onClick={onGoInventario} data-testid="session-inventario-button">
              <Package size={15} aria-hidden /> Gestion inventario
            </Button>
          ) : null}
          {canViewDashboard ? (
            <Button type="button" variant="ghost" onClick={onGoDashboard} data-testid="session-dashboard-button">
              <LayoutDashboard size={15} aria-hidden /> Dashboard
            </Button>
          ) : null}
          {canViewReportes ? (
            <Button type="button" variant="ghost" onClick={onGoReportes} data-testid="session-reportes-button">
              <FileText size={15} aria-hidden /> Reportes
            </Button>
          ) : null}
          {canViewAprobaciones ? (
            <Button type="button" variant="ghost" onClick={onGoAprobaciones} data-testid="session-aprobaciones-button">
              <CheckCircle size={15} aria-hidden /> Aprobaciones
            </Button>
          ) : null}
          {canViewAuditoria ? (
            <Button type="button" variant="ghost" onClick={onGoAuditoria} data-testid="session-auditoria-button">
              <Shield size={15} aria-hidden /> Auditoria
            </Button>
          ) : null}
          {canViewRespaldos ? (
            <Button type="button" variant="ghost" onClick={onGoRespaldos} data-testid="session-respaldos-button">
              <Database size={15} aria-hidden /> Respaldos
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            onClick={onLogout}
            disabled={busyAction !== null}
            data-testid="session-logout-button"
          >
            {busyAction === 'logout' ? 'Cerrando...' : <><LogOut size={15} aria-hidden /> Cerrar sesion</>}
          </Button>
        </div>

        {lastCheck ? <p className="success-banner" data-testid="session-success-banner">Perfil validado a las {lastCheck}</p> : null}
        {apiError ? <p className="error-banner">{apiError}</p> : null}
      </article>
    </section>
  );
}
