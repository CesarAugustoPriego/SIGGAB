import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { getVisibleNavItemsForRole } from '../../auth/navigation-utils';
import { Button, NAV_ITEMS, LogOut, Scale, Milk, Baby } from '../../../shared/ui';
import { ApiClientError } from '../../../types/api';
import { productivoApi } from '../productivo-api';
import type {
  RegistroPeso,
  ProduccionLeche,
  EventoReproductivo,
  EstadoRegistro,
  TipoEventoReproductivo,
} from '../productivo-types';
import {
  canViewProductivo,
  canListProductivo,
  canCreateRegistro,
  canCreateEventoReproductivo,
  canEditRegistro,
  canValidarRegistro,
  canViewReproductivos,
  getEstadoClass,
  getTipoEventoClass,
  getProductivoErrorMessage,
  toInputDate,
  toNumeric,
} from '../productivo-utils';

interface ProductivoAdminPageProps {
  onGoHome: () => void;
  onGoUsersAdmin?: () => void;
  onNavigateModule?: (moduleName: string) => void;
}

interface UiMessage {
  type: 'error' | 'success' | 'warn';
  text: string;
}

type Tab = 'peso' | 'leche' | 'reproductivo';

interface AnimalOption {
  idAnimal: number;
  numeroArete: string;
  nombreRaza: string;
  sexo: 'HEMBRA' | 'MACHO';
}

const TIPOS_EVENTO: TipoEventoReproductivo[] = ['CELO', 'MONTA', 'PREÑEZ', 'PARTO', 'ABORTO'];

