import { useState, type FormEvent } from 'react';
import { Button, TextField } from '../../../shared/ui';

interface RegisterMockViewProps {
  onGoLogin: () => void;
}

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20C4 16 7.6 13 12 13C16.4 13 20 16 20 20" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M22 7L13.03 12.7C12.41 13.09 11.59 13.09 10.97 12.7L2 7" stroke="currentColor" strokeWidth="2" />
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

export function RegisterMockView({ onGoLogin }: RegisterMockViewProps) {
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <section className="auth-view auth-view--register" aria-label="Pantalla de registro">
      <article className="register-card">
        <aside className="register-panel">
          <img
            src="/branding/logo-rancho-los-alpes.png"
            alt="Logo Rancho Los Alpes"
            className="register-panel__logo"
          />
          <h1 className="panel-headline">
            El futuro del campo,
            <br />
            <span className="accent">trazado hoy.</span>
          </h1>
          <p className="panel-body">
            Unete a la red de ganaderia inteligente mas avanzada de la region.
            Monitoreo, trazabilidad y gestion en la palma de tu mano.
          </p>
        </aside>

        <div className="register-form-wrap">
          <h2>Crear cuenta</h2>
          <p className="subtitle">Comienza tu viaje hacia una gestion ganadera digital.</p>

          <form onSubmit={onSubmit}>
            <TextField label="Nombre completo" type="text" placeholder="Ej. Juan Perez" leftIcon={<UserIcon />} />
            <TextField label="Correo electronico" type="email" placeholder="tu@siggab.com" leftIcon={<MailIcon />} />
            <TextField
              label="Contrasena"
              type={showPassword ? 'text' : 'password'}
              placeholder="************"
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
            />

            <label className="checkbox-wrap">
              <input
                type="checkbox"
                checked={acceptedPolicy}
                onChange={(event) => setAcceptedPolicy(event.target.checked)}
              />
              <span>Acepto el aviso de privacidad y los terminos de servicio de Rancho Los Alpes.</span>
            </label>

            <Button type="submit" fullWidth className="btn-register" disabled={!acceptedPolicy}>
              Crear cuenta
            </Button>
          </form>

          <p className="register-footer">
            Ya tienes una cuenta?
            <Button type="button" variant="link" className="register-footer__link" onClick={onGoLogin}>
              Inicia sesion
            </Button>
          </p>
        </div>
      </article>
    </section>
  );
}
