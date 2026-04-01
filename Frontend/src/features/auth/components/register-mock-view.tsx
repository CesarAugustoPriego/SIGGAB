import { Button, TextField } from '../../../shared/ui';

interface RegisterMockViewProps {
  onGoLogin: () => void;
}

export function RegisterMockView({ onGoLogin }: RegisterMockViewProps) {
  return (
    <section className="register-shell">
      <aside className="register-shell__visual">
        <img
          src="/placeholders/register-side-placeholder.svg"
          alt="Espacio para imagen lateral del registro"
          className="register-shell__image"
        />
        <div className="register-shell__copy">
          <h2>El futuro del campo, trazado hoy.</h2>
          <p>Espacio listo para tu arte final de branding y mensaje comercial.</p>
        </div>
      </aside>

      <article className="register-card">
        <h2>Crear cuenta</h2>
        <p>Maqueta lista para integrar flujo real en el siguiente checkpoint.</p>

        <TextField label="Nombre completo" type="text" placeholder="Ej. Juan Perez" disabled />
        <TextField label="Correo electronico" type="email" placeholder="tu@siggab.com" disabled />
        <TextField label="Contrasena" type="password" placeholder="********" disabled />

        <Button type="button" fullWidth disabled>
          Crear cuenta (proximo)
        </Button>

        <p className="register-switch">
          ¿Ya tienes cuenta?
          <Button type="button" variant="link" className="register-switch__btn" onClick={onGoLogin}>
            Inicia sesion
          </Button>
        </p>
      </article>
    </section>
  );
}