export function ProductivoAdminPage({ onGoHome, onGoUsersAdmin, onNavigateModule }: ProductivoAdminPageProps) {
  const { user, logout } = useAuth();
  const visibleNavItems = useMemo(() => getVisibleNavItemsForRole(user?.rol, NAV_ITEMS), [user?.rol]);

  const [activeTab, setActiveTab] = useState<Tab>(() => (
    canListProductivo(user?.rol) ? 'peso' : 'reproductivo'
  ));
  const [loadingInit, setLoadingInit] = useState(true);
  const [message, setMessage] = useState<UiMessage | null>(null);

  const [animales, setAnimales] = useState<AnimalOption[]>([]);
  const hembras = useMemo(() => animales.filter((animal) => animal.sexo === 'HEMBRA'), [animales]);

  const [pesos, setPesos] = useState<RegistroPeso[]>([]);
  const [loadingPesos, setLoadingPesos] = useState(false);
  const [pesoForm, setPesoForm] = useState({ idAnimal: '', peso: '', fechaRegistro: '' });
  const [savingPeso, setSavingPeso] = useState(false);
  const [pesoFilter, setPesoFilter] = useState({ idAnimal: '', estado: 'TODOS' as EstadoRegistro | 'TODOS' });
  const [editingPesoId, setEditingPesoId] = useState<number | null>(null);

  const [leches, setLeches] = useState<ProduccionLeche[]>([]);
  const [loadingLeche, setLoadingLeche] = useState(false);
  const [lecheForm, setLecheForm] = useState({ idAnimal: '', litrosProducidos: '', fechaRegistro: '' });
  const [savingLeche, setSavingLeche] = useState(false);
  const [lecheFilter, setLecheFilter] = useState({ idAnimal: '', estado: 'TODOS' as EstadoRegistro | 'TODOS' });
  const [editingLecheId, setEditingLecheId] = useState<number | null>(null);

  const [eventos, setEventos] = useState<EventoReproductivo[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [eventoForm, setEventoForm] = useState({ idAnimal: '', tipoEvento: '', fechaEvento: '', observaciones: '' });
  const [savingEvento, setSavingEvento] = useState(false);
  const [eventoFilter, setEventoFilter] = useState({
    idAnimal: '',
    tipo: 'TODOS' as TipoEventoReproductivo | 'TODOS',
    estado: 'TODOS' as EstadoRegistro | 'TODOS',
  });
  const [editingEventoId, setEditingEventoId] = useState<number | null>(null);

  const canView = useMemo(() => canViewProductivo(user?.rol), [user?.rol]);
  const canCreate = useMemo(() => canCreateRegistro(user?.rol), [user?.rol]);
  const canEdit = useMemo(() => canEditRegistro(user?.rol), [user?.rol]);
  const canValidar = useMemo(() => canValidarRegistro(user?.rol), [user?.rol]);
  const canRepro = useMemo(() => canViewReproductivos(user?.rol), [user?.rol]);
  const canCreateRepro = useMemo(() => canCreateEventoReproductivo(user?.rol), [user?.rol]);
  const canList = useMemo(() => canListProductivo(user?.rol), [user?.rol]);

  const handleApiError = useCallback(async (error: unknown) => {
    setMessage({ type: 'error', text: getProductivoErrorMessage(error) });
    if (error instanceof ApiClientError && error.status === 401) await logout();
  }, [logout]);

  const loadAnimales = useCallback(async () => {
    try {
      const { httpClient } = await import('../../../lib/http-client');
      const data = await httpClient.get<{ idAnimal: number; numeroArete: string; sexo: 'HEMBRA' | 'MACHO'; raza?: { nombreRaza: string } | null }[]>('/animales?estado=ACTIVO');
      setAnimales(data.map((animal) => ({
        idAnimal: animal.idAnimal,
        numeroArete: animal.numeroArete,
        nombreRaza: animal.raza?.nombreRaza || 'Sin raza',
        sexo: animal.sexo,
      })));
    } catch (error) {
      await handleApiError(error);
    }
  }, [handleApiError]);

  const loadPesos = useCallback(async () => {
    try {
      setLoadingPesos(true);
      const filters = {
        idAnimal: pesoFilter.idAnimal ? Number(pesoFilter.idAnimal) : undefined,
        estado: pesoFilter.estado !== 'TODOS' ? pesoFilter.estado : undefined,
      };
      setPesos(await productivoApi.getRegistrosPeso(filters));
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoadingPesos(false);
    }
  }, [pesoFilter, handleApiError]);

  const loadLeche = useCallback(async () => {
    try {
      setLoadingLeche(true);
      const filters = {
        idAnimal: lecheFilter.idAnimal ? Number(lecheFilter.idAnimal) : undefined,
        estado: lecheFilter.estado !== 'TODOS' ? lecheFilter.estado : undefined,
      };
      setLeches(await productivoApi.getProduccionLeche(filters));
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoadingLeche(false);
    }
  }, [lecheFilter, handleApiError]);

  const loadEventos = useCallback(async () => {
    try {
      setLoadingEventos(true);
      const filters = {
        idAnimal: eventoFilter.idAnimal ? Number(eventoFilter.idAnimal) : undefined,
        tipo: eventoFilter.tipo !== 'TODOS' ? eventoFilter.tipo : undefined,
        estado: eventoFilter.estado !== 'TODOS' ? eventoFilter.estado : undefined,
      };
      setEventos(await productivoApi.getEventosReproductivos(filters));
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoadingEventos(false);
    }
  }, [eventoFilter, handleApiError]);

  useEffect(() => {
    if (!canView) {
      setLoadingInit(false);
      return;
    }

    void loadAnimales().finally(() => setLoadingInit(false));
  }, [canView, loadAnimales]);

  useEffect(() => {
    if (!canView || loadingInit) return;
    if (activeTab === 'peso' && canList) void loadPesos();
    if (activeTab === 'leche' && canList) void loadLeche();
    if (activeTab === 'reproductivo' && canRepro) void loadEventos();
  }, [activeTab, canView, loadingInit, canList, canRepro, loadPesos, loadLeche, loadEventos]);

  const onNavigate = (moduleName: string) => {
    if (moduleName === 'Usuarios' && onGoUsersAdmin) return onGoUsersAdmin();
    if (onNavigateModule) return onNavigateModule(moduleName);
    return onGoHome();
  };

  const resetPesoForm = () => {
    setPesoForm({ idAnimal: '', peso: '', fechaRegistro: '' });
    setEditingPesoId(null);
  };

  const onSavePeso = async () => {
    if (editingPesoId) {
      const payload: { peso?: number; fechaRegistro?: string } = {};
      if (pesoForm.peso) payload.peso = Number(pesoForm.peso);
      if (pesoForm.fechaRegistro) payload.fechaRegistro = pesoForm.fechaRegistro;

      try {
        setSavingPeso(true);
        setMessage(null);
        const updated = await productivoApi.updateRegistroPeso(editingPesoId, payload);
        setPesos((prev) => prev.map((record) => (record.idRegistroPeso === updated.idRegistroPeso ? updated : record)));
        setMessage({ type: 'success', text: 'Registro de peso actualizado.' });
        resetPesoForm();
      } catch (error) {
        await handleApiError(error);
      } finally {
        setSavingPeso(false);
      }
      return;
    }

    if (!pesoForm.idAnimal || !pesoForm.peso || !pesoForm.fechaRegistro) {
      setMessage({ type: 'error', text: 'Animal, peso y fecha son obligatorios.' });
      return;
    }

    const peso = Number(pesoForm.peso);
    if (peso <= 0) {
      setMessage({ type: 'error', text: 'El peso debe ser mayor a 0.' });
      return;
    }

    try {
      setSavingPeso(true);
      setMessage(null);
      const created = await productivoApi.createRegistroPeso({
        idAnimal: Number(pesoForm.idAnimal),
        peso,
        fechaRegistro: pesoForm.fechaRegistro,
      });
      setPesos((prev) => [created, ...prev]);
      resetPesoForm();
      setMessage({ type: 'success', text: 'Peso registrado, pendiente de aprobacion.' });
    } catch (error) {
      await handleApiError(error);
    } finally {
      setSavingPeso(false);
    }
  };

  const onValidarPeso = async (id: number, estado: 'APROBADO' | 'RECHAZADO') => {
    try {
      setMessage(null);
      const updated = await productivoApi.validarRegistroPeso(id, { estadoValidacion: estado });
      setPesos((prev) => prev.map((record) => (record.idRegistroPeso === updated.idRegistroPeso ? updated : record)));
      setMessage({ type: 'success', text: `Registro ${estado === 'APROBADO' ? 'aprobado' : 'rechazado'}.` });
    } catch (error) {
      await handleApiError(error);
    }
  };

  const resetLecheForm = () => {
    setLecheForm({ idAnimal: '', litrosProducidos: '', fechaRegistro: '' });
    setEditingLecheId(null);
  };

  const onSaveLeche = async () => {
    if (editingLecheId) {
      const payload: { litrosProducidos?: number; fechaRegistro?: string } = {};
      if (lecheForm.litrosProducidos) payload.litrosProducidos = Number(lecheForm.litrosProducidos);
      if (lecheForm.fechaRegistro) payload.fechaRegistro = lecheForm.fechaRegistro;

      try {
        setSavingLeche(true);
        setMessage(null);
        const updated = await productivoApi.updateProduccionLeche(editingLecheId, payload);
        setLeches((prev) => prev.map((record) => (record.idProduccion === updated.idProduccion ? updated : record)));
        setMessage({ type: 'success', text: 'Registro de leche actualizado.' });
        resetLecheForm();
      } catch (error) {
        await handleApiError(error);
      } finally {
        setSavingLeche(false);
      }
      return;
    }

    if (!lecheForm.idAnimal || !lecheForm.litrosProducidos || !lecheForm.fechaRegistro) {
      setMessage({ type: 'error', text: 'Animal, litros y fecha son obligatorios.' });
      return;
    }

    const litros = Number(lecheForm.litrosProducidos);
    if (litros <= 0) {
      setMessage({ type: 'error', text: 'Los litros deben ser mayores a 0.' });
      return;
    }

    try {
      setSavingLeche(true);
      setMessage(null);
      const created = await productivoApi.createProduccionLeche({
        idAnimal: Number(lecheForm.idAnimal),
        litrosProducidos: litros,
        fechaRegistro: lecheForm.fechaRegistro,
      });
      setLeches((prev) => [created, ...prev]);
      resetLecheForm();
      setMessage({ type: 'success', text: 'Produccion registrada, pendiente de aprobacion.' });
    } catch (error) {
      await handleApiError(error);
    } finally {
      setSavingLeche(false);
    }
  };

  const onValidarLeche = async (id: number, estado: 'APROBADO' | 'RECHAZADO') => {
    try {
      setMessage(null);
      const updated = await productivoApi.validarProduccionLeche(id, { estadoValidacion: estado });
      setLeches((prev) => prev.map((record) => (record.idProduccion === updated.idProduccion ? updated : record)));
      setMessage({ type: 'success', text: `Registro ${estado === 'APROBADO' ? 'aprobado' : 'rechazado'}.` });
    } catch (error) {
      await handleApiError(error);
    }
  };

  const resetEventoForm = () => {
    setEventoForm({ idAnimal: '', tipoEvento: '', fechaEvento: '', observaciones: '' });
    setEditingEventoId(null);
  };

  const onSaveEvento = async () => {
    if (editingEventoId) {
      const payload: { tipoEvento?: TipoEventoReproductivo; fechaEvento?: string; observaciones?: string } = {};
      if (eventoForm.tipoEvento) payload.tipoEvento = eventoForm.tipoEvento as TipoEventoReproductivo;
      if (eventoForm.fechaEvento) payload.fechaEvento = eventoForm.fechaEvento;
      payload.observaciones = eventoForm.observaciones || undefined;

      try {
        setSavingEvento(true);
        setMessage(null);
        const updated = await productivoApi.updateEventoReproductivo(editingEventoId, payload);
        setEventos((prev) => prev.map((record) => (
          record.idEventoReproductivo === updated.idEventoReproductivo ? updated : record
        )));
        setMessage({ type: 'success', text: 'Evento reproductivo actualizado.' });
        resetEventoForm();
      } catch (error) {
        await handleApiError(error);
      } finally {
        setSavingEvento(false);
      }
      return;
    }

    if (!eventoForm.idAnimal || !eventoForm.tipoEvento || !eventoForm.fechaEvento) {
      setMessage({ type: 'error', text: 'Animal, tipo y fecha son obligatorios.' });
      return;
    }

    try {
      setSavingEvento(true);
      setMessage(null);
      const created = await productivoApi.createEventoReproductivo({
        idAnimal: Number(eventoForm.idAnimal),
        tipoEvento: eventoForm.tipoEvento as TipoEventoReproductivo,
        fechaEvento: eventoForm.fechaEvento,
        observaciones: eventoForm.observaciones || undefined,
      });
      setEventos((prev) => [created, ...prev]);
      resetEventoForm();
      setMessage({ type: 'success', text: 'Evento registrado, pendiente de aprobacion.' });
    } catch (error) {
      await handleApiError(error);
    } finally {
      setSavingEvento(false);
    }
  };

  const onValidarEvento = async (id: number, estado: 'APROBADO' | 'RECHAZADO') => {
    try {
      setMessage(null);
      const updated = await productivoApi.validarEventoReproductivo(id, { estadoValidacion: estado });
      setEventos((prev) => prev.map((record) => (
        record.idEventoReproductivo === updated.idEventoReproductivo ? updated : record
      )));
      setMessage({ type: 'success', text: `Evento ${estado === 'APROBADO' ? 'aprobado' : 'rechazado'}.` });
    } catch (error) {
      await handleApiError(error);
    }
  };

  return (
    <section className="users-admin-shell" data-testid="productivo-admin-page">
      <aside className="users-admin-sidebar">
        <div className="users-admin-sidebar__logo">
          <img src="/branding/logo-rancho-los-alpes.png" alt="Logo Rancho Los Alpes" />
        </div>
        <nav className="users-admin-sidebar__nav" aria-label="Navegacion de modulos">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className={`users-admin-sidebar__nav-item ${item.label === 'Productivo' ? 'is-active' : ''}`}
                onClick={item.label === 'Productivo' ? undefined : () => onNavigate(item.label)}
              >
                <Icon size={18} aria-hidden />
                {item.label}
              </button>
            );
          })}
        </nav>
        <footer className="users-admin-sidebar__footer">
          <p>{user?.nombreCompleto || 'Usuario'}</p>
          <small>{user?.rol || 'Sin rol'}</small>
          <Button type="button" className="users-admin-sidebar__logout" onClick={logout}>
            <LogOut size={15} aria-hidden />
            Cerrar sesion
          </Button>
        </footer>
      </aside>

      <main className="users-admin-main">
        <header className="users-admin-main__header">
          <div>
            <h1>Control productivo</h1>
            <p>Registro directo y validacion individual de produccion.</p>
          </div>
        </header>

        <div className="users-admin-main__body">
          {!canView ? (
            <article className="users-admin-empty">
              <h2>Acceso restringido</h2>
              <p>Tu rol no tiene permisos para ver el modulo productivo.</p>
              <Button type="button" variant="ghost" onClick={onGoHome}>Volver</Button>
            </article>
          ) : loadingInit ? (
            <article className="users-admin-empty">
              <h2>Cargando modulo productivo...</h2>
              <p>Consultando animales activos.</p>
            </article>
          ) : (
            <div className="productivo-content">
              {message ? <p className={`users-message users-message--${message.type}`}>{message.text}</p> : null}

              <div className="productivo-tabs">
                {canList ? (
                  <>
                    <button
                      type="button"
                      className={`productivo-tab ${activeTab === 'peso' ? 'is-active' : ''}`}
                      onClick={() => setActiveTab('peso')}
                    >
                      <Scale size={16} aria-hidden />
                      Pesos
                    </button>
                    <button
                      type="button"
                      className={`productivo-tab ${activeTab === 'leche' ? 'is-active' : ''}`}
                      onClick={() => setActiveTab('leche')}
                    >
                      <Milk size={16} aria-hidden />
                      Leche
                    </button>
                  </>
                ) : null}
                {canRepro ? (
                  <button
                    type="button"
                    className={`productivo-tab ${activeTab === 'reproductivo' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('reproductivo')}
                  >
                    <Baby size={16} aria-hidden />
                    Reproductivo
                  </button>
                ) : null}
              </div>

              {activeTab === 'peso' && canList ? (
                <div className="productivo-tab-content">
                  {canCreate ? (
                    <article className="productivo-card">
                      <div className="users-admin-card__title">
                        <h2>{editingPesoId ? 'Editar registro de peso' : 'Nuevo registro de peso'}</h2>
                        {editingPesoId ? <Button type="button" variant="ghost" onClick={resetPesoForm}>Cancelar</Button> : null}
                      </div>
                      <p className="productivo-subtitle">El registro queda pendiente hasta que administracion lo apruebe.</p>
                      <div className="productivo-field-row">
                        <label className="productivo-field">
                          <span>Animal</span>
                          <select
                            value={pesoForm.idAnimal}
                            onChange={(event) => setPesoForm((prev) => ({ ...prev, idAnimal: event.target.value }))}
                            disabled={!!editingPesoId}
                            data-testid="peso-animal"
                          >
                            <option value="">Selecciona un animal</option>
                            {animales.map((animal) => (
                              <option key={animal.idAnimal} value={animal.idAnimal}>
                                {animal.numeroArete} - {animal.nombreRaza}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="productivo-field">
                          <span>Peso (kg)</span>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            placeholder="ej. 285.5"
                            value={pesoForm.peso}
                            onChange={(event) => setPesoForm((prev) => ({ ...prev, peso: event.target.value }))}
                            data-testid="peso-kg"
                          />
                        </label>
                      </div>
                      <div className="productivo-field-row">
                        <label className="productivo-field">
                          <span>Fecha de medicion</span>
                          <input
                            type="date"
                            value={pesoForm.fechaRegistro}
                            onChange={(event) => setPesoForm((prev) => ({ ...prev, fechaRegistro: event.target.value }))}
                            data-testid="peso-fecha"
                          />
                        </label>
                      </div>
                      <Button type="button" onClick={onSavePeso} disabled={savingPeso} data-testid="btn-guardar-peso">
                        {savingPeso ? 'Guardando...' : editingPesoId ? 'Guardar cambios' : 'Registrar peso'}
                      </Button>
                    </article>
                  ) : null}

                  <div className="productivo-filters productivo-filters--3">
                    <label className="productivo-field">
                      <span>Animal</span>
                      <select value={pesoFilter.idAnimal} onChange={(event) => setPesoFilter((prev) => ({ ...prev, idAnimal: event.target.value }))}>
                        <option value="">Todos</option>
                        {animales.map((animal) => <option key={animal.idAnimal} value={animal.idAnimal}>{animal.numeroArete}</option>)}
                      </select>
                    </label>
                    <label className="productivo-field">
                      <span>Estado</span>
                      <select value={pesoFilter.estado} onChange={(event) => setPesoFilter((prev) => ({ ...prev, estado: event.target.value as EstadoRegistro | 'TODOS' }))}>
                        <option value="TODOS">Todos</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="APROBADO">Aprobado</option>
                        <option value="RECHAZADO">Rechazado</option>
                      </select>
                    </label>
                  </div>

                  <article className="productivo-card">
                    <div className="users-admin-card__title">
                      <h2>Historial de pesos</h2>
                      <small>{pesos.length} registros</small>
                    </div>
                    {loadingPesos ? <p className="productivo-helper">Cargando registros...</p> : (
                      <div className="productivo-table-wrap">
                        <table className="productivo-table">
                          <thead>
                            <tr><th>Arete</th><th>Peso</th><th>Fecha</th><th>Registrado por</th><th>Estado</th><th>Acciones</th></tr>
                          </thead>
                          <tbody>
                            {pesos.length === 0 ? (
                              <tr><td colSpan={6} className="productivo-table-empty">No hay registros para mostrar.</td></tr>
                            ) : pesos.map((record) => (
                              <tr key={record.idRegistroPeso}>
                                <td className="productivo-table-id">{record.animal?.numeroArete || 'N/A'}</td>
                                <td className="productivo-table-value">{toNumeric(record.peso)} <small>kg</small></td>
                                <td>{toInputDate(record.fechaRegistro)}</td>
                                <td>{record.registrador?.nombreCompleto || 'N/A'}</td>
                                <td><span className={`productivo-status ${getEstadoClass(record.estadoValidacion)}`}>{record.estadoValidacion}</span></td>
                                <td>
                                  {record.estadoValidacion === 'PENDIENTE' ? (
                                    <div className="productivo-table-actions">
                                      {canEdit ? (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingPesoId(record.idRegistroPeso);
                                            setPesoForm({
                                              idAnimal: String(record.idAnimal),
                                              peso: String(toNumeric(record.peso)),
                                              fechaRegistro: toInputDate(record.fechaRegistro),
                                            });
                                          }}
                                        >
                                          Editar
                                        </Button>
                                      ) : null}
                                      {canValidar ? <Button type="button" className="users-btn-success" onClick={() => void onValidarPeso(record.idRegistroPeso, 'APROBADO')}>Aprobar</Button> : null}
                                      {canValidar ? <Button type="button" className="users-btn-danger" onClick={() => void onValidarPeso(record.idRegistroPeso, 'RECHAZADO')}>Rechazar</Button> : null}
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

              {activeTab === 'leche' && canList ? (
                <div className="productivo-tab-content">
                  {canCreate ? (
                    <article className="productivo-card">
                      <div className="users-admin-card__title">
                        <h2>{editingLecheId ? 'Editar registro de leche' : 'Nuevo registro de leche'}</h2>
                        {editingLecheId ? <Button type="button" variant="ghost" onClick={resetLecheForm}>Cancelar</Button> : null}
                      </div>
                      <p className="productivo-subtitle">Registra produccion diaria y queda pendiente para aprobacion.</p>
                      <div className="productivo-field-row">
                        <label className="productivo-field">
                          <span>Animal</span>
                          <select
                            value={lecheForm.idAnimal}
                            onChange={(event) => setLecheForm((prev) => ({ ...prev, idAnimal: event.target.value }))}
                            disabled={!!editingLecheId}
                            data-testid="leche-animal"
                          >
                            <option value="">Selecciona una hembra</option>
                            {hembras.map((animal) => (
                              <option key={animal.idAnimal} value={animal.idAnimal}>
                                {animal.numeroArete} - {animal.nombreRaza}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="productivo-field">
                          <span>Produccion (litros)</span>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            placeholder="ej. 22.4"
                            value={lecheForm.litrosProducidos}
                            onChange={(event) => setLecheForm((prev) => ({ ...prev, litrosProducidos: event.target.value }))}
                            data-testid="leche-litros"
                          />
                        </label>
                      </div>
                      <div className="productivo-field-row">
                        <label className="productivo-field">
                          <span>Fecha de registro</span>
                          <input
                            type="date"
                            value={lecheForm.fechaRegistro}
                            onChange={(event) => setLecheForm((prev) => ({ ...prev, fechaRegistro: event.target.value }))}
                            data-testid="leche-fecha"
                          />
                        </label>
                      </div>
                      <Button type="button" onClick={onSaveLeche} disabled={savingLeche} data-testid="btn-guardar-leche">
                        {savingLeche ? 'Guardando...' : editingLecheId ? 'Guardar cambios' : 'Registrar produccion'}
                      </Button>
                    </article>
                  ) : null}

                  <div className="productivo-filters productivo-filters--3">
                    <label className="productivo-field">
                      <span>Animal</span>
                      <select value={lecheFilter.idAnimal} onChange={(event) => setLecheFilter((prev) => ({ ...prev, idAnimal: event.target.value }))}>
                        <option value="">Todos</option>
                        {animales.map((animal) => <option key={animal.idAnimal} value={animal.idAnimal}>{animal.numeroArete}</option>)}
                      </select>
                    </label>
                    <label className="productivo-field">
                      <span>Estado</span>
                      <select value={lecheFilter.estado} onChange={(event) => setLecheFilter((prev) => ({ ...prev, estado: event.target.value as EstadoRegistro | 'TODOS' }))}>
                        <option value="TODOS">Todos</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="APROBADO">Aprobado</option>
                        <option value="RECHAZADO">Rechazado</option>
                      </select>
                    </label>
                  </div>

                  <article className="productivo-card">
                    <div className="users-admin-card__title">
                      <h2>Historial de produccion de leche</h2>
                      <small>{leches.length} registros</small>
                    </div>
                    {loadingLeche ? <p className="productivo-helper">Cargando registros...</p> : (
                      <div className="productivo-table-wrap">
                        <table className="productivo-table">
                          <thead>
                            <tr><th>Arete</th><th>Litros</th><th>Fecha</th><th>Registrado por</th><th>Estado</th><th>Acciones</th></tr>
                          </thead>
                          <tbody>
                            {leches.length === 0 ? (
                              <tr><td colSpan={6} className="productivo-table-empty">No hay registros para mostrar.</td></tr>
                            ) : leches.map((record) => (
                              <tr key={record.idProduccion}>
                                <td className="productivo-table-id">{record.animal?.numeroArete || 'N/A'}</td>
                                <td className="productivo-table-value">{toNumeric(record.litrosProducidos)} <small>L</small></td>
                                <td>{toInputDate(record.fechaRegistro)}</td>
                                <td>{record.registrador?.nombreCompleto || 'N/A'}</td>
                                <td><span className={`productivo-status ${getEstadoClass(record.estadoValidacion)}`}>{record.estadoValidacion}</span></td>
                                <td>
                                  {record.estadoValidacion === 'PENDIENTE' ? (
                                    <div className="productivo-table-actions">
                                      {canEdit ? (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingLecheId(record.idProduccion);
                                            setLecheForm({
                                              idAnimal: String(record.idAnimal),
                                              litrosProducidos: String(toNumeric(record.litrosProducidos)),
                                              fechaRegistro: toInputDate(record.fechaRegistro),
                                            });
                                          }}
                                        >
                                          Editar
                                        </Button>
                                      ) : null}
                                      {canValidar ? <Button type="button" className="users-btn-success" onClick={() => void onValidarLeche(record.idProduccion, 'APROBADO')}>Aprobar</Button> : null}
                                      {canValidar ? <Button type="button" className="users-btn-danger" onClick={() => void onValidarLeche(record.idProduccion, 'RECHAZADO')}>Rechazar</Button> : null}
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

              {activeTab === 'reproductivo' && canRepro ? (
                <div className="productivo-tab-content">
                  {canCreateRepro ? (
                    <article className="productivo-card">
                      <div className="users-admin-card__title">
                        <h2>{editingEventoId ? 'Editar evento reproductivo' : 'Nuevo evento reproductivo'}</h2>
                        {editingEventoId ? <Button type="button" variant="ghost" onClick={resetEventoForm}>Cancelar</Button> : null}
                      </div>
                      <p className="productivo-subtitle">Registra eventos: celo, monta, preñez, parto o aborto.</p>
                      <div className="productivo-field-row">
                        <label className="productivo-field">
                          <span>Animal</span>
                          <select
                            value={eventoForm.idAnimal}
                            onChange={(event) => setEventoForm((prev) => ({ ...prev, idAnimal: event.target.value }))}
                            disabled={!!editingEventoId}
                            data-testid="evento-animal"
                          >
                            <option value="">Selecciona una hembra</option>
                            {hembras.map((animal) => (
                              <option key={animal.idAnimal} value={animal.idAnimal}>
                                {animal.numeroArete} - {animal.nombreRaza}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="productivo-field">
                          <span>Tipo de evento</span>
                          <select
                            value={eventoForm.tipoEvento}
                            onChange={(event) => setEventoForm((prev) => ({ ...prev, tipoEvento: event.target.value }))}
                            data-testid="evento-tipo"
                          >
                            <option value="">Selecciona el tipo</option>
                            {TIPOS_EVENTO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="productivo-field-row">
                        <label className="productivo-field">
                          <span>Fecha del evento</span>
                          <input
                            type="date"
                            value={eventoForm.fechaEvento}
                            onChange={(event) => setEventoForm((prev) => ({ ...prev, fechaEvento: event.target.value }))}
                            data-testid="evento-fecha"
                          />
                        </label>
                      </div>
                      <label className="productivo-field">
                        <span>Observaciones</span>
                        <textarea
                          rows={3}
                          maxLength={1000}
                          placeholder="Notas adicionales (opcional)"
                          value={eventoForm.observaciones}
                          onChange={(event) => setEventoForm((prev) => ({ ...prev, observaciones: event.target.value }))}
                          data-testid="evento-obs"
                        />
                      </label>
                      <Button type="button" onClick={onSaveEvento} disabled={savingEvento} data-testid="btn-guardar-evento">
                        {savingEvento ? 'Guardando...' : editingEventoId ? 'Guardar cambios' : 'Registrar evento'}
                      </Button>
                    </article>
                  ) : null}

                  <div className="productivo-filters productivo-filters--3">
                    <label className="productivo-field">
                      <span>Animal</span>
                      <select value={eventoFilter.idAnimal} onChange={(event) => setEventoFilter((prev) => ({ ...prev, idAnimal: event.target.value }))}>
                        <option value="">Todos</option>
                        {animales.map((animal) => <option key={animal.idAnimal} value={animal.idAnimal}>{animal.numeroArete}</option>)}
                      </select>
                    </label>
                    <label className="productivo-field">
                      <span>Tipo</span>
                      <select value={eventoFilter.tipo} onChange={(event) => setEventoFilter((prev) => ({ ...prev, tipo: event.target.value as TipoEventoReproductivo | 'TODOS' }))}>
                        <option value="TODOS">Todos</option>
                        {TIPOS_EVENTO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                      </select>
                    </label>
                    <label className="productivo-field">
                      <span>Estado</span>
                      <select value={eventoFilter.estado} onChange={(event) => setEventoFilter((prev) => ({ ...prev, estado: event.target.value as EstadoRegistro | 'TODOS' }))}>
                        <option value="TODOS">Todos</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="APROBADO">Aprobado</option>
                        <option value="RECHAZADO">Rechazado</option>
                      </select>
                    </label>
                  </div>

                  <article className="productivo-card">
                    <div className="users-admin-card__title">
                      <h2>Historial de eventos reproductivos</h2>
                      <small>{eventos.length} registros</small>
                    </div>
                    {loadingEventos ? <p className="productivo-helper">Cargando eventos...</p> : (
                      <div className="productivo-table-wrap">
                        <table className="productivo-table">
                          <thead>
                            <tr><th>Arete</th><th>Tipo</th><th>Fecha</th><th>Observaciones</th><th>Registrado por</th><th>Estado</th><th>Acciones</th></tr>
                          </thead>
                          <tbody>
                            {eventos.length === 0 ? (
                              <tr><td colSpan={7} className="productivo-table-empty">No hay registros para mostrar.</td></tr>
                            ) : eventos.map((record) => (
                              <tr key={record.idEventoReproductivo}>
                                <td className="productivo-table-id">{record.animal?.numeroArete || 'N/A'}</td>
                                <td><span className={`productivo-tipo ${getTipoEventoClass(record.tipoEvento)}`}>{record.tipoEvento}</span></td>
                                <td>{toInputDate(record.fechaEvento)}</td>
                                <td className="productivo-table-obs">{record.observaciones || '-'}</td>
                                <td>{record.registrador?.nombreCompleto || 'N/A'}</td>
                                <td><span className={`productivo-status ${getEstadoClass(record.estadoValidacion)}`}>{record.estadoValidacion}</span></td>
                                <td>
                                  {record.estadoValidacion === 'PENDIENTE' ? (
                                    <div className="productivo-table-actions">
                                      {canEdit ? (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingEventoId(record.idEventoReproductivo);
                                            setEventoForm({
                                              idAnimal: String(record.idAnimal),
                                              tipoEvento: record.tipoEvento,
                                              fechaEvento: toInputDate(record.fechaEvento),
                                              observaciones: record.observaciones || '',
                                            });
                                          }}
                                        >
                                          Editar
                                        </Button>
                                      ) : null}
                                      {canValidar ? <Button type="button" className="users-btn-success" onClick={() => void onValidarEvento(record.idEventoReproductivo, 'APROBADO')}>Aprobar</Button> : null}
                                      {canValidar ? <Button type="button" className="users-btn-danger" onClick={() => void onValidarEvento(record.idEventoReproductivo, 'RECHAZADO')}>Rechazar</Button> : null}
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
