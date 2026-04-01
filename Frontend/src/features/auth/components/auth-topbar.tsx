import { Button } from '../../../shared/ui';
import type { AuthView } from './auth-view';

interface AuthTopBarProps {
  view: AuthView;
  onChangeView: (view: AuthView) => void;
}

export function AuthTopBar({ view, onChangeView }: AuthTopBarProps) {
  return (
    <header className="auth-topbar">
      <div className="auth-topbar__brand">
        <img src="/placeholders/logo-rancho-placeholder.svg" alt="Logo SIGGAB" />
        <strong>SIGGAB</strong>
      </div>

      <nav className="auth-topbar__nav" aria-label="Navegacion principal">
        <a href="#">Nosotros</a>
        <a href="#">Servicios</a>
        <a href="#">Contacto</a>
      </nav>

      <div className="auth-topbar__actions">
        <Button
          type="button"
          variant="link"
          className={view === 'login' ? 'is-active' : ''}
          onClick={() => onChangeView('login')}
        >
          Ingresar
        </Button>
        <Button
          type="button"
          variant="pill"
          className={view === 'register' ? 'is-active' : ''}
          onClick={() => onChangeView('register')}
        >
          Registrarse
        </Button>
      </div>
    </header>
  );
}
