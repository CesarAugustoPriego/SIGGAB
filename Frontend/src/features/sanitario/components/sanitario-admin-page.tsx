import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import type { Animal } from '../../ganado/ganado-types';
import { Button, NAV_ITEMS, LogOut, Save, Plus, X, Calendar } from '../../../shared/ui';
import { ApiClientError } from '../../../types/api';
import { sanitarioApi } from '../sanitario-api';
import type {
  CalendarioSanitario,
  EstadoAprobacionSanitaria,
  EstadoCalendarioSanitario,
  EventoSanitario,
  TipoEventoSanitario,
} from '../sanitario-types';
import {
  canAprobarEventoSanitario,
  canCreateEventoSanitario,
  canEditEventoSanitario,
  canListSanitario,
  canManageCalendarioSanitario,
  canViewAlertasSanitarias,
  canViewSanitario,
  formatEstadoAprobacion,
  formatEstadoCalendario,
  getSanitarioErrorMessage,
  getSanitarioFieldErrors,
  toInputDate,
} from '../sanitario-utils';

interface SanitarioAdminPageProps {
  onGoHome: () => void;
  onGoUsersAdmin?: () => void;
  onNavigateModule?: (moduleName: string) => void;
}

interface UiMessage {
  type: 'error' | 'success' | 'warn';
  text: string;
}

interface EventoFormState {
  idAnimal: string;
  idTipoEvento: string;
  fechaEvento: string;
  diagnostico: string;
  medicamento: string;
  dosis: string;
}

interface CalendarioFormState {
  idAnimal: string;
  idTipoEvento: string;
  fechaProgramada: string;
  fechaAlerta: string;
}



const EMPTY_EVENTO_FORM: EventoFormState = {
  idAnimal: '',
  idTipoEvento: '',
  fechaEvento: new Date().toISOString().slice(0, 10),
  diagnostico: '',
  medicamento: '',
  dosis: '',
};

const EMPTY_CALENDARIO_FORM: CalendarioFormState = {
  idAnimal: '',
  idTipoEvento: '',
  fechaProgramada: '',
  fechaAlerta: '',
};

