import { useState, type FormEvent } from 'react';
import { env } from '../../../config/env';
import { useAuth } from '../auth-context';
import { Button, TextField } from '../../../shared/ui';

interface LoginViewProps {
  onGoRegister: () => void;
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20C4 16 7.6 13 12 13C16.4 13 20 16 20 20" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M7 11V7C7 4.2 9.2 2 12 2C14.8 2 17 4.2 17 7V11" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9.88 9.88A3 3 0 0 0 14.12 14.12" stroke="currentColor" strokeWidth="2" />
        <path d="M10.73 5.08C11.14 5.03 11.57 5 12 5C19 5 22 12 22 12C21.57 12.82 21.06 13.6 20.47 14.31" stroke="currentColor" strokeWidth="2" />
        <path d="M6.61 6.61C3.76 8.3 2 12 2 12C2 12 5 19 12 19C13.94 19 15.74 18.47 17.3 17.57" stroke="currentColor" strokeWidth="2" />
        <path d="M2 2L22 22" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2.3" />
    </svg>
  );
}

export function LoginView({ onGoRegister }: LoginViewProps) {
  const { login, apiError, clearApiError, status } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('SiggabAdmin2026!');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearApiError();
    setSubmitting(true);

    try {
      await login({ username, password });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-view auth-view--login" aria-label="Pantalla de inicio de sesion">
      <article className="login-card" aria-live="polite">
        <img
          src="/branding/logo-rancho-los-alpes.png"
          alt="Logo Rancho Los Alpes"
          className="auth-card-logo"
        />
        <h1>Bienvenido de nuevo</h1>
        <p className="subtitle">Gestiona tu rancho con precision tecnica.</p>

        <form onSubmit={onSubmit} noValidate>
          <TextField
            id="login-username"
            label="Usuario"
            type="text"
            placeholder="admin o nombre@ejemplo.com"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            leftIcon={<UserIcon />}
            required
          />

          <TextField
            id="login-password"
            label="Contrasena"
            rightHint="Olvidaste tu contrasena?"
            type={showPassword ? 'text' : 'password'}
            placeholder="************"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            leftIcon={<LockIcon />}
            trailing={(
              <button
                type="button"
                className="ui-field__toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              >
                <EyeIcon open={showPassword} />
              </button>
            )}
            required
          />

          <Button type="submit" fullWidth disabled={submitting || status === 'booting'} className="btn-login">
            {submitting ? 'Validando...' : 'Iniciar sesion'}
            <ArrowIcon />
          </Button>

          {apiError ? <p className="error-banner">{apiError}</p> : null}

          <p className="login-footer">
            No tienes cuenta?
            <Button type="button" variant="link" className="login-footer__link" onClick={onGoRegister}>
              Registrate
            </Button>
          </p>

          <p className="api-note">API activa: {env.apiBaseUrl}</p>

          <div className="security-badge">
            <ShieldIcon />
            Conexion cifrada de alta seguridad
          </div>
        </form>
      </article>
    </section>
  );
}
