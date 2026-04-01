import { useState, type FormEvent } from 'react';
import { env } from '../../../config/env';
import { useAuth } from '../auth-context';
import { Button, TextField } from '../../../shared/ui';

interface LoginViewProps {
  onGoRegister: () => void;
}

export function LoginView({ onGoRegister }: LoginViewProps) {
  const { login, apiError, clearApiError, status } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('SiggabAdmin2026!');
  const [submitting, setSubmitting] = useState(false);

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
    <section className="auth-login-shell">
      <article className="login-card" aria-live="polite">
        <span className="login-card__watermark">#ALP24</span>

        <h1>Bienvenido de nuevo</h1>
        <p className="login-card__subtitle">Gestiona tu rancho con precision tecnica.</p>

        <form className="login-form" onSubmit={onSubmit} noValidate>
          <TextField
            id="login-username"
            label="Correo electronico"
            type="text"
            placeholder="nombre@ejemplo.com"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <TextField
            id="login-password"
            label="Contrasena"
            type="password"
            placeholder="********"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            rightHint="¿Olvidaste tu contrasena?"
            rightHintAction={() => {}}
            required
          />

          <Button
            type="submit"
            fullWidth
            disabled={submitting || status === 'booting'}
            className="login-form__submit"
          >
            {submitting ? 'Validando...' : 'Iniciar sesion'}
          </Button>

          {apiError ? <p className="error-banner">{apiError}</p> : null}

          <p className="login-meta">API activa: {env.apiBaseUrl}</p>
          <p className="login-meta">Tip: 5 intentos fallidos disparan bloqueo 423.</p>
        </form>

        <p className="login-switch">
          ¿No tienes cuenta?
          <Button type="button" variant="link" className="login-switch__btn" onClick={onGoRegister}>
            Registrate
          </Button>
        </p>
      </article>

      <p className="security-pill">Conexion cifrada de alta seguridad</p>
    </section>
  );
}