function formatDate(dateValue?: string | null) {
  const value = toInputDate(dateValue);
  if (!value) return 'N/A';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function validateEventoForm(form: EventoFormState) {
  const errors: Partial<Record<keyof EventoFormState, string>> = {};
  if (!form.idAnimal) errors.idAnimal = 'Selecciona un animal.';
  if (!form.idTipoEvento) errors.idTipoEvento = 'Selecciona un tipo de evento.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fechaEvento)) errors.fechaEvento = 'Fecha invalida.';
  return errors;
}

function validateCalendarioForm(form: CalendarioFormState) {
  const errors: Partial<Record<keyof CalendarioFormState, string>> = {};
  if (!form.idAnimal) errors.idAnimal = 'Selecciona un animal.';
  if (!form.idTipoEvento) errors.idTipoEvento = 'Selecciona un tipo de evento.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fechaProgramada)) errors.fechaProgramada = 'Fecha invalida.';
  if (form.fechaAlerta && !/^\d{4}-\d{2}-\d{2}$/.test(form.fechaAlerta)) errors.fechaAlerta = 'Fecha invalida.';
  return errors;
}

function toEventoClass(estado: EstadoAprobacionSanitaria) {
  if (estado === 'APROBADO') return 'is-approved';
  if (estado === 'RECHAZADO') return 'is-rejected';
  return 'is-pending';
}

function toCalendarioClass(estado: EstadoCalendarioSanitario) {
  if (estado === 'COMPLETADO') return 'is-completed';
  if (estado === 'CANCELADO') return 'is-cancelled';
  return 'is-pending';
}

export function SanitarioAdminPage({ onGoHome, onGoUsersAdmin, onNavigateModule }: SanitarioAdminPageProps) {
  const { user, logout } = useAuth();

  const [animales, setAnimales] = useState<Animal[]>([]);
  const [tiposEvento, setTiposEvento] = useState<TipoEventoSanitario[]>([]);
  const [eventos, setEventos] = useState<EventoSanitario[]>([]);
  const [calendario, setCalendario] = useState<CalendarioSanitario[]>([]);
  const [alertas, setAlertas] = useState<CalendarioSanitario[]>([]);

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [loadingCalendario, setLoadingCalendario] = useState(true);
  const [loadingAlertas, setLoadingAlertas] = useState(true);

  const [savingEvento, setSavingEvento] = useState(false);
  const [savingCalendario, setSavingCalendario] = useState(false);
  const [processingEventoId, setProcessingEventoId] = useState<number | null>(null);
  const [processingCalendarioId, setProcessingCalendarioId] = useState<number | null>(null);

  const [eventoForm, setEventoForm] = useState<EventoFormState>(EMPTY_EVENTO_FORM);
  const [eventoErrors, setEventoErrors] = useState<Partial<Record<keyof EventoFormState, string>>>({});
  const [editingEventoId, setEditingEventoId] = useState<number | null>(null);

  const [calendarioForm, setCalendarioForm] = useState<CalendarioFormState>(EMPTY_CALENDARIO_FORM);
  const [calendarioErrors, setCalendarioErrors] = useState<Partial<Record<keyof CalendarioFormState, string>>>({});
  const [editingCalendarioId, setEditingCalendarioId] = useState<number | null>(null);

  const [eventoFilters, setEventoFilters] = useState({
    idAnimal: '',
    idTipoEvento: '',
    estadoAprobacion: 'TODOS' as EstadoAprobacionSanitaria | 'TODOS',
  });

  const [calendarioFilters, setCalendarioFilters] = useState({
    idAnimal: '',
    estado: 'TODOS' as EstadoCalendarioSanitario | 'TODOS',
  });

  const [alertaDias, setAlertaDias] = useState(3);
  const [message, setMessage] = useState<UiMessage | null>(null);

  const canView = useMemo(() => canViewSanitario(user?.rol), [user?.rol]);
  const canList = useMemo(() => canListSanitario(user?.rol), [user?.rol]);
  const canCreate = useMemo(() => canCreateEventoSanitario(user?.rol), [user?.rol]);
  const canEdit = useMemo(() => canEditEventoSanitario(user?.rol), [user?.rol]);
  const canApprove = useMemo(() => canAprobarEventoSanitario(user?.rol), [user?.rol]);
  const canManageCalendario = useMemo(() => canManageCalendarioSanitario(user?.rol), [user?.rol]);
  const canViewAlertas = useMemo(() => canViewAlertasSanitarias(user?.rol), [user?.rol]);

  const animalById = useMemo(() => {
    const map = new Map<number, Animal>();
    for (const animal of animales) map.set(animal.idAnimal, animal);
    return map;
  }, [animales]);

  const tipoById = useMemo(() => {
    const map = new Map<number, TipoEventoSanitario>();
    for (const tipo of tiposEvento) map.set(tipo.idTipoEvento, tipo);
    return map;
  }, [tiposEvento]);

  const handleApiError = useCallback(async (error: unknown) => {
    setMessage({ type: 'error', text: getSanitarioErrorMessage(error) });
    if (error instanceof ApiClientError && error.status === 401) await logout();
  }, [logout]);

  const loadCatalogs = useCallback(async () => {
    const [animalesResponse, tiposResponse] = await Promise.all([
      sanitarioApi.getAnimalesActivos(),
      sanitarioApi.getTiposEvento(),
    ]);
    setAnimales(animalesResponse);
    setTiposEvento(tiposResponse.filter((item) => item.activo !== false));
  }, []);

  const loadEventos = useCallback(async () => {
    if (!canList) {
      setEventos([]);
      setLoadingEventos(false);
      return;
    }

    try {
      setLoadingEventos(true);
      const data = await sanitarioApi.getEventos({
        idAnimal: eventoFilters.idAnimal ? Number(eventoFilters.idAnimal) : undefined,
        idTipoEvento: eventoFilters.idTipoEvento ? Number(eventoFilters.idTipoEvento) : undefined,
        estadoAprobacion: eventoFilters.estadoAprobacion === 'TODOS' ? undefined : eventoFilters.estadoAprobacion,
      });
      setEventos(data);
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoadingEventos(false);
    }
  }, [canList, eventoFilters.estadoAprobacion, eventoFilters.idAnimal, eventoFilters.idTipoEvento, handleApiError]);

  const loadCalendario = useCallback(async () => {
    if (!canList) {
      setCalendario([]);
      setLoadingCalendario(false);
      return;
    }

    try {
      setLoadingCalendario(true);
      const data = await sanitarioApi.getCalendario({
        idAnimal: calendarioFilters.idAnimal ? Number(calendarioFilters.idAnimal) : undefined,
        estado: calendarioFilters.estado === 'TODOS' ? undefined : calendarioFilters.estado,
      });
      setCalendario(data);
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoadingCalendario(false);
    }
  }, [calendarioFilters.estado, calendarioFilters.idAnimal, canList, handleApiError]);

  const loadAlertas = useCallback(async () => {
    if (!canViewAlertas) {
      setAlertas([]);
      setLoadingAlertas(false);
      return;
    }

    try {
      setLoadingAlertas(true);
      setAlertas(await sanitarioApi.getAlertas(alertaDias));
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoadingAlertas(false);
    }
  }, [alertaDias, canViewAlertas, handleApiError]);

  useEffect(() => {
    if (!canView) {
      setLoadingInit(false);
      return;
    }

    void (async () => {
      try {
        await loadCatalogs();
        await Promise.all([loadEventos(), loadCalendario(), loadAlertas()]);
      } catch (error) {
        await handleApiError(error);
      } finally {
        setLoadingInit(false);
      }
    })();
  }, [canView, handleApiError, loadAlertas, loadCalendario, loadCatalogs, loadEventos]);

  useEffect(() => {
    if (!canView || loadingInit) return;
    void loadEventos();
  }, [canView, loadingInit, loadEventos]);

  useEffect(() => {
    if (!canView || loadingInit) return;
    void loadCalendario();
  }, [canView, loadingInit, loadCalendario]);

  useEffect(() => {
    if (!canView || loadingInit) return;
    void loadAlertas();
  }, [canView, loadingInit, loadAlertas]);

  const onNavigate = (moduleName: string) => {
    if (moduleName === 'Usuarios' && onGoUsersAdmin) {
      onGoUsersAdmin();
      return;
    }

    if (onNavigateModule) {
      onNavigateModule(moduleName);
      return;
    }

    onGoHome();
  };

  const onSaveEvento = async () => {
    const errors = validateEventoForm(eventoForm);
    setEventoErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!canCreate) {
      setMessage({ type: 'warn', text: 'Tu rol no puede registrar eventos sanitarios.' });
      return;
    }

    try {
      setSavingEvento(true);
      setMessage(null);

      if (editingEventoId) {
        if (!canEdit) {
          setMessage({ type: 'warn', text: 'Solo el Medico Veterinario puede editar eventos sanitarios.' });
          return;
        }

        const updated = await sanitarioApi.updateEvento(editingEventoId, {
          idTipoEvento: Number(eventoForm.idTipoEvento),
          fechaEvento: eventoForm.fechaEvento,
          diagnostico: eventoForm.diagnostico.trim() || undefined,
          medicamento: eventoForm.medicamento.trim() || undefined,
          dosis: eventoForm.dosis.trim() || undefined,
        });
        setEventos((prev) => prev.map((item) => (item.idEvento === updated.idEvento ? updated : item)));
        setMessage({ type: 'success', text: 'Evento sanitario actualizado correctamente.' });
      } else {
        const created = await sanitarioApi.createEvento({
          idAnimal: Number(eventoForm.idAnimal),
          idTipoEvento: Number(eventoForm.idTipoEvento),
          fechaEvento: eventoForm.fechaEvento,
          diagnostico: eventoForm.diagnostico.trim() || undefined,
          medicamento: eventoForm.medicamento.trim() || undefined,
          dosis: eventoForm.dosis.trim() || undefined,
        });
        if (canList) setEventos((prev) => [created, ...prev]);
        setMessage({ type: 'success', text: 'Evento sanitario registrado correctamente.' });
      }

      setEventoForm(EMPTY_EVENTO_FORM);
      setEventoErrors({});
      setEditingEventoId(null);
    } catch (error) {
      const fe = getSanitarioFieldErrors(error);
      setEventoErrors((prev) => ({ ...prev, ...fe }));
      await handleApiError(error);
    } finally {
      setSavingEvento(false);
    }
  };

  const onSaveCalendario = async () => {
    const errors = validateCalendarioForm(calendarioForm);
    setCalendarioErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!canManageCalendario) {
      setMessage({ type: 'warn', text: 'Solo el Medico Veterinario puede gestionar el calendario sanitario.' });
      return;
    }

    try {
      setSavingCalendario(true);
      setMessage(null);

      if (editingCalendarioId) {
        const updated = await sanitarioApi.updateCalendario(editingCalendarioId, {
          idTipoEvento: Number(calendarioForm.idTipoEvento),
          fechaProgramada: calendarioForm.fechaProgramada,
          fechaAlerta: calendarioForm.fechaAlerta.trim() || null,
        });
        setCalendario((prev) => prev.map((item) => (item.idCalendario === updated.idCalendario ? updated : item)));
        setMessage({ type: 'success', text: 'Calendario sanitario actualizado correctamente.' });
      } else {
        const created = await sanitarioApi.createCalendario({
          idAnimal: Number(calendarioForm.idAnimal),
          idTipoEvento: Number(calendarioForm.idTipoEvento),
          fechaProgramada: calendarioForm.fechaProgramada,
          fechaAlerta: calendarioForm.fechaAlerta.trim() || undefined,
        });
        if (canList) setCalendario((prev) => [created, ...prev]);
        setMessage({ type: 'success', text: 'Evento programado correctamente.' });
      }

      setCalendarioForm(EMPTY_CALENDARIO_FORM);
      setCalendarioErrors({});
      setEditingCalendarioId(null);
      await loadAlertas();
    } catch (error) {
      const fe = getSanitarioFieldErrors(error);
      setCalendarioErrors((prev) => ({ ...prev, ...fe }));
      await handleApiError(error);
    } finally {
      setSavingCalendario(false);
    }
  };

  const onAprobarEvento = async (idEvento: number, estadoAprobacion: 'APROBADO' | 'RECHAZADO') => {
    try {
      setProcessingEventoId(idEvento);
      const updated = await sanitarioApi.aprobarEvento(idEvento, { estadoAprobacion });
      setEventos((prev) => prev.map((item) => (item.idEvento === idEvento ? updated : item)));
      setMessage({
        type: 'success',
        text: estadoAprobacion === 'APROBADO' ? 'Evento aprobado correctamente.' : 'Evento rechazado correctamente.',
      });
    } catch (error) {
      await handleApiError(error);
    } finally {
      setProcessingEventoId(null);
    }
  };

  const onCompletarCalendario = async (idCalendario: number, estado: 'COMPLETADO' | 'CANCELADO') => {
    try {
      setProcessingCalendarioId(idCalendario);
      const updated = await sanitarioApi.completarCalendario(idCalendario, { estado });
      setCalendario((prev) => prev.map((item) => (item.idCalendario === idCalendario ? updated : item)));
      setMessage({
        type: 'success',
        text: estado === 'COMPLETADO' ? 'Evento marcado como completado.' : 'Evento marcado como cancelado.',
      });
      await loadAlertas();
    } catch (error) {
      await handleApiError(error);
    } finally {
      setProcessingCalendarioId(null);
    }
  };

  if (!canView) {
    return (
      <section className="users-admin-shell">
        <main className="users-admin-main">
          <header className="users-admin-main__header" data-testid="sanitario-admin-header">
            <h1>Sanitario</h1>
            <p>Gestion sanitaria del hato bovino</p>
          </header>
          <div className="users-admin-main__body">
            <article className="users-admin-empty">
              <h2>Acceso restringido</h2>
              <p>Tu rol no tiene permisos para este modulo.</p>
              <Button type="button" variant="ghost" onClick={onGoHome}>Volver</Button>
            </article>
          </div>
        </main>
      </section>
    );
  }

  return (
    <section className="users-admin-shell">
      <aside className="users-admin-sidebar">
        <div className="users-admin-sidebar__logo">
          <img src="/branding/logo-rancho-los-alpes.png" alt="Logo Rancho Los Alpes" />
        </div>

        <nav className="users-admin-sidebar__nav" aria-label="Navegacion de modulos">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
            <button
              key={item.label}
              type="button"
              data-testid={`sanitario-nav-${item.label.toLowerCase()}`}
              className={`users-admin-sidebar__nav-item ${item.label === 'Sanitario' ? 'is-active' : ''}`}
              onClick={item.label === 'Sanitario' ? undefined : () => onNavigate(item.label)}
            >
              <Icon size={18} aria-hidden /> {item.label}
            </button>
            );
          })}
        </nav>

        <footer className="users-admin-sidebar__footer">
          <p>{user?.nombreCompleto || 'Usuario'}</p>
          <small>{user?.rol || 'Sin rol'}</small>
          <Button type="button" className="users-admin-sidebar__logout" onClick={logout} data-testid="sanitario-sidebar-logout-button">
            <LogOut size={15} aria-hidden /> Cerrar sesion
          </Button>
        </footer>
      </aside>

      <main className="users-admin-main">
        <header className="users-admin-main__header" data-testid="sanitario-admin-header">
          <h1>Sanitario</h1>
          <p>Eventos sanitarios, autorizacion medica y calendario preventivo</p>
        </header>

        <div className="users-admin-main__body">
          {loadingInit ? (
            <article className="users-admin-empty">
              <h2>Cargando modulo sanitario...</h2>
              <p>Consultando catalogos y registros.</p>
            </article>
          ) : (
            <div className={`sanitario-grid ${canList ? '' : 'is-single-column'}`}>
              <div className="sanitario-column">
                <article className="sanitario-card" data-testid="sanitario-evento-form-card">
                  <div className="users-admin-card__title">
                    <h2>{editingEventoId ? 'Editar evento sanitario' : 'Registrar evento sanitario'}</h2>
                    {editingEventoId ? <Button type="button" variant="ghost" onClick={() => { setEditingEventoId(null); setEventoForm(EMPTY_EVENTO_FORM); }}><X size={14} aria-hidden /> Cancelar</Button> : null}
                  </div>

                  {!canCreate ? (
                    <p className="sanitario-helper-message">Tu rol solo puede consultar informacion sanitaria.</p>
                  ) : (
                    <>
                      <label className="sanitario-field"><span>Animal</span><select data-testid="sanitario-form-id-animal" value={eventoForm.idAnimal} onChange={(event) => { setEventoForm((prev) => ({ ...prev, idAnimal: event.target.value })); setEventoErrors((prev) => ({ ...prev, idAnimal: undefined })); }} disabled={editingEventoId !== null}><option value="">Selecciona un arete</option>{animales.map((animal) => <option key={animal.idAnimal} value={animal.idAnimal}>{animal.numeroArete}</option>)}</select>{eventoErrors.idAnimal ? <small>{eventoErrors.idAnimal}</small> : null}</label>
                      <label className="sanitario-field"><span>Tipo de evento</span><select data-testid="sanitario-form-id-tipo" value={eventoForm.idTipoEvento} onChange={(event) => { setEventoForm((prev) => ({ ...prev, idTipoEvento: event.target.value })); setEventoErrors((prev) => ({ ...prev, idTipoEvento: undefined })); }}><option value="">Selecciona tipo</option>{tiposEvento.map((tipo) => <option key={tipo.idTipoEvento} value={tipo.idTipoEvento}>{tipo.nombreTipo}</option>)}</select>{eventoErrors.idTipoEvento ? <small>{eventoErrors.idTipoEvento}</small> : null}</label>
                      <label className="sanitario-field"><span>Fecha del evento</span><input type="date" data-testid="sanitario-form-fecha-evento" value={eventoForm.fechaEvento} onChange={(event) => { setEventoForm((prev) => ({ ...prev, fechaEvento: event.target.value })); setEventoErrors((prev) => ({ ...prev, fechaEvento: undefined })); }} />{eventoErrors.fechaEvento ? <small>{eventoErrors.fechaEvento}</small> : null}</label>
                      <label className="sanitario-field"><span>Diagnostico</span><textarea data-testid="sanitario-form-diagnostico" rows={3} value={eventoForm.diagnostico} onChange={(event) => setEventoForm((prev) => ({ ...prev, diagnostico: event.target.value }))} placeholder="Descripcion clinica" /></label>
                      <div className="sanitario-field-row">
                        <label className="sanitario-field"><span>Medicamento</span><input type="text" data-testid="sanitario-form-medicamento" value={eventoForm.medicamento} onChange={(event) => setEventoForm((prev) => ({ ...prev, medicamento: event.target.value }))} /></label>
                        <label className="sanitario-field"><span>Dosis</span><input type="text" data-testid="sanitario-form-dosis" value={eventoForm.dosis} onChange={(event) => setEventoForm((prev) => ({ ...prev, dosis: event.target.value }))} /></label>
                      </div>
                      <Button type="button" fullWidth disabled={savingEvento} onClick={onSaveEvento} data-testid="sanitario-form-save-evento">{savingEvento ? 'Guardando...' : editingEventoId ? <><Save size={15} aria-hidden /> Guardar cambios</> : <><Plus size={15} aria-hidden /> Registrar evento</>}</Button>
                    </>
                  )}
                </article>

                <article className="sanitario-card" data-testid="sanitario-calendario-form-card">
                  <div className="users-admin-card__title">
                    <h2>{editingCalendarioId ? 'Editar calendario sanitario' : 'Programar calendario sanitario'}</h2>
                    {editingCalendarioId ? <Button type="button" variant="ghost" onClick={() => { setEditingCalendarioId(null); setCalendarioForm(EMPTY_CALENDARIO_FORM); }}><X size={14} aria-hidden /> Cancelar</Button> : null}
                  </div>

                  {!canManageCalendario ? (
                    <p className="sanitario-helper-message">Solo el Medico Veterinario puede gestionar el calendario sanitario.</p>
                  ) : (
                    <>
                      <label className="sanitario-field"><span>Animal</span><select data-testid="sanitario-cal-form-id-animal" value={calendarioForm.idAnimal} onChange={(event) => { setCalendarioForm((prev) => ({ ...prev, idAnimal: event.target.value })); setCalendarioErrors((prev) => ({ ...prev, idAnimal: undefined })); }} disabled={editingCalendarioId !== null}><option value="">Selecciona un arete</option>{animales.map((animal) => <option key={animal.idAnimal} value={animal.idAnimal}>{animal.numeroArete}</option>)}</select>{calendarioErrors.idAnimal ? <small>{calendarioErrors.idAnimal}</small> : null}</label>
                      <label className="sanitario-field"><span>Tipo de evento</span><select data-testid="sanitario-cal-form-id-tipo" value={calendarioForm.idTipoEvento} onChange={(event) => { setCalendarioForm((prev) => ({ ...prev, idTipoEvento: event.target.value })); setCalendarioErrors((prev) => ({ ...prev, idTipoEvento: undefined })); }}><option value="">Selecciona tipo</option>{tiposEvento.map((tipo) => <option key={tipo.idTipoEvento} value={tipo.idTipoEvento}>{tipo.nombreTipo}</option>)}</select>{calendarioErrors.idTipoEvento ? <small>{calendarioErrors.idTipoEvento}</small> : null}</label>
                      <div className="sanitario-field-row">
                        <label className="sanitario-field"><span>Fecha programada</span><input type="date" data-testid="sanitario-cal-form-fecha-programada" value={calendarioForm.fechaProgramada} onChange={(event) => { setCalendarioForm((prev) => ({ ...prev, fechaProgramada: event.target.value })); setCalendarioErrors((prev) => ({ ...prev, fechaProgramada: undefined })); }} />{calendarioErrors.fechaProgramada ? <small>{calendarioErrors.fechaProgramada}</small> : null}</label>
                        <label className="sanitario-field"><span>Fecha alerta</span><input type="date" data-testid="sanitario-cal-form-fecha-alerta" value={calendarioForm.fechaAlerta} onChange={(event) => { setCalendarioForm((prev) => ({ ...prev, fechaAlerta: event.target.value })); setCalendarioErrors((prev) => ({ ...prev, fechaAlerta: undefined })); }} />{calendarioErrors.fechaAlerta ? <small>{calendarioErrors.fechaAlerta}</small> : null}</label>
                      </div>
                      <Button type="button" fullWidth disabled={savingCalendario} onClick={onSaveCalendario} data-testid="sanitario-cal-form-save">{savingCalendario ? 'Guardando...' : editingCalendarioId ? <><Save size={15} aria-hidden /> Guardar cambios</> : <><Calendar size={15} aria-hidden /> Programar evento</>}</Button>
                    </>
                  )}

                  {canViewAlertas ? (
                    <div className="sanitario-alertas-panel">
                      <div className="sanitario-alertas-panel__head">
                        <strong>Alertas sanitarias</strong>
                        <label>Dias<input type="number" min={3} max={30} data-testid="sanitario-alertas-dias" value={alertaDias} onChange={(event) => setAlertaDias(Number(event.target.value) || 3)} /></label>
                      </div>
                      <div className="sanitario-alertas-list" data-testid="sanitario-alertas-list">
                        {loadingAlertas ? <p className="sanitario-helper-message">Cargando alertas...</p> : alertas.length === 0 ? <p className="sanitario-helper-message">Sin alertas activas.</p> : alertas.map((item) => <article key={item.idCalendario} className="sanitario-alert-item"><strong>{item.animal?.numeroArete || animalById.get(item.idAnimal)?.numeroArete || `#${item.idAnimal}`}</strong><p>{item.tipoEvento?.nombreTipo || tipoById.get(item.idTipoEvento)?.nombreTipo || 'Tipo'} · {formatDate(item.fechaProgramada)}</p><small>Alerta: {formatDate(item.fechaAlerta)}</small></article>)}
                      </div>
                    </div>
                  ) : null}
                </article>

                {message ? <p className={`users-message users-message--${message.type}`} data-testid="sanitario-form-message">{message.text}</p> : null}
              </div>

              {canList ? (
                <div className="sanitario-column">
                  <article className="sanitario-card" data-testid="sanitario-eventos-card">
                    <div className="users-admin-card__title"><h2>Eventos sanitarios</h2><small>{eventos.length} registros</small></div>
                    <div className="sanitario-filters">
                      <label className="sanitario-field"><span>Animal</span><select data-testid="sanitario-filter-evento-animal" value={eventoFilters.idAnimal} onChange={(event) => setEventoFilters((prev) => ({ ...prev, idAnimal: event.target.value }))}><option value="">Todos</option>{animales.map((animal) => <option key={animal.idAnimal} value={animal.idAnimal}>{animal.numeroArete}</option>)}</select></label>
                      <label className="sanitario-field"><span>Tipo</span><select data-testid="sanitario-filter-evento-tipo" value={eventoFilters.idTipoEvento} onChange={(event) => setEventoFilters((prev) => ({ ...prev, idTipoEvento: event.target.value }))}><option value="">Todos</option>{tiposEvento.map((tipo) => <option key={tipo.idTipoEvento} value={tipo.idTipoEvento}>{tipo.nombreTipo}</option>)}</select></label>
                      <label className="sanitario-field"><span>Estado</span><select data-testid="sanitario-filter-evento-estado" value={eventoFilters.estadoAprobacion} onChange={(event) => setEventoFilters((prev) => ({ ...prev, estadoAprobacion: event.target.value as EstadoAprobacionSanitaria | 'TODOS' }))}><option value="TODOS">Todos</option><option value="PENDIENTE">Pendiente</option><option value="APROBADO">Aprobado</option><option value="RECHAZADO">Rechazado</option></select></label>
                    </div>
                    <div className="sanitario-list" data-testid="sanitario-eventos-list">
                      {loadingEventos ? <p className="sanitario-helper-message">Cargando eventos sanitarios...</p> : eventos.length === 0 ? <p className="sanitario-helper-message">No hay eventos sanitarios para estos filtros.</p> : eventos.map((evento) => <article key={evento.idEvento} className="sanitario-item" data-testid={`sanitario-evento-${evento.idEvento}`}><div className="sanitario-item__head"><strong>{evento.animal?.numeroArete || animalById.get(evento.idAnimal)?.numeroArete || `#${evento.idAnimal}`}</strong><span className={`sanitario-status ${toEventoClass(evento.estadoAprobacion)}`}>{formatEstadoAprobacion(evento.estadoAprobacion)}</span></div><p>{evento.tipoEvento?.nombreTipo || tipoById.get(evento.idTipoEvento)?.nombreTipo || 'Tipo'} · Fecha: {formatDate(evento.fechaEvento)}</p><p>Diagnostico: {evento.diagnostico || 'Sin diagnostico'}</p><p>Medicamento: {evento.medicamento || 'N/A'} · Dosis: {evento.dosis || 'N/A'}</p>{(canEdit || canApprove) && evento.estadoAprobacion === 'PENDIENTE' ? <div className="sanitario-item__actions">{canEdit ? <Button type="button" variant="ghost" data-testid={`sanitario-evento-editar-${evento.idEvento}`} onClick={() => { setEditingEventoId(evento.idEvento); setEventoForm({ idAnimal: String(evento.idAnimal), idTipoEvento: String(evento.idTipoEvento), fechaEvento: toInputDate(evento.fechaEvento), diagnostico: evento.diagnostico || '', medicamento: evento.medicamento || '', dosis: evento.dosis || '' }); }}>Editar</Button> : null}{canApprove ? <><Button type="button" variant="ghost" className="users-btn-success" data-testid={`sanitario-evento-aprobar-${evento.idEvento}`} disabled={processingEventoId === evento.idEvento} onClick={() => void onAprobarEvento(evento.idEvento, 'APROBADO')}>{processingEventoId === evento.idEvento ? 'Procesando...' : 'Aprobar'}</Button><Button type="button" variant="ghost" className="users-btn-danger" data-testid={`sanitario-evento-rechazar-${evento.idEvento}`} disabled={processingEventoId === evento.idEvento} onClick={() => void onAprobarEvento(evento.idEvento, 'RECHAZADO')}>{processingEventoId === evento.idEvento ? 'Procesando...' : 'Rechazar'}</Button></> : null}</div> : null}</article>)}
                    </div>
                  </article>

                  <article className="sanitario-card" data-testid="sanitario-calendario-card">
                    <div className="users-admin-card__title"><h2>Calendario sanitario</h2><small>{calendario.length} programados</small></div>
                    <div className="sanitario-filters">
                      <label className="sanitario-field"><span>Animal</span><select data-testid="sanitario-filter-cal-animal" value={calendarioFilters.idAnimal} onChange={(event) => setCalendarioFilters((prev) => ({ ...prev, idAnimal: event.target.value }))}><option value="">Todos</option>{animales.map((animal) => <option key={animal.idAnimal} value={animal.idAnimal}>{animal.numeroArete}</option>)}</select></label>
                      <label className="sanitario-field"><span>Estado</span><select data-testid="sanitario-filter-cal-estado" value={calendarioFilters.estado} onChange={(event) => setCalendarioFilters((prev) => ({ ...prev, estado: event.target.value as EstadoCalendarioSanitario | 'TODOS' }))}><option value="TODOS">Todos</option><option value="PENDIENTE">Pendiente</option><option value="COMPLETADO">Completado</option><option value="CANCELADO">Cancelado</option></select></label>
                    </div>
                    <div className="sanitario-list" data-testid="sanitario-cal-list">
                      {loadingCalendario ? <p className="sanitario-helper-message">Cargando calendario...</p> : calendario.length === 0 ? <p className="sanitario-helper-message">No hay eventos de calendario para estos filtros.</p> : calendario.map((item) => <article key={item.idCalendario} className="sanitario-item" data-testid={`sanitario-cal-item-${item.idCalendario}`}><div className="sanitario-item__head"><strong>{item.animal?.numeroArete || animalById.get(item.idAnimal)?.numeroArete || `#${item.idAnimal}`}</strong><span className={`sanitario-status ${toCalendarioClass(item.estado)}`}>{formatEstadoCalendario(item.estado)}</span></div><p>{item.tipoEvento?.nombreTipo || tipoById.get(item.idTipoEvento)?.nombreTipo || 'Tipo'} · Programado: {formatDate(item.fechaProgramada)}</p><p>Alerta: {formatDate(item.fechaAlerta)}</p>{canManageCalendario && item.estado === 'PENDIENTE' ? <div className="sanitario-item__actions"><Button type="button" variant="ghost" data-testid={`sanitario-cal-editar-${item.idCalendario}`} onClick={() => { setEditingCalendarioId(item.idCalendario); setCalendarioForm({ idAnimal: String(item.idAnimal), idTipoEvento: String(item.idTipoEvento), fechaProgramada: toInputDate(item.fechaProgramada), fechaAlerta: toInputDate(item.fechaAlerta) }); }}>Editar</Button><Button type="button" variant="ghost" className="users-btn-success" data-testid={`sanitario-cal-completar-${item.idCalendario}`} disabled={processingCalendarioId === item.idCalendario} onClick={() => void onCompletarCalendario(item.idCalendario, 'COMPLETADO')}>{processingCalendarioId === item.idCalendario ? 'Procesando...' : 'Completar'}</Button><Button type="button" variant="ghost" className="users-btn-danger" data-testid={`sanitario-cal-cancelar-${item.idCalendario}`} disabled={processingCalendarioId === item.idCalendario} onClick={() => void onCompletarCalendario(item.idCalendario, 'CANCELADO')}>{processingCalendarioId === item.idCalendario ? 'Procesando...' : 'Cancelar'}</Button></div> : null}</article>)}
                    </div>
                  </article>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </section>
  );
}

