import { useState, type FormEvent } from 'react';
import { env } from '../../../config/env';
import { useAuth } from '../auth-context';
import { Button, TextField, User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from '../../../shared/ui';

export function LoginView() {
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
    } catch {
      // El error se refleja en `apiError` desde el contexto de autenticacion.
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
            data-testid="login-username-input"
            placeholder="Ej: admin"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            leftIcon={<User size={16} aria-hidden />}
            required
          />

          <TextField
            id="login-password"
            label="Contrasena"
            data-testid="login-password-input"
            rightHint="Olvidaste tu contrasena?"
            type={showPassword ? 'text' : 'password'}
            placeholder="************"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            leftIcon={<Lock size={15} aria-hidden />}
            trailing={(
              <button
                type="button"
                className="ui-field__toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              >
                {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              </button>
            )}
            required
          />

          <Button
            type="submit"
            fullWidth
            disabled={submitting || status === 'booting'}
            className="btn-login"
            data-testid="login-submit-button"
          >
            {submitting ? 'Validando...' : 'Iniciar sesion'}
            <ArrowRight size={16} aria-hidden />
          </Button>

          {apiError ? <p className="error-banner" data-testid="login-error-banner">{apiError}</p> : null}


          <p className="api-note">API activa: {env.apiBaseUrl}</p>

          <div className="security-badge">
            <ShieldCheck size={13} aria-hidden />
            Conexion cifrada de alta seguridad
          </div>
        </form>
      </article>
    </section>
  );
}
