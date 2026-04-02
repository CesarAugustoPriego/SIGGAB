import { useMemo, useState } from 'react';
import { useAuth } from '../auth-context';
import { AuthTopBar } from './auth-topbar';
import { LoginView } from './login-view';
import { RegisterMockView } from './register-mock-view';
import { SessionView } from './session-view';
import type { AuthView } from './auth-view';

export function AuthPage() {
  const { status } = useAuth();
  const [view, setView] = useState<AuthView>('login');

  const authViewContent = useMemo(() => {
    if (view === 'register') {
      return <RegisterMockView onGoLogin={() => setView('login')} />;
    }

    return <LoginView onGoRegister={() => setView('register')} />;
  }, [view]);

  if (status === 'authenticated') {
    return <SessionView />;
  }

  return (
    <section className={`auth-page auth-page--${view}`}>
      <AuthTopBar view={view} onChangeView={setView} />
      <div className="auth-page__canvas">{authViewContent}</div>
    </section>
  );
}
