import { useState } from 'react';
import { useAuth } from '../auth-context';
import { Button } from '../../../shared/ui';

export function SessionView() {
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
          <Button type="button" onClick={onRefresh} disabled={busyAction !== null}>
            {busyAction === 'me' ? 'Verificando...' : 'Probar /auth/me'}
          </Button>
          <Button type="button" variant="ghost" onClick={onLogout} disabled={busyAction !== null}>
            {busyAction === 'logout' ? 'Cerrando...' : 'Cerrar sesion'}
          </Button>
        </div>

        {lastCheck ? <p className="success-banner">Perfil validado a las {lastCheck}</p> : null}
        {apiError ? <p className="error-banner">{apiError}</p> : null}
      </article>
    </section>
  );
}
