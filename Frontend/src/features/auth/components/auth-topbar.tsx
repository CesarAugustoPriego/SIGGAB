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
        <img
          src="/branding/logo-rancho-los-alpes.png"
          alt="Logo Rancho Los Alpes"
          className="auth-topbar__brand-logo"
        />
        <strong>SIGGAB</strong>
      </div>


      <div className="auth-topbar__actions">
        <Button
          type="button"
          variant="link"
          className={view === 'login' ? 'is-active' : ''}
          onClick={() => onChangeView('login')}
        >
          Ingresar
        </Button>
      </div>
    </header>
  );
}
