import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { getVisibleNavItemsForRole } from '../../auth/navigation-utils';
import { Button, NAV_ITEMS, LogOut, Pencil, Save, Plus, X, Search, FilterX, History, UserMinus, Check } from '../../../shared/ui';
import { ApiClientError } from '../../../types/api';
import { ganadoApi } from '../ganado-api';
import type {
  Animal,
  BajaAnimalInput,
  CreateAnimalInput,
  EstadoAnimal,
  HistorialAnimalResponse,
  Raza,
  UpdateAnimalInput,
} from '../ganado-types';
import {
  canBajaAnimal,
  canCreateAnimal,
  canEditAnimal,
  canViewAnimalHistorial,
  canViewGanado,
  formatEstadoAnimal,
  getGanadoErrorMessage,
  getGanadoFieldErrors,
  toInputDate,
  toNumeric,
} from '../ganado-utils';

interface GanadoAdminPageProps {
  onGoHome: () => void;
  onGoUsersAdmin?: () => void;
  onNavigateModule?: (moduleName: string) => void;
}

interface AnimalFormState {
  numeroArete: string;
  fechaIngreso: string;
  pesoInicial: string;
  idRaza: string;
  procedencia: string;
  edadEstimada: string;
  estadoSanitarioInicial: string;
}

interface AnimalFormErrors {
  numeroArete?: string;
  fechaIngreso?: string;
  pesoInicial?: string;
  idRaza?: string;
  procedencia?: string;
  edadEstimada?: string;
  estadoSanitarioInicial?: string;
}

interface BajaFormState {
  estadoActual: Exclude<EstadoAnimal, 'ACTIVO'>;
  motivoBaja: string;
  fechaBaja: string;
}

interface UiMessage {
  type: 'error' | 'success' | 'warn';
  text: string;
}



const EMPTY_FORM: AnimalFormState = {
  numeroArete: '',
  fechaIngreso: '',
  pesoInicial: '',
  idRaza: '',
  procedencia: '',
  edadEstimada: '',
  estadoSanitarioInicial: '',
};

const DEFAULT_BAJA_FORM: BajaFormState = {
  estadoActual: 'VENDIDO',
  motivoBaja: '',
  fechaBaja: new Date().toISOString().slice(0, 10),
};

function toFormState(animal: Animal): AnimalFormState {
  return {
    numeroArete: animal.numeroArete,
    fechaIngreso: toInputDate(animal.fechaIngreso),
    pesoInicial: String(toNumeric(animal.pesoInicial)),
    idRaza: String(animal.idRaza),
    procedencia: animal.procedencia,
    edadEstimada: String(animal.edadEstimada),
    estadoSanitarioInicial: animal.estadoSanitarioInicial,
  };
}

function validateAnimalForm(form: AnimalFormState, isEditing: boolean): AnimalFormErrors {
  const errors: AnimalFormErrors = {};
  if (!form.numeroArete.trim()) errors.numeroArete = 'El numero de arete es obligatorio.';
  if (!isEditing && form.numeroArete.trim().length > 50) errors.numeroArete = 'El numero de arete no puede exceder 50 caracteres.';
  if (!form.fechaIngreso || !/^\d{4}-\d{2}-\d{2}$/.test(form.fechaIngreso)) errors.fechaIngreso = 'Fecha invalida (YYYY-MM-DD).';
  if (!form.pesoInicial.trim() || Number(form.pesoInicial) <= 0) errors.pesoInicial = 'El peso debe ser mayor a 0.';
  if (!form.idRaza || Number(form.idRaza) <= 0) errors.idRaza = 'Selecciona una raza valida.';
  if (!form.procedencia.trim()) errors.procedencia = 'La procedencia es obligatoria.';
  if (!form.edadEstimada.trim() || !Number.isInteger(Number(form.edadEstimada)) || Number(form.edadEstimada) < 0) {
    errors.edadEstimada = 'La edad debe ser entero mayor o igual a 0.';
  }
  if (!form.estadoSanitarioInicial.trim()) errors.estadoSanitarioInicial = 'El estado sanitario inicial es obligatorio.';
  return errors;
}

function validateBajaForm(form: BajaFormState) {
  const errors: { motivoBaja?: string; fechaBaja?: string } = {};
  if (!form.motivoBaja.trim() || form.motivoBaja.trim().length < 5) errors.motivoBaja = 'Minimo 5 caracteres.';
  if (!form.fechaBaja || !/^\d{4}-\d{2}-\d{2}$/.test(form.fechaBaja)) errors.fechaBaja = 'Fecha invalida.';
  return errors;
}

