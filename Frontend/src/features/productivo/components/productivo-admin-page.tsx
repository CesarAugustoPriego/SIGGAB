import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { Button } from '../../../shared/ui';
import { ApiClientError } from '../../../types/api';
import { productivoApi } from '../productivo-api';
import type {
  LoteProductivo,
  RegistroPeso,
  ProduccionLeche,
  EventoReproductivo,
  EstadoRegistro,
  TipoEventoReproductivo,
} from '../productivo-types';
import {
  canViewProductivo,
  canCreateLote,
  canCreateRegistro,
  canEditRegistro,
  canValidarRegistro,
  canViewReproductivos,
  getEstadoClass,
  getTipoEventoClass,
  getProductivoErrorMessage,
  toInputDate,
  toNumeric,
} from '../productivo-utils';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ProductivoAdminPageProps {
  onGoHome: () => void;
  onGoUsersAdmin?: () => void;
  onNavigateModule?: (moduleName: string) => void;
}

interface UiMessage {
  type: 'error' | 'success' | 'warn';
  text: string;
}

type Tab = 'lotes' | 'peso' | 'leche' | 'reproductivo';

interface AnimalOption {
  idAnimal: number;
  numeroArete: string;
  nombreRaza: string;
}

const NAV_ITEMS = ['Dashboard', 'Ganado', 'Sanitario', 'Produccion', 'Inventario', 'Reportes', 'Aprobaciones', 'Auditoria', 'Usuarios', 'Respaldos'];

const TIPOS_EVENTO: TipoEventoReproductivo[] = ['CELO', 'MONTA', 'PREÑEZ', 'PARTO', 'ABORTO'];

// ─── Main component ──────────────────────────────────────────────────────────

