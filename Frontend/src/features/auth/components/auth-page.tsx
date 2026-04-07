import { useMemo } from 'react';
import { AuthTopBar } from './auth-topbar';
import { LoginView } from './login-view';
import { RegisterMockView } from './register-mock-view';
import type { AuthView } from './auth-view';

interface AuthPageProps {
  view: AuthView;
  onChangeView: (view: AuthView) => void;
}

export function AuthPage({ view, onChangeView }: AuthPageProps) {
  const authViewContent = useMemo(() => {
    if (view === 'register') {
      return <RegisterMockView onGoLogin={() => onChangeView('login')} />;
    }

    return <LoginView />;
  }, [onChangeView, view]);

  return (
    <section className={`auth-page auth-page--${view}`}>
      <AuthTopBar view={view} onChangeView={onChangeView} />
      <div className="auth-page__canvas">{authViewContent}</div>
    </section>
  );
}
