import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { Button } from '../../../shared/ui';
import { usersApi } from '../users-api';
import type { Rol, Usuario } from '../users-types';
import {
  formatRoleLabel,
  getUsersErrorMessage,
  getUsersFieldErrors,
  isAdministratorRole,
} from '../users-utils';
import { ApiClientError } from '../../../types/api';

interface UsersAdminPageProps {
  onGoHome: () => void;
  onNavigateModule?: (moduleName: string) => void;
}

interface FormState {
  nombreCompleto: string;
  username: string;
  idRol: string;
  password: string;
}

interface FormErrors {
  nombreCompleto?: string;
  username?: string;
  idRol?: string;
  password?: string;
}

interface UiMessage {
  type: 'error' | 'success' | 'warn';
  text: string;
}

const NAV_ITEMS = [
  'Dashboard',
  'Ganado',
  'Produccion',
  'Inventario',
  'Reportes',
  'Aprobaciones',
  'Auditoria',
  'Usuarios',
  'Respaldos',
];

const EMPTY_FORM: FormState = {
  nombreCompleto: '',
  username: '',
  idRol: '',
  password: '',
};

function buildUpdatePayload(currentUser: Usuario, form: FormState) {
  const nombreCompleto = form.nombreCompleto.trim();
  const username = form.username.trim();
  const idRol = Number(form.idRol);
  const password = form.password.trim();

  const payload: {
    nombreCompleto?: string;
    username?: string;
    idRol?: number;
    password?: string;
  } = {};

  if (nombreCompleto !== currentUser.nombreCompleto) payload.nombreCompleto = nombreCompleto;
  if (username !== currentUser.username) payload.username = username;
  if (idRol !== currentUser.idRol) payload.idRol = idRol;
  if (password) payload.password = password;

  return payload;
}

function validateForm(form: FormState, editingId: number | null): FormErrors {
  const errors: FormErrors = {};
  const nombre = form.nombreCompleto.trim();
  const username = form.username.trim();
  const password = form.password.trim();
  const idRol = Number(form.idRol);

  if (nombre.length < 3) {
    errors.nombreCompleto = 'El nombre completo debe tener al menos 3 caracteres.';
  } else if (nombre.length > 100) {
    errors.nombreCompleto = 'El nombre completo no puede exceder 100 caracteres.';
  }

  if (username.length < 3) {
    errors.username = 'El username debe tener al menos 3 caracteres.';
  } else if (username.length > 50) {
    errors.username = 'El username no puede exceder 50 caracteres.';
  } else if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    errors.username = 'Solo se permiten letras, numeros, puntos y guiones bajos.';
  }

  if (!form.idRol || !Number.isInteger(idRol) || idRol <= 0) {
    errors.idRol = 'Selecciona un rol valido.';
  }

  if (!editingId && password.length < 8) {
    errors.password = 'La contrasena temporal debe tener al menos 8 caracteres.';
  } else if (!editingId || password) {
    if (password && password.length > 100) {
      errors.password = 'La contrasena no puede exceder 100 caracteres.';
    } else if (password && !/[A-Z]/.test(password)) {
      errors.password = 'La contrasena debe contener al menos una mayuscula.';
    } else if (password && !/[a-z]/.test(password)) {
      errors.password = 'La contrasena debe contener al menos una minuscula.';
    } else if (password && !/[0-9]/.test(password)) {
      errors.password = 'La contrasena debe contener al menos un numero.';
    }
  }

  return errors;
}