export function ProductivoAdminPage({ onGoHome, onGoUsersAdmin, onNavigateModule }: ProductivoAdminPageProps) {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('lotes');
  const [loadingInit, setLoadingInit] = useState(true);
  const [message, setMessage] = useState<UiMessage | null>(null);

  // ─── Shared data ──────────────────────────────────────────────────────────
  const [lotes, setLotes] = useState<LoteProductivo[]>([]);
  const [animales, setAnimales] = useState<AnimalOption[]>([]);

  // ─── Lotes state ──────────────────────────────────────────────────────────
  const [loteForm, setLoteForm] = useState({ fechaInicio: '', fechaFin: '' });
  const [savingLote, setSavingLote] = useState(false);
  const [loteFilter, setLoteFilter] = useState<EstadoRegistro | 'TODOS'>('TODOS');

  // ─── Peso state ───────────────────────────────────────────────────────────
  const [pesos, setPesos] = useState<RegistroPeso[]>([]);
  const [loadingPesos, setLoadingPesos] = useState(false);
  const [pesoForm, setPesoForm] = useState({ idAnimal: '', idLote: '', peso: '', fechaRegistro: '' });
  const [savingPeso, setSavingPeso] = useState(false);
  const [pesoFilter, setPesoFilter] = useState({ idAnimal: '', idLote: '', estado: 'TODOS' as EstadoRegistro | 'TODOS' });
  const [editingPesoId, setEditingPesoId] = useState<number | null>(null);

  // ─── Leche state ──────────────────────────────────────────────────────────
  const [leches, setLeches] = useState<ProduccionLeche[]>([]);
  const [loadingLeche, setLoadingLeche] = useState(false);
  const [lecheForm, setLecheForm] = useState({ idAnimal: '', idLote: '', litrosProducidos: '', fechaRegistro: '' });
  const [savingLeche, setSavingLeche] = useState(false);
  const [lecheFilter, setLecheFilter] = useState({ idAnimal: '', idLote: '', estado: 'TODOS' as EstadoRegistro | 'TODOS' });
  const [editingLecheId, setEditingLecheId] = useState<number | null>(null);

  // ─── Reproductivo state ───────────────────────────────────────────────────
  const [eventos, setEventos] = useState<EventoReproductivo[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [eventoForm, setEventoForm] = useState({ idAnimal: '', idLote: '', tipoEvento: '', fechaEvento: '', observaciones: '' });
  const [savingEvento, setSavingEvento] = useState(false);
  const [eventoFilter, setEventoFilter] = useState({ idAnimal: '', idLote: '', tipo: 'TODOS' as TipoEventoReproductivo | 'TODOS', estado: 'TODOS' as EstadoRegistro | 'TODOS' });
  const [editingEventoId, setEditingEventoId] = useState<number | null>(null);

  // ─── Permissions ──────────────────────────────────────────────────────────
  const canView = useMemo(() => canViewProductivo(user?.rol), [user?.rol]);
  const canLote = useMemo(() => canCreateLote(user?.rol), [user?.rol]);
  const canCreate = useMemo(() => canCreateRegistro(user?.rol), [user?.rol]);
  const canEdit = useMemo(() => canEditRegistro(user?.rol), [user?.rol]);
  const canValidar = useMemo(() => canValidarRegistro(user?.rol), [user?.rol]);
  const canRepro = useMemo(() => canViewReproductivos(user?.rol), [user?.rol]);


  // ─── Error handler ────────────────────────────────────────────────────────
  const handleApiError = useCallback(async (error: unknown) => {
    setMessage({ type: 'error', text: getProductivoErrorMessage(error) });
    if (error instanceof ApiClientError && error.status === 401) await logout();
  }, [logout]);

  // ─── Data loading ─────────────────────────────────────────────────────────
  const loadLotes = useCallback(async () => {
    try {
      const data = await productivoApi.getLotes(loteFilter !== 'TODOS' ? { estado: loteFilter } : {});
      setLotes(data);
    } catch (error) { await handleApiError(error); }
  }, [loteFilter, handleApiError]);

  const loadAnimales = useCallback(async () => {
    try {
      const { httpClient } = await import('../../../lib/http-client');
      const data = await httpClient.get<{ idAnimal: number; numeroArete: string; raza?: { nombreRaza: string } | null }[]>('/animales?estado=ACTIVO');
      setAnimales(data.map((a) => ({ idAnimal: a.idAnimal, numeroArete: a.numeroArete, nombreRaza: a.raza?.nombreRaza || 'Sin raza' })));
    } catch (error) { await handleApiError(error); }
  }, [handleApiError]);

  const loadPesos = useCallback(async () => {
    try {
      setLoadingPesos(true);
      const f = {
        idAnimal: pesoFilter.idAnimal ? Number(pesoFilter.idAnimal) : undefined,
        idLote: pesoFilter.idLote ? Number(pesoFilter.idLote) : undefined,
        estado: pesoFilter.estado !== 'TODOS' ? pesoFilter.estado : undefined,
      };
      setPesos(await productivoApi.getRegistrosPeso(f));
    } catch (error) { await handleApiError(error); }
    finally { setLoadingPesos(false); }
  }, [pesoFilter, handleApiError]);

  const loadLeche = useCallback(async () => {
    try {
      setLoadingLeche(true);
      const f = {
        idAnimal: lecheFilter.idAnimal ? Number(lecheFilter.idAnimal) : undefined,
        idLote: lecheFilter.idLote ? Number(lecheFilter.idLote) : undefined,
        estado: lecheFilter.estado !== 'TODOS' ? lecheFilter.estado : undefined,
      };
      setLeches(await productivoApi.getProduccionLeche(f));
    } catch (error) { await handleApiError(error); }
    finally { setLoadingLeche(false); }
  }, [lecheFilter, handleApiError]);

  const loadEventos = useCallback(async () => {
    try {
      setLoadingEventos(true);
      const f = {
        idAnimal: eventoFilter.idAnimal ? Number(eventoFilter.idAnimal) : undefined,
        idLote: eventoFilter.idLote ? Number(eventoFilter.idLote) : undefined,
        tipo: eventoFilter.tipo !== 'TODOS' ? eventoFilter.tipo : undefined,
        estado: eventoFilter.estado !== 'TODOS' ? eventoFilter.estado : undefined,
      };
      setEventos(await productivoApi.getEventosReproductivos(f));
    } catch (error) { await handleApiError(error); }
    finally { setLoadingEventos(false); }
  }, [eventoFilter, handleApiError]);

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canView) { setLoadingInit(false); return; }
    void Promise.all([loadLotes(), loadAnimales()]).finally(() => setLoadingInit(false));
  }, [canView, loadLotes, loadAnimales]);

  // ─── Tab data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canView || loadingInit) return;
    if (activeTab === 'lotes') void loadLotes();
    if (activeTab === 'peso') void loadPesos();
    if (activeTab === 'leche') void loadLeche();
    if (activeTab === 'reproductivo') void loadEventos();
  }, [activeTab, canView, loadingInit, loadLotes, loadPesos, loadLeche, loadEventos]);

  // ─── Navigation ───────────────────────────────────────────────────────────
  const onNavigate = (moduleName: string) => {
    if (moduleName === 'Usuarios' && onGoUsersAdmin) return onGoUsersAdmin();
    if (onNavigateModule) return onNavigateModule(moduleName);
    return onGoHome();
  };

  // ─── Lotes handlers ────────────────────────────────────────────────────────
  const onCreateLote = async () => {
    if (!loteForm.fechaInicio || !loteForm.fechaFin) { setMessage({ type: 'error', text: 'Ambas fechas son obligatorias.' }); return; }
    if (new Date(loteForm.fechaFin) < new Date(loteForm.fechaInicio)) { setMessage({ type: 'error', text: 'La fecha fin debe ser >= fecha inicio.' }); return; }
    try {
      setSavingLote(true); setMessage(null);
      const created = await productivoApi.createLote({ fechaInicio: loteForm.fechaInicio, fechaFin: loteForm.fechaFin });
      setLotes((prev) => [created, ...prev]);
      setLoteForm({ fechaInicio: '', fechaFin: '' });
      setMessage({ type: 'success', text: 'Lote creado exitosamente — en espera de aprobacion.' });
    } catch (error) { await handleApiError(error); }
    finally { setSavingLote(false); }
  };

  const onValidarLote = async (id: number, estado: 'APROBADO' | 'RECHAZADO') => {
    try {
      setMessage(null);
      const updated = await productivoApi.validarLote(id, { estado });
      setLotes((prev) => prev.map((l) => (l.idLote === updated.idLote ? updated : l)));
      setMessage({ type: 'success', text: `Lote ${estado === 'APROBADO' ? 'aprobado' : 'rechazado'} correctamente.` });
    } catch (error) { await handleApiError(error); }
  };

  // ─── Peso handlers ─────────────────────────────────────────────────────────
  const resetPesoForm = () => { setPesoForm({ idAnimal: '', idLote: '', peso: '', fechaRegistro: '' }); setEditingPesoId(null); };

  const onSavePeso = async () => {
    if (editingPesoId) {
      // Edit
      const payload: { peso?: number; fechaRegistro?: string } = {};
      if (pesoForm.peso) payload.peso = Number(pesoForm.peso);
      if (pesoForm.fechaRegistro) payload.fechaRegistro = pesoForm.fechaRegistro;
      try {
        setSavingPeso(true); setMessage(null);
        const updated = await productivoApi.updateRegistroPeso(editingPesoId, payload);
        setPesos((prev) => prev.map((r) => (r.idRegistroPeso === updated.idRegistroPeso ? updated : r)));
        setMessage({ type: 'success', text: 'Registro de peso actualizado.' });
        resetPesoForm();
      } catch (error) { await handleApiError(error); }
      finally { setSavingPeso(false); }
      return;
    }

    if (!pesoForm.idAnimal || !pesoForm.idLote || !pesoForm.peso || !pesoForm.fechaRegistro) { setMessage({ type: 'error', text: 'Todos los campos son obligatorios.' }); return; }
    const peso = Number(pesoForm.peso);
    if (peso <= 0) { setMessage({ type: 'error', text: 'El peso debe ser mayor a 0.' }); return; }
    try {
      setSavingPeso(true); setMessage(null);
      const created = await productivoApi.createRegistroPeso({ idAnimal: Number(pesoForm.idAnimal), idLote: Number(pesoForm.idLote), peso, fechaRegistro: pesoForm.fechaRegistro });
      setPesos((prev) => [created, ...prev]);
      resetPesoForm();
      setMessage({ type: 'success', text: 'Peso registrado — pendiente de aprobacion.' });
    } catch (error) { await handleApiError(error); }
    finally { setSavingPeso(false); }
  };

  const onValidarPeso = async (id: number, estado: 'APROBADO' | 'RECHAZADO') => {
    try {
      setMessage(null);
      const updated = await productivoApi.validarRegistroPeso(id, { estadoValidacion: estado });
      setPesos((prev) => prev.map((r) => (r.idRegistroPeso === updated.idRegistroPeso ? updated : r)));
      setMessage({ type: 'success', text: `Registro ${estado === 'APROBADO' ? 'aprobado' : 'rechazado'}.` });
    } catch (error) { await handleApiError(error); }
  };

  // ─── Leche handlers ────────────────────────────────────────────────────────
  const resetLecheForm = () => { setLecheForm({ idAnimal: '', idLote: '', litrosProducidos: '', fechaRegistro: '' }); setEditingLecheId(null); };

  const onSaveLeche = async () => {
    if (editingLecheId) {
      const payload: { litrosProducidos?: number; fechaRegistro?: string } = {};
      if (lecheForm.litrosProducidos) payload.litrosProducidos = Number(lecheForm.litrosProducidos);
      if (lecheForm.fechaRegistro) payload.fechaRegistro = lecheForm.fechaRegistro;
      try {
        setSavingLeche(true); setMessage(null);
        const updated = await productivoApi.updateProduccionLeche(editingLecheId, payload);
        setLeches((prev) => prev.map((r) => (r.idProduccion === updated.idProduccion ? updated : r)));
        setMessage({ type: 'success', text: 'Registro de leche actualizado.' });
        resetLecheForm();
      } catch (error) { await handleApiError(error); }
      finally { setSavingLeche(false); }
      return;
    }

    if (!lecheForm.idAnimal || !lecheForm.idLote || !lecheForm.litrosProducidos || !lecheForm.fechaRegistro) { setMessage({ type: 'error', text: 'Todos los campos son obligatorios.' }); return; }
    const litros = Number(lecheForm.litrosProducidos);
    if (litros <= 0) { setMessage({ type: 'error', text: 'Los litros deben ser mayor a 0.' }); return; }
    try {
      setSavingLeche(true); setMessage(null);
      const created = await productivoApi.createProduccionLeche({ idAnimal: Number(lecheForm.idAnimal), idLote: Number(lecheForm.idLote), litrosProducidos: litros, fechaRegistro: lecheForm.fechaRegistro });
      setLeches((prev) => [created, ...prev]);
      resetLecheForm();
      setMessage({ type: 'success', text: 'Produccion registrada — pendiente de aprobacion.' });
    } catch (error) { await handleApiError(error); }
    finally { setSavingLeche(false); }
  };

  const onValidarLeche = async (id: number, estado: 'APROBADO' | 'RECHAZADO') => {
    try {
      setMessage(null);
      const updated = await productivoApi.validarProduccionLeche(id, { estadoValidacion: estado });
      setLeches((prev) => prev.map((r) => (r.idProduccion === updated.idProduccion ? updated : r)));
      setMessage({ type: 'success', text: `Registro ${estado === 'APROBADO' ? 'aprobado' : 'rechazado'}.` });
    } catch (error) { await handleApiError(error); }
  };

  // ─── Reproductivo handlers ─────────────────────────────────────────────────
  const resetEventoForm = () => { setEventoForm({ idAnimal: '', idLote: '', tipoEvento: '', fechaEvento: '', observaciones: '' }); setEditingEventoId(null); };

  const onSaveEvento = async () => {
    if (editingEventoId) {
      const payload: { tipoEvento?: TipoEventoReproductivo; fechaEvento?: string; observaciones?: string } = {};
      if (eventoForm.tipoEvento) payload.tipoEvento = eventoForm.tipoEvento as TipoEventoReproductivo;
      if (eventoForm.fechaEvento) payload.fechaEvento = eventoForm.fechaEvento;
      if (eventoForm.observaciones !== undefined) payload.observaciones = eventoForm.observaciones;
      try {
        setSavingEvento(true); setMessage(null);
        const updated = await productivoApi.updateEventoReproductivo(editingEventoId, payload);
        setEventos((prev) => prev.map((e) => (e.idEventoReproductivo === updated.idEventoReproductivo ? updated : e)));
        setMessage({ type: 'success', text: 'Evento reproductivo actualizado.' });
        resetEventoForm();
      } catch (error) { await handleApiError(error); }
      finally { setSavingEvento(false); }
      return;
    }

    if (!eventoForm.idAnimal || !eventoForm.idLote || !eventoForm.tipoEvento || !eventoForm.fechaEvento) { setMessage({ type: 'error', text: 'Animal, lote, tipo y fecha son obligatorios.' }); return; }
    try {
      setSavingEvento(true); setMessage(null);
      const created = await productivoApi.createEventoReproductivo({
        idAnimal: Number(eventoForm.idAnimal),
        idLote: Number(eventoForm.idLote),
        tipoEvento: eventoForm.tipoEvento as TipoEventoReproductivo,
        fechaEvento: eventoForm.fechaEvento,
        observaciones: eventoForm.observaciones || undefined,
      });
      setEventos((prev) => [created, ...prev]);
      resetEventoForm();
      setMessage({ type: 'success', text: 'Evento registrado — pendiente de aprobacion.' });
    } catch (error) { await handleApiError(error); }
    finally { setSavingEvento(false); }
  };

  const onValidarEvento = async (id: number, estado: 'APROBADO' | 'RECHAZADO') => {
    try {
      setMessage(null);
      const updated = await productivoApi.validarEventoReproductivo(id, { estadoValidacion: estado });
      setEventos((prev) => prev.map((e) => (e.idEventoReproductivo === updated.idEventoReproductivo ? updated : e)));
      setMessage({ type: 'success', text: `Evento ${estado === 'APROBADO' ? 'aprobado' : 'rechazado'}.` });
    } catch (error) { await handleApiError(error); }
  };

  // ─── Filtered lotes ────────────────────────────────────────────────────────
  const filteredLotes = useMemo(() => {
    if (loteFilter === 'TODOS') return lotes;
    return lotes.filter((l) => l.estado === loteFilter);
  }, [lotes, loteFilter]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="users-admin-shell">
      {/* ─── Sidebar ─── */}
      <aside className="users-admin-sidebar">
        <div className="users-admin-sidebar__logo"><img src="/branding/logo-rancho-los-alpes.png" alt="Logo Rancho Los Alpes" /></div>
        <nav className="users-admin-sidebar__nav" aria-label="Navegacion de modulos">
          {NAV_ITEMS.map((item) => (
            <button key={item} type="button" data-testid={`productivo-nav-${item.toLowerCase()}`}
              className={`users-admin-sidebar__nav-item ${item === 'Produccion' ? 'is-active' : ''}`}
              onClick={item === 'Produccion' ? undefined : () => onNavigate(item)}>
              {item}
            </button>
          ))}
        </nav>
        <footer className="users-admin-sidebar__footer">
          <p>{user?.nombreCompleto || 'Usuario'}</p>
          <small>{user?.rol || 'Sin rol'}</small>
          <Button type="button" className="users-admin-sidebar__logout" onClick={logout} data-testid="productivo-sidebar-logout-button">Cerrar sesion</Button>
        </footer>
      </aside>

      {/* ─── Main ─── */}
      <main className="users-admin-main">
        <header className="users-admin-main__header" data-testid="productivo-admin-header">
          <h1>Produccion</h1>
          <p>Pesos, leche y reproduccion del ganado</p>
        </header>

        <div className="users-admin-main__body">
          {!canView ? (
            <article className="users-admin-empty"><h2>Acceso restringido</h2><p>Tu rol no tiene permisos para produccion.</p><Button type="button" variant="ghost" onClick={onGoHome}>Volver</Button></article>
          ) : loadingInit ? (
            <article className="users-admin-empty"><h2>Cargando produccion...</h2><p>Preparando datos iniciales.</p></article>
          ) : (
            <div className="productivo-content">
              {/* ─── Tabs ─── */}
              <div className="productivo-tabs" data-testid="productivo-tabs">
                <button type="button" className={`productivo-tab ${activeTab === 'lotes' ? 'is-active' : ''}`} onClick={() => setActiveTab('lotes')} data-testid="tab-lotes">
                  📋 Lotes de validacion
                </button>
                <button type="button" className={`productivo-tab ${activeTab === 'peso' ? 'is-active' : ''}`} onClick={() => setActiveTab('peso')} data-testid="tab-peso">
                  ⚖️ Registro de peso
                </button>
                <button type="button" className={`productivo-tab ${activeTab === 'leche' ? 'is-active' : ''}`} onClick={() => setActiveTab('leche')} data-testid="tab-leche">
                  🥛 Produccion de leche
                </button>
                {canRepro ? (
                  <button type="button" className={`productivo-tab ${activeTab === 'reproductivo' ? 'is-active' : ''}`} onClick={() => setActiveTab('reproductivo')} data-testid="tab-reproductivo">
                    🐄 Eventos reproductivos
                  </button>
                ) : null}
              </div>

              {/* ─── Message ─── */}
              {message ? <p className={`users-message users-message--${message.type}`} data-testid="productivo-message">{message.text}</p> : null}

              {/* ─── TAB: Lotes ─── */}
              {activeTab === 'lotes' ? (
                <div className="productivo-tab-content">
                  {/* Formulario */}
                  {canLote ? (
                    <article className="productivo-card">
                      <div className="users-admin-card__title"><h2>Nuevo lote de validacion</h2></div>
                      <p className="productivo-subtitle">Define el periodo de medicion para el ganado</p>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Fecha de inicio</span><input type="date" value={loteForm.fechaInicio} onChange={(e) => setLoteForm((p) => ({ ...p, fechaInicio: e.target.value }))} data-testid="lote-fecha-inicio" /></label>
                        <label className="productivo-field"><span>Fecha de fin</span><input type="date" value={loteForm.fechaFin} onChange={(e) => setLoteForm((p) => ({ ...p, fechaFin: e.target.value }))} data-testid="lote-fecha-fin" /></label>
                      </div>
                      <Button type="button" onClick={onCreateLote} disabled={savingLote || !loteForm.fechaInicio || !loteForm.fechaFin} data-testid="btn-crear-lote">{savingLote ? 'Guardando...' : 'Crear lote'}</Button>
                    </article>
                  ) : null}

                  {/* Filtro */}
                  <div className="productivo-filters">
                    <label className="productivo-field"><span>Estado</span>
                      <select value={loteFilter} onChange={(e) => setLoteFilter(e.target.value as EstadoRegistro | 'TODOS')} data-testid="lote-filter-estado">
                        <option value="TODOS">Todos</option><option value="PENDIENTE">Pendiente</option><option value="APROBADO">Aprobado</option><option value="RECHAZADO">Rechazado</option>
                      </select>
                    </label>
                  </div>

                  {/* Tabla */}
                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Lotes de validacion</h2><small>{filteredLotes.length} registros</small></div>
                    <div className="productivo-table-wrap">
                      <table className="productivo-table">
                        <thead>
                          <tr>
                            <th>ID</th><th>Inicio</th><th>Fin</th><th>Creado por</th><th>Fecha creacion</th><th>Estado</th>
                            {canValidar ? <th>Acciones</th> : null}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLotes.length === 0 ? (
                            <tr><td colSpan={canValidar ? 7 : 6} className="productivo-table-empty">No hay lotes con estos filtros.</td></tr>
                          ) : filteredLotes.map((l) => (
                            <tr key={l.idLote}>
                              <td className="productivo-table-id">#{l.idLote}</td>
                              <td>{toInputDate(l.fechaInicio)}</td>
                              <td>{toInputDate(l.fechaFin)}</td>
                              <td>{l.creador?.nombreCompleto || 'N/A'}</td>
                              <td>{toInputDate(l.fechaCreacion)}</td>
                              <td><span className={`productivo-status ${getEstadoClass(l.estado)}`}>{l.estado}</span></td>
                              {canValidar ? (
                                <td>
                                  {l.estado === 'PENDIENTE' ? (
                                    <div className="productivo-table-actions">
                                      <Button type="button" className="users-btn-success" onClick={() => void onValidarLote(l.idLote, 'APROBADO')} data-testid={`btn-aprobar-lote-${l.idLote}`}>Aprobar</Button>
                                      <Button type="button" className="users-btn-danger" onClick={() => void onValidarLote(l.idLote, 'RECHAZADO')} data-testid={`btn-rechazar-lote-${l.idLote}`}>Rechazar</Button>
                                    </div>
                                  ) : <span className="productivo-immutable">Inmutable</span>}
                                </td>
                              ) : null}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
              ) : null}

              {/* ─── TAB: Peso ─── */}
              {activeTab === 'peso' ? (
                <div className="productivo-tab-content">
                  {canCreate ? (
                    <article className="productivo-card">
                      <div className="users-admin-card__title"><h2>{editingPesoId ? 'Editar registro de peso' : 'Nuevo registro de peso'}</h2>{editingPesoId ? <Button type="button" variant="ghost" onClick={resetPesoForm}>Cancelar</Button> : null}</div>
                      <p className="productivo-subtitle">El peso debe ser ≥ 50% del peso inicial del animal</p>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Animal</span>
                          <select value={pesoForm.idAnimal} onChange={(e) => setPesoForm((p) => ({ ...p, idAnimal: e.target.value }))} disabled={!!editingPesoId} data-testid="peso-animal">
                            <option value="">Selecciona un animal</option>
                            {animales.map((a) => <option key={a.idAnimal} value={a.idAnimal}>{a.numeroArete} — {a.nombreRaza}</option>)}
                          </select>
                        </label>
                        <label className="productivo-field"><span>Lote de validacion</span>
                          <select value={pesoForm.idLote} onChange={(e) => setPesoForm((p) => ({ ...p, idLote: e.target.value }))} disabled={!!editingPesoId} data-testid="peso-lote">
                            <option value="">Selecciona un lote</option>
                            {lotes.map((l) => <option key={l.idLote} value={l.idLote}>#{l.idLote} ({toInputDate(l.fechaInicio)} → {toInputDate(l.fechaFin)}) [{l.estado}]</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Peso (kg)</span><input type="number" min="0.1" step="0.1" placeholder="ej. 285.5" value={pesoForm.peso} onChange={(e) => setPesoForm((p) => ({ ...p, peso: e.target.value }))} data-testid="peso-kg" /></label>
                        <label className="productivo-field"><span>Fecha de medicion</span><input type="date" value={pesoForm.fechaRegistro} onChange={(e) => setPesoForm((p) => ({ ...p, fechaRegistro: e.target.value }))} data-testid="peso-fecha" /></label>
                      </div>
                      <Button type="button" onClick={onSavePeso} disabled={savingPeso} data-testid="btn-guardar-peso">{savingPeso ? 'Guardando...' : editingPesoId ? 'Guardar cambios' : 'Registrar peso'}</Button>
                    </article>
                  ) : null}

                  <div className="productivo-filters">
                    <label className="productivo-field"><span>Animal</span><select value={pesoFilter.idAnimal} onChange={(e) => setPesoFilter((p) => ({ ...p, idAnimal: e.target.value }))}><option value="">Todos</option>{animales.map((a) => <option key={a.idAnimal} value={a.idAnimal}>{a.numeroArete}</option>)}</select></label>
                    <label className="productivo-field"><span>Lote</span><select value={pesoFilter.idLote} onChange={(e) => setPesoFilter((p) => ({ ...p, idLote: e.target.value }))}><option value="">Todos</option>{lotes.map((l) => <option key={l.idLote} value={l.idLote}>#{l.idLote}</option>)}</select></label>
                    <label className="productivo-field"><span>Estado</span><select value={pesoFilter.estado} onChange={(e) => setPesoFilter((p) => ({ ...p, estado: e.target.value as EstadoRegistro | 'TODOS' }))}><option value="TODOS">Todos</option><option value="PENDIENTE">Pendiente</option><option value="APROBADO">Aprobado</option><option value="RECHAZADO">Rechazado</option></select></label>
                  </div>

                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Historial de pesos</h2><small>{pesos.length} registros</small></div>
                    {loadingPesos ? <p className="productivo-helper">Cargando registros...</p> : (
                      <div className="productivo-table-wrap">
                        <table className="productivo-table">
                          <thead><tr><th>Arete</th><th>Lote</th><th>Peso</th><th>Fecha</th><th>Registrado por</th><th>Estado</th><th>Acciones</th></tr></thead>
                          <tbody>
                            {pesos.length === 0 ? <tr><td colSpan={7} className="productivo-table-empty">No hay registros.</td></tr> : pesos.map((r) => (
                              <tr key={r.idRegistroPeso}>
                                <td className="productivo-table-id">{r.animal?.numeroArete || 'N/A'}</td>
                                <td>#{r.idLote}</td>
                                <td className="productivo-table-value">{toNumeric(r.peso)} <small>kg</small></td>
                                <td>{toInputDate(r.fechaRegistro)}</td>
                                <td>{r.registrador?.nombreCompleto || 'N/A'}</td>
                                <td><span className={`productivo-status ${getEstadoClass(r.estadoValidacion)}`}>{r.estadoValidacion}</span></td>
                                <td>
                                  {r.estadoValidacion === 'PENDIENTE' ? (
                                    <div className="productivo-table-actions">
                                      {canEdit ? <Button type="button" variant="ghost" onClick={() => { setEditingPesoId(r.idRegistroPeso); setPesoForm({ idAnimal: String(r.idAnimal), idLote: String(r.idLote), peso: String(toNumeric(r.peso)), fechaRegistro: toInputDate(r.fechaRegistro) }); }}>Editar</Button> : null}
                                      {canValidar ? <Button type="button" className="users-btn-success" onClick={() => void onValidarPeso(r.idRegistroPeso, 'APROBADO')}>Aprobar</Button> : null}
                                      {canValidar ? <Button type="button" className="users-btn-danger" onClick={() => void onValidarPeso(r.idRegistroPeso, 'RECHAZADO')}>Rechazar</Button> : null}
                                    </div>
                                  ) : <span className="productivo-immutable">Inmutable</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                </div>
              ) : null}

              {/* ─── TAB: Leche ─── */}
              {activeTab === 'leche' ? (
                <div className="productivo-tab-content">
                  {canCreate ? (
                    <article className="productivo-card">
                      <div className="users-admin-card__title"><h2>{editingLecheId ? 'Editar registro de leche' : 'Nuevo registro de leche'}</h2>{editingLecheId ? <Button type="button" variant="ghost" onClick={resetLecheForm}>Cancelar</Button> : null}</div>
                      <p className="productivo-subtitle">Registra la produccion diaria en litros por animal</p>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Animal</span>
                          <select value={lecheForm.idAnimal} onChange={(e) => setLecheForm((p) => ({ ...p, idAnimal: e.target.value }))} disabled={!!editingLecheId} data-testid="leche-animal">
                            <option value="">Selecciona un animal</option>
                            {animales.map((a) => <option key={a.idAnimal} value={a.idAnimal}>{a.numeroArete} — {a.nombreRaza}</option>)}
                          </select>
                        </label>
                        <label className="productivo-field"><span>Lote de validacion</span>
                          <select value={lecheForm.idLote} onChange={(e) => setLecheForm((p) => ({ ...p, idLote: e.target.value }))} disabled={!!editingLecheId} data-testid="leche-lote">
                            <option value="">Selecciona un lote</option>
                            {lotes.map((l) => <option key={l.idLote} value={l.idLote}>#{l.idLote} ({toInputDate(l.fechaInicio)} → {toInputDate(l.fechaFin)}) [{l.estado}]</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Produccion (litros)</span><input type="number" min="0.1" step="0.1" placeholder="ej. 22.4" value={lecheForm.litrosProducidos} onChange={(e) => setLecheForm((p) => ({ ...p, litrosProducidos: e.target.value }))} data-testid="leche-litros" /></label>
                        <label className="productivo-field"><span>Fecha de registro</span><input type="date" value={lecheForm.fechaRegistro} onChange={(e) => setLecheForm((p) => ({ ...p, fechaRegistro: e.target.value }))} data-testid="leche-fecha" /></label>
                      </div>
                      <Button type="button" onClick={onSaveLeche} disabled={savingLeche} data-testid="btn-guardar-leche">{savingLeche ? 'Guardando...' : editingLecheId ? 'Guardar cambios' : 'Registrar produccion'}</Button>
                    </article>
                  ) : null}

                  <div className="productivo-filters">
                    <label className="productivo-field"><span>Animal</span><select value={lecheFilter.idAnimal} onChange={(e) => setLecheFilter((p) => ({ ...p, idAnimal: e.target.value }))}><option value="">Todos</option>{animales.map((a) => <option key={a.idAnimal} value={a.idAnimal}>{a.numeroArete}</option>)}</select></label>
                    <label className="productivo-field"><span>Lote</span><select value={lecheFilter.idLote} onChange={(e) => setLecheFilter((p) => ({ ...p, idLote: e.target.value }))}><option value="">Todos</option>{lotes.map((l) => <option key={l.idLote} value={l.idLote}>#{l.idLote}</option>)}</select></label>
                    <label className="productivo-field"><span>Estado</span><select value={lecheFilter.estado} onChange={(e) => setLecheFilter((p) => ({ ...p, estado: e.target.value as EstadoRegistro | 'TODOS' }))}><option value="TODOS">Todos</option><option value="PENDIENTE">Pendiente</option><option value="APROBADO">Aprobado</option><option value="RECHAZADO">Rechazado</option></select></label>
                  </div>

                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Historial de produccion de leche</h2><small>{leches.length} registros</small></div>
                    {loadingLeche ? <p className="productivo-helper">Cargando registros...</p> : (
                      <div className="productivo-table-wrap">
                        <table className="productivo-table">
                          <thead><tr><th>Arete</th><th>Lote</th><th>Litros</th><th>Fecha</th><th>Registrado por</th><th>Estado</th><th>Acciones</th></tr></thead>
                          <tbody>
                            {leches.length === 0 ? <tr><td colSpan={7} className="productivo-table-empty">No hay registros.</td></tr> : leches.map((r) => (
                              <tr key={r.idProduccion}>
                                <td className="productivo-table-id">{r.animal?.numeroArete || 'N/A'}</td>
                                <td>#{r.idLote}</td>
                                <td className="productivo-table-value">{toNumeric(r.litrosProducidos)} <small>L</small></td>
                                <td>{toInputDate(r.fechaRegistro)}</td>
                                <td>{r.registrador?.nombreCompleto || 'N/A'}</td>
                                <td><span className={`productivo-status ${getEstadoClass(r.estadoValidacion)}`}>{r.estadoValidacion}</span></td>
                                <td>
                                  {r.estadoValidacion === 'PENDIENTE' ? (
                                    <div className="productivo-table-actions">
                                      {canEdit ? <Button type="button" variant="ghost" onClick={() => { setEditingLecheId(r.idProduccion); setLecheForm({ idAnimal: String(r.idAnimal), idLote: String(r.idLote), litrosProducidos: String(toNumeric(r.litrosProducidos)), fechaRegistro: toInputDate(r.fechaRegistro) }); }}>Editar</Button> : null}
                                      {canValidar ? <Button type="button" className="users-btn-success" onClick={() => void onValidarLeche(r.idProduccion, 'APROBADO')}>Aprobar</Button> : null}
                                      {canValidar ? <Button type="button" className="users-btn-danger" onClick={() => void onValidarLeche(r.idProduccion, 'RECHAZADO')}>Rechazar</Button> : null}
                                    </div>
                                  ) : <span className="productivo-immutable">Inmutable</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                </div>
              ) : null}

              {/* ─── TAB: Reproductivo ─── */}
              {activeTab === 'reproductivo' && canRepro ? (
                <div className="productivo-tab-content">
                  {canCreate ? (
                    <article className="productivo-card">
                      <div className="users-admin-card__title"><h2>{editingEventoId ? 'Editar evento reproductivo' : 'Nuevo evento reproductivo'}</h2>{editingEventoId ? <Button type="button" variant="ghost" onClick={resetEventoForm}>Cancelar</Button> : null}</div>
                      <p className="productivo-subtitle">Registra eventos: celo, monta, preñez, parto o aborto</p>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Animal</span>
                          <select value={eventoForm.idAnimal} onChange={(e) => setEventoForm((p) => ({ ...p, idAnimal: e.target.value }))} disabled={!!editingEventoId} data-testid="evento-animal">
                            <option value="">Selecciona un animal</option>
                            {animales.map((a) => <option key={a.idAnimal} value={a.idAnimal}>{a.numeroArete} — {a.nombreRaza}</option>)}
                          </select>
                        </label>
                        <label className="productivo-field"><span>Lote de validacion</span>
                          <select value={eventoForm.idLote} onChange={(e) => setEventoForm((p) => ({ ...p, idLote: e.target.value }))} disabled={!!editingEventoId} data-testid="evento-lote">
                            <option value="">Selecciona un lote</option>
                            {lotes.map((l) => <option key={l.idLote} value={l.idLote}>#{l.idLote} ({toInputDate(l.fechaInicio)} → {toInputDate(l.fechaFin)}) [{l.estado}]</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Tipo de evento</span>
                          <select value={eventoForm.tipoEvento} onChange={(e) => setEventoForm((p) => ({ ...p, tipoEvento: e.target.value }))} data-testid="evento-tipo">
                            <option value="">Selecciona el tipo</option>
                            {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </label>
                        <label className="productivo-field"><span>Fecha del evento</span><input type="date" value={eventoForm.fechaEvento} onChange={(e) => setEventoForm((p) => ({ ...p, fechaEvento: e.target.value }))} data-testid="evento-fecha" /></label>
                      </div>
                      <label className="productivo-field"><span>Observaciones</span><textarea rows={3} maxLength={1000} placeholder="Notas adicionales (opcional)" value={eventoForm.observaciones} onChange={(e) => setEventoForm((p) => ({ ...p, observaciones: e.target.value }))} data-testid="evento-obs" /></label>
                      <Button type="button" onClick={onSaveEvento} disabled={savingEvento} data-testid="btn-guardar-evento">{savingEvento ? 'Guardando...' : editingEventoId ? 'Guardar cambios' : 'Registrar evento'}</Button>
                    </article>
                  ) : null}

                  <div className="productivo-filters productivo-filters--4">
                    <label className="productivo-field"><span>Animal</span><select value={eventoFilter.idAnimal} onChange={(e) => setEventoFilter((p) => ({ ...p, idAnimal: e.target.value }))}><option value="">Todos</option>{animales.map((a) => <option key={a.idAnimal} value={a.idAnimal}>{a.numeroArete}</option>)}</select></label>
                    <label className="productivo-field"><span>Lote</span><select value={eventoFilter.idLote} onChange={(e) => setEventoFilter((p) => ({ ...p, idLote: e.target.value }))}><option value="">Todos</option>{lotes.map((l) => <option key={l.idLote} value={l.idLote}>#{l.idLote}</option>)}</select></label>
                    <label className="productivo-field"><span>Tipo</span><select value={eventoFilter.tipo} onChange={(e) => setEventoFilter((p) => ({ ...p, tipo: e.target.value as TipoEventoReproductivo | 'TODOS' }))}><option value="TODOS">Todos</option>{TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
                    <label className="productivo-field"><span>Estado</span><select value={eventoFilter.estado} onChange={(e) => setEventoFilter((p) => ({ ...p, estado: e.target.value as EstadoRegistro | 'TODOS' }))}><option value="TODOS">Todos</option><option value="PENDIENTE">Pendiente</option><option value="APROBADO">Aprobado</option><option value="RECHAZADO">Rechazado</option></select></label>
                  </div>

                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Historial de eventos reproductivos</h2><small>{eventos.length} registros</small></div>
                    {loadingEventos ? <p className="productivo-helper">Cargando eventos...</p> : (
                      <div className="productivo-table-wrap">
                        <table className="productivo-table">
                          <thead><tr><th>Arete</th><th>Lote</th><th>Tipo</th><th>Fecha</th><th>Observaciones</th><th>Registrado por</th><th>Estado</th><th>Acciones</th></tr></thead>
                          <tbody>
                            {eventos.length === 0 ? <tr><td colSpan={8} className="productivo-table-empty">No hay eventos.</td></tr> : eventos.map((e) => (
                              <tr key={e.idEventoReproductivo}>
                                <td className="productivo-table-id">{e.animal?.numeroArete || 'N/A'}</td>
                                <td>#{e.idLote}</td>
                                <td><span className={`productivo-tipo ${getTipoEventoClass(e.tipoEvento)}`}>{e.tipoEvento}</span></td>
                                <td>{toInputDate(e.fechaEvento)}</td>
                                <td className="productivo-table-obs">{e.observaciones || '—'}</td>
                                <td>{e.registrador?.nombreCompleto || 'N/A'}</td>
                                <td><span className={`productivo-status ${getEstadoClass(e.estadoValidacion)}`}>{e.estadoValidacion}</span></td>
                                <td>
                                  {e.estadoValidacion === 'PENDIENTE' ? (
                                    <div className="productivo-table-actions">
                                      {canEdit ? <Button type="button" variant="ghost" onClick={() => { setEditingEventoId(e.idEventoReproductivo); setEventoForm({ idAnimal: String(e.idAnimal), idLote: String(e.idLote), tipoEvento: e.tipoEvento, fechaEvento: toInputDate(e.fechaEvento), observaciones: e.observaciones || '' }); }}>Editar</Button> : null}
                                      {canValidar ? <Button type="button" className="users-btn-success" onClick={() => void onValidarEvento(e.idEventoReproductivo, 'APROBADO')}>Aprobar</Button> : null}
                                      {canValidar ? <Button type="button" className="users-btn-danger" onClick={() => void onValidarEvento(e.idEventoReproductivo, 'RECHAZADO')}>Rechazar</Button> : null}
                                    </div>
                                  ) : <span className="productivo-immutable">Inmutable</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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