function getEstadoClass(estadoActual: EstadoAnimal) {
  if (estadoActual === 'ACTIVO') return 'is-active';
  if (estadoActual === 'VENDIDO') return 'is-sold';
  if (estadoActual === 'MUERTO') return 'is-dead';
  return 'is-transferred';
}

export function GanadoAdminPage({ onGoHome, onGoUsersAdmin, onNavigateModule }: GanadoAdminPageProps) {
  const { user, logout } = useAuth();
  const visibleNavItems = useMemo(() => getVisibleNavItemsForRole(user?.rol, NAV_ITEMS), [user?.rol]);

  const [razas, setRazas] = useState<Raza[]>([]);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<UiMessage | null>(null);

  const [filters, setFilters] = useState({ estadoActual: 'ACTIVO' as EstadoAnimal | 'TODOS', idRaza: '', arete: '' });
  const [form, setForm] = useState<AnimalFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<AnimalFormErrors>({});
  const [editingAnimalId, setEditingAnimalId] = useState<number | null>(null);

  const [searchArete, setSearchArete] = useState('');
  const [searchResult, setSearchResult] = useState<Animal | null>(null);
  const [searching, setSearching] = useState(false);

  const [bajaTarget, setBajaTarget] = useState<Animal | null>(null);
  const [bajaForm, setBajaForm] = useState<BajaFormState>(DEFAULT_BAJA_FORM);
  const [bajaErrors, setBajaErrors] = useState<{ motivoBaja?: string; fechaBaja?: string }>({});
  const [submittingBaja, setSubmittingBaja] = useState(false);

  const [historialModalOpen, setHistorialModalOpen] = useState(false);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialError, setHistorialError] = useState<string | null>(null);
  const [historialData, setHistorialData] = useState<HistorialAnimalResponse | null>(null);

  const canView = useMemo(() => canViewGanado(user?.rol), [user?.rol]);
  const canCreate = useMemo(() => canCreateAnimal(user?.rol), [user?.rol]);
  const canEdit = useMemo(() => canEditAnimal(user?.rol), [user?.rol]);
  const canBaja = useMemo(() => canBajaAnimal(user?.rol), [user?.rol]);
  const canHistorial = useMemo(() => canViewAnimalHistorial(user?.rol), [user?.rol]);

  const isEditing = editingAnimalId !== null;
  const editingAnimal = useMemo(() => (editingAnimalId ? animales.find((a) => a.idAnimal === editingAnimalId) || null : null), [animales, editingAnimalId]);

  const handleApiError = useCallback(async (error: unknown) => {
    setMessage({ type: 'error', text: getGanadoErrorMessage(error) });
    if (error instanceof ApiClientError && error.status === 401) await logout();
  }, [logout]);

  const loadRazas = useCallback(async () => {
    try { setRazas(await ganadoApi.getRazas()); } catch (error) { await handleApiError(error); }
  }, [handleApiError]);

  const loadAnimales = useCallback(async () => {
    try {
      setLoadingList(true);
      const data = await ganadoApi.getAnimales({
        estadoActual: filters.estadoActual,
        idRaza: filters.idRaza ? Number(filters.idRaza) : undefined,
      });
      setAnimales(data);
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoadingList(false);
    }
  }, [filters.estadoActual, filters.idRaza, handleApiError]);

  useEffect(() => {
    if (!canView) { setLoadingInit(false); setLoadingList(false); return; }
    void Promise.all([loadRazas(), loadAnimales()]).finally(() => setLoadingInit(false));
  }, [canView, loadAnimales, loadRazas]);

  useEffect(() => {
    if (!canView || loadingInit) return;
    void loadAnimales();
  }, [canView, loadingInit, loadAnimales]);

  const filteredAnimales = useMemo(() => {
    if (!filters.arete.trim()) return animales;
    const lower = filters.arete.trim().toLowerCase();
    return animales.filter((a) => a.numeroArete.toLowerCase().includes(lower));
  }, [animales, filters.arete]);

  const onNavigate = (moduleName: string) => {
    if (moduleName === 'Usuarios' && onGoUsersAdmin) return onGoUsersAdmin();
    if (onNavigateModule) return onNavigateModule(moduleName);
    return onGoHome();
  };

  const resetForm = () => { setForm(EMPTY_FORM); setFormErrors({}); setEditingAnimalId(null); };

  const onSave = async () => {
    const validationErrors = validateAnimalForm(form, isEditing);
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setSaving(true);
      setMessage(null);

      if (isEditing && editingAnimal) {
        const payload: UpdateAnimalInput = {
          fechaIngreso: form.fechaIngreso,
          pesoInicial: Number(form.pesoInicial),
          idRaza: Number(form.idRaza),
          procedencia: form.procedencia.trim(),
          edadEstimada: Number(form.edadEstimada),
          estadoSanitarioInicial: form.estadoSanitarioInicial.trim(),
        };
        const updated = await ganadoApi.updateAnimal(editingAnimal.idAnimal, payload);
        setAnimales((prev) => prev.map((a) => (a.idAnimal === updated.idAnimal ? updated : a)));
        if (searchResult?.idAnimal === updated.idAnimal) setSearchResult(updated);
        setMessage({ type: 'success', text: 'Animal actualizado correctamente.' });
      } else {
        const payload: CreateAnimalInput = {
          numeroArete: form.numeroArete.trim(),
          fechaIngreso: form.fechaIngreso,
          pesoInicial: Number(form.pesoInicial),
          idRaza: Number(form.idRaza),
          procedencia: form.procedencia.trim(),
          edadEstimada: Number(form.edadEstimada),
          estadoSanitarioInicial: form.estadoSanitarioInicial.trim(),
        };
        const created = await ganadoApi.createAnimal(payload);
        setAnimales((prev) => [created, ...prev]);
        setSearchResult(created);
        setMessage({ type: 'success', text: 'Animal registrado correctamente.' });
      }

      resetForm();
    } catch (error) {
      const fe = getGanadoFieldErrors(error);
      setFormErrors((prev) => ({
        ...prev,
        numeroArete: fe.numeroArete || prev.numeroArete,
        fechaIngreso: fe.fechaIngreso || prev.fechaIngreso,
        pesoInicial: fe.pesoInicial || prev.pesoInicial,
        idRaza: fe.idRaza || prev.idRaza,
        procedencia: fe.procedencia || prev.procedencia,
        edadEstimada: fe.edadEstimada || prev.edadEstimada,
        estadoSanitarioInicial: fe.estadoSanitarioInicial || prev.estadoSanitarioInicial,
      }));
      await handleApiError(error);
    } finally { setSaving(false); }
  };

  const onSearchByArete = async () => {
    if (!searchArete.trim()) return;
    try {
      setSearching(true);
      setSearchResult(await ganadoApi.getAnimalByArete(searchArete.trim()));
      setMessage(null);
    } catch (error) {
      setSearchResult(null);
      await handleApiError(error);
    } finally { setSearching(false); }
  };

  const onOpenBaja = (animal: Animal) => {
    setBajaTarget(animal);
    setBajaErrors({});
    setBajaForm({ ...DEFAULT_BAJA_FORM, fechaBaja: new Date().toISOString().slice(0, 10) });
  };

  const onConfirmBaja = async () => {
    if (!bajaTarget) return;
    const validationErrors = validateBajaForm(bajaForm);
    setBajaErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setSubmittingBaja(true);
      const payload: BajaAnimalInput = {
        estadoActual: bajaForm.estadoActual,
        motivoBaja: bajaForm.motivoBaja.trim(),
        fechaBaja: bajaForm.fechaBaja,
      };
      const updated = await ganadoApi.bajaAnimal(bajaTarget.idAnimal, payload);
      setAnimales((prev) => prev.map((a) => (a.idAnimal === updated.idAnimal ? updated : a)));
      if (searchResult?.idAnimal === updated.idAnimal) setSearchResult(updated);
      setMessage({ type: 'success', text: `Animal ${updated.numeroArete} dado de baja correctamente.` });
      await loadAnimales();
      setBajaTarget(null);
    } catch (error) {
      await handleApiError(error);
    } finally { setSubmittingBaja(false); }
  };

  const onOpenHistorial = async (animal: Animal) => {
    try {
      setHistorialModalOpen(true);
      setHistorialLoading(true);
      setHistorialError(null);
      setHistorialData(await ganadoApi.getHistorialByArete(animal.numeroArete));
    } catch (error) {
      setHistorialData(null);
      setHistorialError(getGanadoErrorMessage(error));
    } finally { setHistorialLoading(false); }
  };

  return (
    <section className="users-admin-shell">
      <aside className="users-admin-sidebar">
        <div className="users-admin-sidebar__logo"><img src="/branding/logo-rancho-los-alpes.png" alt="Logo Rancho Los Alpes" /></div>
        <nav className="users-admin-sidebar__nav" aria-label="Navegacion de modulos">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
            <button
              key={item.label}
              type="button"
              data-testid={`ganado-nav-${item.label.toLowerCase()}`}
              className={`users-admin-sidebar__nav-item ${item.label === 'Ganado' ? 'is-active' : ''}`}
              onClick={item.label === 'Ganado' ? undefined : () => onNavigate(item.label)}
            >
              <Icon size={18} aria-hidden /> {item.label}
            </button>
            );
          })}
        </nav>
        <footer className="users-admin-sidebar__footer">
          <p>{user?.nombreCompleto || 'Usuario'}</p>
          <small>{user?.rol || 'Sin rol'}</small>
          <Button type="button" className="users-admin-sidebar__logout" onClick={logout} data-testid="ganado-sidebar-logout-button"><LogOut size={15} aria-hidden /> Cerrar sesion</Button>
        </footer>
      </aside>

      <main className="users-admin-main">
        <header className="users-admin-main__header" data-testid="ganado-admin-header">
          <h1>Ganado</h1><p>Gestion de ganado bovino</p>
        </header>

        <div className="users-admin-main__body">
          {!canView ? (
            <article className="users-admin-empty"><h2>Acceso restringido</h2><p>Tu rol no tiene permisos para ganado.</p><Button type="button" variant="ghost" onClick={onGoHome}>Volver</Button></article>
          ) : loadingInit ? (
            <article className="users-admin-empty"><h2>Cargando ganado...</h2><p>Preparando datos iniciales.</p></article>
          ) : (
            <div className="ganado-grid">
              <article className="ganado-card">
                <div className="users-admin-card__title"><h2>{isEditing ? 'Editar animal' : 'Alta de ganado'}</h2>{isEditing ? <Button type="button" variant="ghost" onClick={resetForm}><X size={15} aria-hidden /> Cancelar</Button> : null}</div>
                {!canCreate && !canEdit ? <p className="ganado-helper-message">Tu rol solo puede consultar.</p> : (
                  <>
                    <label className="ganado-field"><span>Numero de arete</span><input data-testid="input-arete" value={form.numeroArete} onChange={(e)=>setForm((p)=>({...p,numeroArete:e.target.value}))} readOnly={isEditing} placeholder="MX-AGS-1001" />{formErrors.numeroArete ? <small data-testid="arete-error">{formErrors.numeroArete}</small> : null}</label>
                    <label className="ganado-field"><span>Fecha de ingreso</span><input data-testid="input-fecha" type="date" value={form.fechaIngreso} onChange={(e)=>setForm((p)=>({...p,fechaIngreso:e.target.value}))} />{formErrors.fechaIngreso ? <small data-testid="fecha-error">{formErrors.fechaIngreso}</small> : null}</label>
                    <div className="ganado-field-row">
                      <label className="ganado-field"><span>Peso inicial (kg)</span><input data-testid="input-peso" type="number" min={0.1} step={0.1} value={form.pesoInicial} onChange={(e)=>setForm((p)=>({...p,pesoInicial:e.target.value}))} />{formErrors.pesoInicial ? <small data-testid="peso-error">{formErrors.pesoInicial}</small> : null}</label>
                      <label className="ganado-field"><span>Edad estimada (meses)</span><input data-testid="input-edad" type="number" min={0} step={1} value={form.edadEstimada} onChange={(e)=>setForm((p)=>({...p,edadEstimada:e.target.value}))} />{formErrors.edadEstimada ? <small data-testid="edad-error">{formErrors.edadEstimada}</small> : null}</label>
                    </div>
                    <label className="ganado-field"><span>Raza</span><select data-testid="select-raza" value={form.idRaza} onChange={(e)=>setForm((p)=>({...p,idRaza:e.target.value}))}><option value="">Selecciona una raza</option>{razas.map((r)=><option key={r.idRaza} value={r.idRaza}>{r.nombreRaza}</option>)}</select>{formErrors.idRaza ? <small data-testid="raza-error">{formErrors.idRaza}</small> : null}</label>
                    <label className="ganado-field"><span>Procedencia</span><input data-testid="input-procedencia" value={form.procedencia} onChange={(e)=>setForm((p)=>({...p,procedencia:e.target.value}))} />{formErrors.procedencia ? <small data-testid="procedencia-error">{formErrors.procedencia}</small> : null}</label>
                    <label className="ganado-field"><span>Estado sanitario inicial</span><textarea data-testid="input-sanitario" rows={3} value={form.estadoSanitarioInicial} onChange={(e)=>setForm((p)=>({...p,estadoSanitarioInicial:e.target.value}))} />{formErrors.estadoSanitarioInicial ? <small data-testid="sanitario-error">{formErrors.estadoSanitarioInicial}</small> : null}</label>
                    <Button type="button" fullWidth disabled={saving} onClick={onSave} data-testid="btn-submit">{saving ? 'Guardando...' : isEditing ? <><Save size={15} aria-hidden /> Guardar cambios</> : <><Plus size={15} aria-hidden /> Registrar animal</>}</Button>
                  </>
                )}
                {message ? <p className={`users-message users-message--${message.type}`} data-testid="ganado-form-message">{message.text}</p> : null}
              </article>

              <article className="ganado-card">
                <label className="ganado-search"><span>Busqueda por arete</span><div className="ganado-search__controls"><input data-testid="input-buscar-arete" value={searchArete} onChange={(e)=>setSearchArete(e.target.value)} placeholder="MX-AGS-1001" /><Button type="button" onClick={onSearchByArete} disabled={searching} data-testid="btn-buscar"><Search size={15} aria-hidden /> {searching ? 'Buscando...' : 'Buscar'}</Button></div></label>
                {searchResult ? (
                  <article className="ganado-search-result"><div><strong>{searchResult.numeroArete}</strong><p>{searchResult.raza?.nombreRaza || 'Sin raza'} · {toNumeric(searchResult.pesoInicial)} kg · {searchResult.edadEstimada} meses</p></div><div className="ganado-search-result__actions">{canHistorial ? <Button type="button" variant="ghost" onClick={()=>void onOpenHistorial(searchResult)}><History size={14} aria-hidden /> Ver historial</Button> : null}{canEdit && searchResult.estadoActual==='ACTIVO' ? <Button type="button" variant="ghost" onClick={()=>{setEditingAnimalId(searchResult.idAnimal);setForm(toFormState(searchResult));}}><Pencil size={14} aria-hidden /> Editar</Button> : null}</div></article>
                ) : null}

                <div className="ganado-filters">
                  <label className="ganado-field"><span>Estado</span><select data-testid="filter-estado" value={filters.estadoActual} onChange={(e)=>setFilters((p)=>({...p,estadoActual:e.target.value as EstadoAnimal|'TODOS'}))}><option value="ACTIVO">Activo</option><option value="TODOS">Todos</option><option value="VENDIDO">Vendido</option><option value="MUERTO">Muerto</option><option value="TRANSFERIDO">Transferido</option></select></label>
                  <label className="ganado-field"><span>Raza</span><select data-testid="filter-raza" value={filters.idRaza} onChange={(e)=>setFilters((p)=>({...p,idRaza:e.target.value}))}><option value="">Todas</option>{razas.map((r)=><option key={r.idRaza} value={r.idRaza}>{r.nombreRaza}</option>)}</select></label>
                  <label className="ganado-field"><span>Arete</span><input data-testid="filter-arete" value={filters.arete} onChange={(e)=>setFilters((p)=>({...p,arete:e.target.value}))} placeholder="Buscar por arete"/></label>
                  <Button type="button" variant="ghost" data-testid="btn-limpiar-filtros" onClick={()=>setFilters({estadoActual:'ACTIVO',idRaza:'',arete:''})}><FilterX size={14} aria-hidden /> Limpiar</Button>
                </div>

                <div className="ganado-list">
                  {loadingList ? <p className="ganado-helper-message">Cargando ganado...</p> : filteredAnimales.length===0 ? <p className="ganado-helper-message">No hay animales con estos filtros.</p> : filteredAnimales.map((a)=>(
                    <article key={a.idAnimal} className="ganado-item" data-testid={`card-${a.numeroArete}`}>
                      <div className="ganado-item__head"><strong>{a.numeroArete}</strong><span className={`ganado-status ${getEstadoClass(a.estadoActual)}`}>{formatEstadoAnimal(a.estadoActual)}</span></div>
                      <p>{a.raza?.nombreRaza || 'Sin raza'} · {toNumeric(a.pesoInicial)} kg · {a.edadEstimada} meses</p>
                      <p>Ingreso: {toInputDate(a.fechaIngreso)} · Procedencia: {a.procedencia}</p>
                      {a.motivoBaja ? <p>Baja: {a.motivoBaja} ({toInputDate(a.fechaBaja)})</p> : null}
                      <div className="ganado-item__actions">
                        {canHistorial ? <Button type="button" variant="ghost" data-testid={`btn-historial-${a.numeroArete}`} onClick={()=>void onOpenHistorial(a)}><History size={14} aria-hidden /> Historial</Button> : null}
                        {canEdit && a.estadoActual==='ACTIVO' ? <Button type="button" variant="ghost" data-testid={`btn-editar-${a.numeroArete}`} onClick={()=>{setEditingAnimalId(a.idAnimal);setForm(toFormState(a));}}><Pencil size={14} aria-hidden /> Editar</Button> : null}
                        {canBaja && a.estadoActual==='ACTIVO' ? <Button type="button" variant="ghost" className="users-btn-danger" data-testid={`btn-baja-${a.numeroArete}`} onClick={()=>onOpenBaja(a)}><UserMinus size={14} aria-hidden /> Dar baja</Button> : null}
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </div>
          )}
        </div>
      </main>

      {bajaTarget ? (
        <div className="ganado-modal-backdrop" role="dialog" aria-modal="true">
          <article className="ganado-modal">
            <header><h3>Dar de baja · {bajaTarget.numeroArete}</h3></header>
            <label className="ganado-field"><span>Estado de baja</span><select data-testid="select-motivo" value={bajaForm.estadoActual} onChange={(e)=>setBajaForm((p)=>({...p,estadoActual:e.target.value as Exclude<EstadoAnimal,'ACTIVO'>}))}><option value="VENDIDO">Vendido</option><option value="MUERTO">Muerto</option><option value="TRANSFERIDO">Transferido</option></select></label>
            <label className="ganado-field"><span>Motivo de baja</span><textarea data-testid="input-baja-motivo" rows={3} value={bajaForm.motivoBaja} onChange={(e)=>{setBajaForm((p)=>({...p,motivoBaja:e.target.value}));setBajaErrors((p)=>({...p,motivoBaja:undefined}));}} />{bajaErrors.motivoBaja ? <small data-testid="baja-motivo-error">{bajaErrors.motivoBaja}</small> : null}</label>
            <label className="ganado-field"><span>Fecha de baja</span><input data-testid="input-baja-fecha" type="date" value={bajaForm.fechaBaja} onChange={(e)=>{setBajaForm((p)=>({...p,fechaBaja:e.target.value}));setBajaErrors((p)=>({...p,fechaBaja:undefined}));}} />{bajaErrors.fechaBaja ? <small>{bajaErrors.fechaBaja}</small> : null}</label>
            <div className="ganado-modal__actions"><Button type="button" variant="ghost" onClick={()=>setBajaTarget(null)}><X size={14} aria-hidden /> Cancelar</Button><Button type="button" className="users-btn-danger" onClick={onConfirmBaja} disabled={submittingBaja} data-testid="btn-confirmar-baja">{submittingBaja ? 'Procesando...' : <><Check size={14} aria-hidden /> Confirmar baja</>}</Button></div>
          </article>
        </div>
      ) : null}

      {historialModalOpen ? (
        <div className="ganado-modal-backdrop" role="dialog" aria-modal="true">
          <article className="ganado-modal">
            <header><h3>Historial por arete</h3></header>
            {historialLoading ? <p className="ganado-helper-message">Cargando historial...</p> : historialError ? <p className="users-message users-message--error">{historialError}</p> : historialData ? (
              <div className="ganado-historial"><p><strong>{historialData.animal.numeroArete}</strong> · {historialData.animal.raza?.nombreRaza || 'Sin raza'}</p><ul><li>Eventos sanitarios: {historialData.historial.resumen.totalEventosSanitarios}</li><li>Calendario sanitario: {historialData.historial.sanitario.calendario.length}</li><li>Registros de peso: {historialData.historial.resumen.totalRegistrosPeso}</li><li>Registros de leche: {historialData.historial.resumen.totalRegistrosLeche}</li><li>Eventos reproductivos: {historialData.historial.resumen.totalEventosReproductivos}</li></ul></div>
            ) : null}
            <div className="ganado-modal__actions"><Button type="button" onClick={()=>setHistorialModalOpen(false)}>Cerrar</Button></div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