export function UsersAdminPage({ onGoHome, onNavigateModule }: UsersAdminPageProps) {
  const { user, logout } = useAuth();

  const [roles, setRoles] = useState<Rol[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<UiMessage | null>(null);

  const canManageUsers = useMemo(() => isAdministratorRole(user?.rol), [user?.rol]);

  const handleApiError = useCallback(async (error: unknown) => {
    const nextMessage = getUsersErrorMessage(error);
    setMessage({ type: 'error', text: nextMessage });

    if (error instanceof ApiClientError && error.status === 401) {
      await logout();
    }
  }, [logout]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesResponse, usuariosResponse] = await Promise.all([
        usersApi.getRoles(),
        usersApi.getUsuarios(),
      ]);
      setRoles(rolesResponse);
      setUsuarios(usuariosResponse);
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onSelectEdit = (usuarioSeleccionado: Usuario) => {
    setEditingId(usuarioSeleccionado.idUsuario);
    setForm({
      nombreCompleto: usuarioSeleccionado.nombreCompleto,
      username: usuarioSeleccionado.username,
      idRol: String(usuarioSeleccionado.idRol),
      password: '',
    });
    setErrors({});
    setMessage(null);
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const onSave = async () => {
    const validationErrors = validateForm(form, editingId);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setSaving(true);
      setMessage(null);

      if (editingId) {
        const currentUser = usuarios.find((u) => u.idUsuario === editingId);
        if (!currentUser) {
          setMessage({ type: 'error', text: 'No se encontro el usuario para actualizar.' });
          return;
        }

        const payload = buildUpdatePayload(currentUser, form);
        if (Object.keys(payload).length === 0) {
          setMessage({ type: 'warn', text: 'No hay cambios por guardar.' });
          return;
        }

        const updatedUser = await usersApi.updateUsuario(editingId, payload);
        setUsuarios((prev) => prev.map((u) => (u.idUsuario === editingId ? updatedUser : u)));
        setMessage({ type: 'success', text: 'Usuario actualizado correctamente.' });
      } else {
        const createdUser = await usersApi.createUsuario({
          nombreCompleto: form.nombreCompleto.trim(),
          username: form.username.trim(),
          idRol: Number(form.idRol),
          password: form.password.trim(),
        });
        setUsuarios((prev) => [createdUser, ...prev]);
        setMessage({ type: 'success', text: 'Usuario creado correctamente.' });
      }

      onCancelEdit();
    } catch (error) {
      const backendFieldErrors = getUsersFieldErrors(error);

      if (Object.keys(backendFieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...backendFieldErrors }));
      }

      if (error instanceof ApiClientError && error.status === 409) {
        setErrors((prev) => ({ ...prev, username: getUsersErrorMessage(error) }));
      }
      await handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const onToggleEstado = async (targetUser: Usuario) => {
    if (!user) return;

    if (targetUser.idUsuario === user.idUsuario) {
      setMessage({ type: 'warn', text: 'No puedes desactivar tu propia cuenta.' });
      return;
    }

    try {
      setTogglingId(targetUser.idUsuario);
      setMessage(null);
      const updatedUser = await usersApi.updateEstadoUsuario(targetUser.idUsuario, !targetUser.activo);
      setUsuarios((prev) => prev.map((u) => (u.idUsuario === targetUser.idUsuario ? updatedUser : u)));
      setMessage({
        type: 'success',
        text: `Usuario ${updatedUser.activo ? 'activado' : 'desactivado'} correctamente.`,
      });
    } catch (error) {
      await handleApiError(error);
    } finally {
      setTogglingId(null);
    }
  };

  const isEditing = (idUsuario: number) => editingId === idUsuario;
  const onNavigate = (moduleName: string) => {
    if (onNavigateModule) {
      onNavigateModule(moduleName);
      return;
    }
    onGoHome();
  };

  return (
    <section className="users-admin-shell">
      <aside className="users-admin-sidebar">
        <div className="users-admin-sidebar__logo">
          <img src="/branding/logo-rancho-los-alpes.png" alt="Logo Rancho Los Alpes" />
        </div>

        <nav className="users-admin-sidebar__nav" aria-label="Navegacion de modulos">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              data-testid={`users-nav-${item.toLowerCase()}`}
              className={`users-admin-sidebar__nav-item ${item === 'Usuarios' ? 'is-active' : ''}`}
              onClick={item === 'Usuarios' ? undefined : () => onNavigate(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <footer className="users-admin-sidebar__footer">
          <p>{user?.nombreCompleto || 'Usuario'}</p>
          <small>{user?.rol || 'Sin rol'}</small>
          <Button
            type="button"
            className="users-admin-sidebar__logout"
            onClick={logout}
            data-testid="users-sidebar-logout-button"
          >
            Cerrar sesion
          </Button>
        </footer>
      </aside>

      <main className="users-admin-main">
        <header className="users-admin-main__header" data-testid="users-admin-header">
          <h1>Usuarios</h1>
          <p>Gestion de usuarios y roles</p>
        </header>

        <div className="users-admin-main__body">
          {!canManageUsers ? (
            <article className="users-admin-empty">
              <h2>Acceso restringido</h2>
              <p>Solo el rol Administrador puede gestionar usuarios y roles.</p>
              <Button type="button" variant="ghost" onClick={onGoHome}>
                Volver
              </Button>
            </article>
          ) : loading ? (
            <article className="users-admin-empty">
              <h2>Cargando datos...</h2>
              <p>Consultando roles y usuarios del backend.</p>
            </article>
          ) : (
            <div className="users-admin-grid">
              <article className="users-admin-card">
                <div className="users-admin-card__title">
                  <h2>{editingId ? 'Editar usuario' : 'Crear usuario'}</h2>
                  {editingId ? (
                    <Button type="button" variant="ghost" onClick={onCancelEdit}>
                      Cancelar
                    </Button>
                  ) : null}
                </div>

                <label className="users-field">
                  <span>Nombre completo</span>
                  <input
                    type="text"
                    data-testid="users-form-nombre-completo"
                    value={form.nombreCompleto}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, nombreCompleto: event.target.value }));
                      setErrors((prev) => ({ ...prev, nombreCompleto: undefined }));
                    }}
                    placeholder="Ej. Juan Perez"
                  />
                  {errors.nombreCompleto ? <small>{errors.nombreCompleto}</small> : null}
                </label>

                <label className="users-field">
                  <span>Username</span>
                  <input
                    type="text"
                    data-testid="users-form-username"
                    value={form.username}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, username: event.target.value }));
                      setErrors((prev) => ({ ...prev, username: undefined }));
                    }}
                    placeholder="usuario"
                  />
                  {errors.username ? <small>{errors.username}</small> : null}
                </label>

                <label className="users-field">
                  <span>Rol</span>
                  <select
                    data-testid="users-form-id-rol"
                    value={form.idRol}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, idRol: event.target.value }));
                      setErrors((prev) => ({ ...prev, idRol: undefined }));
                    }}
                  >
                    <option value="">Selecciona un rol</option>
                    {roles.map((rol) => (
                      <option key={rol.idRol} value={rol.idRol}>
                        {rol.nombreRol}
                      </option>
                    ))}
                  </select>
                  {errors.idRol ? <small>{errors.idRol}</small> : null}
                </label>

                <label className="users-field">
                  <span>{editingId ? 'Nueva contrasena (opcional)' : 'Contrasena temporal'}</span>
                  <input
                    type="password"
                    data-testid="users-form-password"
                    value={form.password}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, password: event.target.value }));
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder={editingId ? 'Solo si deseas cambiarla' : 'Minimo 8 caracteres'}
                  />
                  {errors.password ? <small>{errors.password}</small> : null}
                </label>

                <Button type="button" fullWidth disabled={saving} onClick={onSave} data-testid="users-form-save-button">
                  {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar usuario'}
                </Button>

                {message ? (
                  <p className={`users-message users-message--${message.type}`} data-testid="users-form-message">
                    {message.text}
                  </p>
                ) : null}
              </article>

              <article className="users-admin-card">
                <div className="users-admin-card__title">
                  <h2>Cuentas registradas</h2>
                  <small>{usuarios.length} usuarios</small>
                </div>

                <div className="users-list" data-testid="users-list">
                  {usuarios.map((usuarioActual) => {
                    const isSelf = user?.idUsuario === usuarioActual.idUsuario;

                    return (
                      <article
                        key={usuarioActual.idUsuario}
                        data-testid={`users-list-item-${usuarioActual.idUsuario}`}
                        className={`users-list-item ${isEditing(usuarioActual.idUsuario) ? 'is-editing' : ''}`}
                      >
                        <div className="users-list-item__head">
                          <strong>{usuarioActual.nombreCompleto}</strong>
                          <span className={`users-status ${usuarioActual.activo ? 'is-active' : ''}`}>
                            {usuarioActual.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </div>

                        <p>
                          @{usuarioActual.username}
                          {' | '}
                          {formatRoleLabel(usuarioActual.rol?.nombreRol || 'Sin rol')}
                        </p>
                        <p>
                          Intentos fallidos: {usuarioActual.intentosFallidos}
                          {' | '}
                          Bloqueada: {usuarioActual.bloqueadoHasta ? 'Si' : 'No'}
                        </p>

                        <div className="users-list-item__actions">
                          <Button
                            type="button"
                            variant="ghost"
                            data-testid={`users-edit-button-${usuarioActual.idUsuario}`}
                            onClick={() => (isEditing(usuarioActual.idUsuario) ? onCancelEdit() : onSelectEdit(usuarioActual))}
                          >
                            {isEditing(usuarioActual.idUsuario) ? 'Cancelando...' : 'Editar'}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            className={usuarioActual.activo ? 'users-btn-danger' : 'users-btn-success'}
                            disabled={isSelf || togglingId === usuarioActual.idUsuario}
                            data-testid={`users-toggle-button-${usuarioActual.idUsuario}`}
                            onClick={() => onToggleEstado(usuarioActual)}
                          >
                            {togglingId === usuarioActual.idUsuario
                              ? 'Procesando...'
                              : usuarioActual.activo
                                ? 'Desactivar'
                                : 'Activar'}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </article>
            </div>
          )}
        </div>
      </main>
    </section>
  );
}
