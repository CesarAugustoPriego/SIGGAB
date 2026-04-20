import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useAuth } from '../../auth/auth-context';
import { getVisibleNavItemsForRole } from '../../auth/navigation-utils';
import { Button, NAV_ITEMS, LogOut, Pencil, Save, Plus, X, Search, FilterX, History, UserMinus, Check } from '../../../shared/ui';
import { ApiClientError } from '../../../types/api';
import { ganadoApi } from '../ganado-api';
import type {
  Animal,
  BajaAnimalInput,
  EstadoAnimal,
  HistorialAnimalResponse,
  ProcedenciaAnimal,
  Raza,
  SexoAnimal,
  UpdateAnimalInput,
} from '../ganado-types';
import {
  canBajaAnimal,
  canCreateAnimal,
  canEditAnimal,
  canViewAnimalHistorial,
  canViewGanado,
  findAnimalByArete,
  formatAreteDisplay,
  formatEstadoAnimal,
  formatProcedenciaAnimal,
  formatSexoAnimal,
  getGanadoErrorMessage,
  getGanadoFieldErrors,
  isValidAreteFormat,
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
  sexo: SexoAnimal;
  procedencia: ProcedenciaAnimal;
  edadEstimada: string;
  estadoSanitarioInicial: string;
  fotoBase64: string;
  fotoPreviewUrl: string;
  eliminarFoto: boolean;
}

interface AnimalFormErrors {
  numeroArete?: string;
  fechaIngreso?: string;
  pesoInicial?: string;
  idRaza?: string;
  sexo?: string;
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

const SEXO_OPTIONS: Array<{ value: SexoAnimal; label: string }> = [
  { value: 'HEMBRA', label: 'Hembra' },
  { value: 'MACHO', label: 'Macho' },
];

const PROCEDENCIA_OPTIONS: Array<{ value: ProcedenciaAnimal; label: string }> = [
  { value: 'ADQUIRIDA', label: 'Adquirida' },
  { value: 'NACIDA', label: 'Nacida en rancho' },
];

const DEFAULT_BAJA_FORM: BajaFormState = {
  estadoActual: 'VENDIDO',
  motivoBaja: '',
  fechaBaja: new Date().toISOString().slice(0, 10),
};

function buildEmptyForm(defaultRazaId = ''): AnimalFormState {
  return {
    numeroArete: '',
    fechaIngreso: new Date().toISOString().slice(0, 10),
    pesoInicial: '',
    idRaza: defaultRazaId,
    sexo: 'HEMBRA',
    procedencia: 'ADQUIRIDA',
    edadEstimada: '',
    estadoSanitarioInicial: '',
    fotoBase64: '',
    fotoPreviewUrl: '',
    eliminarFoto: false,
  };
}

function getEstadoClass(estadoActual: EstadoAnimal) {
  if (estadoActual === 'ACTIVO') return 'is-active';
  if (estadoActual === 'VENDIDO') return 'is-sold';
  if (estadoActual === 'MUERTO') return 'is-dead';
  return 'is-transferred';
}

function animalSummary(animal: Animal) {
  return `${animal.raza?.nombreRaza || 'Tabasquena'} · ${formatSexoAnimal(animal.sexo)} · ${toNumeric(animal.pesoInicial)} kg · ${animal.edadEstimada} meses`;
}

function validateAnimalForm(form: AnimalFormState): AnimalFormErrors {
  const errors: AnimalFormErrors = {};

  if (!form.numeroArete.trim()) {
    errors.numeroArete = 'El numero de arete es obligatorio.';
  } else if (!isValidAreteFormat(form.numeroArete)) {
    errors.numeroArete = 'El arete SINIIGA debe ser 10 digitos numericos comenzando con 27. Ej: 2712345678';
  }
  if (!form.fechaIngreso || !/^\d{4}-\d{2}-\d{2}$/.test(form.fechaIngreso)) errors.fechaIngreso = 'Fecha invalida (YYYY-MM-DD).';
  if (!form.pesoInicial.trim() || Number(form.pesoInicial) <= 0) errors.pesoInicial = 'El peso debe ser mayor a 0.';
  if (!form.idRaza || Number(form.idRaza) <= 0) errors.idRaza = 'Selecciona la raza disponible.';
  if (!form.sexo) errors.sexo = 'Selecciona si el animal es hembra o macho.';
  if (!form.procedencia) errors.procedencia = 'Selecciona la procedencia del animal.';
  if (!form.edadEstimada.trim() || !Number.isInteger(Number(form.edadEstimada)) || Number(form.edadEstimada) < 0) {
    errors.edadEstimada = 'La edad debe ser un entero mayor o igual a 0.';
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

function toFormState(animal: Animal): AnimalFormState {
  return {
    numeroArete: animal.numeroArete,
    fechaIngreso: toInputDate(animal.fechaIngreso),
    pesoInicial: String(toNumeric(animal.pesoInicial)),
    idRaza: String(animal.idRaza),
    sexo: animal.sexo,
    procedencia: animal.procedencia,
    edadEstimada: String(animal.edadEstimada),
    estadoSanitarioInicial: animal.estadoSanitarioInicial,
    fotoBase64: '',
    fotoPreviewUrl: animal.fotoUrl || '',
    eliminarFoto: false,
  };
}

function buildUpdatePayload(form: AnimalFormState, animal: Animal): UpdateAnimalInput | null {
  const payload: UpdateAnimalInput = {};

  if (form.fechaIngreso !== toInputDate(animal.fechaIngreso)) payload.fechaIngreso = form.fechaIngreso;
  if (Number(form.pesoInicial) !== toNumeric(animal.pesoInicial)) payload.pesoInicial = Number(form.pesoInicial);
  if (Number(form.idRaza) !== animal.idRaza) payload.idRaza = Number(form.idRaza);
  if (form.sexo !== animal.sexo) payload.sexo = form.sexo;
  if (form.procedencia !== animal.procedencia) payload.procedencia = form.procedencia;
  if (Number(form.edadEstimada) !== animal.edadEstimada) payload.edadEstimada = Number(form.edadEstimada);
  if (form.estadoSanitarioInicial.trim() !== animal.estadoSanitarioInicial) payload.estadoSanitarioInicial = form.estadoSanitarioInicial.trim();
  if (form.fotoBase64) payload.fotoBase64 = form.fotoBase64;
  if (form.eliminarFoto) payload.eliminarFoto = true;

  return Object.keys(payload).length > 0 ? payload : null;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No fue posible leer la foto seleccionada.'));
    reader.readAsDataURL(file);
  });
}

function AnimalPhoto({ animal, className }: { animal: Animal | null; className: string }) {
  if (animal?.fotoUrl) {
    return <img src={animal.fotoUrl} alt={`Ejemplar ${animal.numeroArete}`} className={className} />;
  }

  return (
    <div className={`${className} ganado-photo-placeholder`} aria-hidden="true">
      <span>{animal ? animal.numeroArete.slice(0, 2).toUpperCase() : 'SG'}</span>
    </div>
  );
}

function AreteBandera({ arete, compact = false }: { arete: string; compact?: boolean }) {
  const codigoEstado = arete.slice(0, 2);
  const matricula = arete.slice(2);
  const formattedMatricula = matricula.length === 8
    ? `${matricula.slice(0, 2)} ${matricula.slice(2, 4)} ${matricula.slice(4, 6)} ${matricula.slice(6)}`
    : matricula;

  if (compact) {
    return (
      <div className="arete-bandera arete-bandera--compact">
        <span className="arete-bandera__mx">MX</span>
        <span className="arete-bandera__estado">{codigoEstado}</span>
        <span className="arete-bandera__matricula">{formattedMatricula}</span>
      </div>
    );
  }

  return (
    <div className="arete-bandera">
      <div className="arete-bandera__header">
        <span className="arete-bandera__mx">MX</span>
        <span className="arete-bandera__sader">SADER</span>
      </div>
      <div className="arete-bandera__body">
        <span className="arete-bandera__estado">{codigoEstado}</span>
        <span className="arete-bandera__matricula">{formattedMatricula}</span>
      </div>
      <div className="arete-bandera__barcode" aria-hidden="true">
        {'▌▐▌▐▌▌▐▌▐▌▌▐▌▐▌▌▐▌'}
      </div>
    </div>
  );
}

function formatHistoryDate(value?: string | null) {
  const normalized = toInputDate(value);
  if (!normalized) return 'Sin fecha';
  const [year, month, day] = normalized.split('-');
  return `${day}/${month}/${year}`;
}

function describeSanitarioEvento(item: Record<string, unknown>) {
  const tipoEvento = item.tipoEvento as { nombreTipo?: string } | undefined;
  return `${tipoEvento?.nombreTipo || 'Evento sanitario'} · ${formatHistoryDate(String(item.fechaEvento || ''))}`;
}

function describeCalendarioEvento(item: Record<string, unknown>) {
  const tipoEvento = item.tipoEvento as { nombreTipo?: string } | undefined;
  return `${tipoEvento?.nombreTipo || 'Evento programado'} · ${formatHistoryDate(String(item.fechaProgramada || ''))}`;
}

function describePeso(item: Record<string, unknown>) {
  return `${toNumeric(String(item.peso || 0))} kg · ${formatHistoryDate(String(item.fechaRegistro || ''))}`;
}

function describeLeche(item: Record<string, unknown>) {
  return `${toNumeric(String(item.litrosProducidos || 0))} L · ${formatHistoryDate(String(item.fechaRegistro || ''))}`;
}

function describeReproductivo(item: Record<string, unknown>) {
  return `${String(item.tipoEvento || 'Evento')} · ${formatHistoryDate(String(item.fechaEvento || ''))}`;
}

function getNavTestId(moduleName: string) {
  if (moduleName === 'Productivo') return 'ganado-nav-produccion';
  return `ganado-nav-${moduleName.toLowerCase()}`;
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
  const [form, setForm] = useState<AnimalFormState>(buildEmptyForm());
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

  const editingAnimal = useMemo(() => (
    editingAnimalId ? animales.find((animal) => animal.idAnimal === editingAnimalId) || null : null
  ), [animales, editingAnimalId]);
  const defaultRazaId = useMemo(() => (razas[0] ? String(razas[0].idRaza) : ''), [razas]);

  const filteredAnimales = useMemo(() => {
    const term = filters.arete.trim().toLowerCase();
    if (!term) return animales;
    return animales.filter((animal) => animal.numeroArete.toLowerCase().includes(term));
  }, [animales, filters.arete]);

  const handleApiError = useCallback(async (error: unknown) => {
    setMessage({ type: 'error', text: getGanadoErrorMessage(error) });
    if (error instanceof ApiClientError && error.status === 401) await logout();
  }, [logout]);

  const loadRazas = useCallback(async () => {
    try {
      setRazas(await ganadoApi.getRazas());
    } catch (error) {
      await handleApiError(error);
    }
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
    if (!canView) {
      setLoadingInit(false);
      return;
    }

    void (async () => {
      try {
        setLoadingInit(true);
        await loadRazas();
      } finally {
        setLoadingInit(false);
      }
    })();
  }, [canView, loadRazas]);

  useEffect(() => {
    if (!canView) return;
    void loadAnimales();
  }, [canView, loadAnimales]);

  useEffect(() => {
    if (!defaultRazaId || editingAnimalId !== null) return;
    setForm((prev) => (prev.idRaza ? prev : { ...prev, idRaza: defaultRazaId }));
  }, [defaultRazaId, editingAnimalId]);

  const resetForm = useCallback(() => {
    setEditingAnimalId(null);
    setFormErrors({});
    setForm(buildEmptyForm(defaultRazaId));
  }, [defaultRazaId]);

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

  const onSelectEdit = (animal: Animal) => {
    setEditingAnimalId(animal.idAnimal);
    setFormErrors({});
    setMessage(null);
    setForm(toFormState(animal));
  };

  const onFieldChange = (field: keyof AnimalFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in formErrors) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const onPhotoSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((prev) => ({
        ...prev,
        fotoBase64: dataUrl,
        fotoPreviewUrl: dataUrl,
        eliminarFoto: false,
      }));
    } catch (error) {
      setMessage({ type: 'error', text: getGanadoErrorMessage(error) });
    } finally {
      event.target.value = '';
    }
  };

  const onRemovePhoto = () => {
    setForm((prev) => ({
      ...prev,
      fotoBase64: '',
      fotoPreviewUrl: '',
      eliminarFoto: Boolean(editingAnimal?.fotoUrl),
    }));
  };

  const onSave = async () => {
    const errors = validateAnimalForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editingAnimalId && !canEdit) {
      setMessage({ type: 'warn', text: 'Solo Administrador puede editar animales.' });
      return;
    }

    if (!editingAnimalId && !canCreate) {
      setMessage({ type: 'warn', text: 'Tu rol no puede registrar animales.' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      if (editingAnimalId) {
        const targetAnimal = editingAnimal || findAnimalByArete(animales, form.numeroArete);
        if (!targetAnimal) {
          setMessage({ type: 'error', text: 'No se encontro el animal para actualizar.' });
          return;
        }

        const payload = buildUpdatePayload(form, targetAnimal);
        if (!payload) {
          setMessage({ type: 'warn', text: 'No hay cambios por guardar.' });
          return;
        }

        await ganadoApi.updateAnimal(editingAnimalId, payload);
        setMessage({ type: 'success', text: 'Animal actualizado correctamente.' });
      } else {
        await ganadoApi.createAnimal({
          numeroArete: form.numeroArete.trim(),
          fechaIngreso: form.fechaIngreso,
          pesoInicial: Number(form.pesoInicial),
          idRaza: Number(form.idRaza),
          sexo: form.sexo,
          procedencia: form.procedencia,
          edadEstimada: Number(form.edadEstimada),
          estadoSanitarioInicial: form.estadoSanitarioInicial.trim(),
          fotoBase64: form.fotoBase64 || undefined,
        });
        setMessage({ type: 'success', text: 'Animal registrado correctamente.' });
      }

      resetForm();
      await loadAnimales();
    } catch (error) {
      setFormErrors((prev) => ({ ...prev, ...getGanadoFieldErrors(error) }));
      await handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const onSearch = async () => {
    if (!searchArete.trim()) {
      setSearchResult(null);
      setMessage({ type: 'warn', text: 'Escribe un numero de arete para buscar.' });
      return;
    }

    try {
      setSearching(true);
      setMessage(null);
      const animal = await ganadoApi.getAnimalByArete(searchArete.trim());
      setSearchResult(animal);
    } catch (error) {
      setSearchResult(null);
      await handleApiError(error);
    } finally {
      setSearching(false);
    }
  };

  const onOpenHistorial = async (animal: Animal) => {
    try {
      setHistorialModalOpen(true);
      setHistorialLoading(true);
      setHistorialError(null);
      setHistorialData(null);
      const data = await ganadoApi.getHistorialByArete(animal.numeroArete);
      setHistorialData(data);
    } catch (error) {
      setHistorialError(getGanadoErrorMessage(error));
      if (error instanceof ApiClientError && error.status === 401) await logout();
    } finally {
      setHistorialLoading(false);
    }
  };

  const onOpenBaja = (animal: Animal) => {
    setBajaTarget(animal);
    setBajaErrors({});
    setBajaForm({
      ...DEFAULT_BAJA_FORM,
      fechaBaja: new Date().toISOString().slice(0, 10),
    });
  };

  const onConfirmBaja = async () => {
    if (!bajaTarget) return;

    const errors = validateBajaForm(bajaForm);
    setBajaErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSubmittingBaja(true);
      setMessage(null);
      const payload: BajaAnimalInput = {
        estadoActual: bajaForm.estadoActual,
        motivoBaja: bajaForm.motivoBaja.trim(),
        fechaBaja: bajaForm.fechaBaja,
      };
      await ganadoApi.bajaAnimal(bajaTarget.idAnimal, payload);
      setMessage({ type: 'success', text: `Animal ${bajaTarget.numeroArete} dado de baja correctamente.` });
      setBajaTarget(null);
      await loadAnimales();
    } catch (error) {
      await handleApiError(error);
    } finally {
      setSubmittingBaja(false);
    }
  };

  const razasDisponibles = razas.length > 0 ? razas : [{ idRaza: 0, nombreRaza: 'Tabasquena' }];

  if (!canView) {
    return (
      <section className="users-admin-shell">
        <main className="users-admin-main">
          <header className="users-admin-main__header" data-testid="ganado-admin-header">
            <h1>Ganado</h1>
            <p>Registro y trazabilidad del hato</p>
          </header>
          <div className="users-admin-main__body">
            <article className="users-admin-empty">
              <h2>Acceso restringido</h2>
              <p>Tu rol no tiene permisos para consultar el modulo de ganado.</p>
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
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.label === 'Ganado';
            return (
              <button
                key={item.label}
                type="button"
                data-testid={getNavTestId(item.label)}
                className={`users-admin-sidebar__nav-item ${isActive ? 'is-active' : ''}`}
                onClick={isActive ? undefined : () => onNavigate(item.label)}
              >
                <Icon size={18} aria-hidden /> {item.label}
              </button>
            );
          })}
        </nav>

        <footer className="users-admin-sidebar__footer">
          <p>{user?.nombreCompleto || 'Usuario'}</p>
          <small>{user?.rol || 'Sin rol'}</small>
          <Button type="button" className="users-admin-sidebar__logout" onClick={logout}>
            <LogOut size={15} aria-hidden /> Cerrar sesion
          </Button>
        </footer>
      </aside>

      <main className="users-admin-main">
        <header className="users-admin-main__header" data-testid="ganado-admin-header">
          <h1>Ganado</h1>
          <p>Alta de ejemplares, foto individual y control operativo del hato.</p>
        </header>

        <div className="users-admin-main__body">
          {loadingInit ? (
            <article className="users-admin-empty">
              <h2>Cargando modulo de ganado...</h2>
              <p>Preparando catalogos y configuracion del registro.</p>
            </article>
          ) : (
            <div className="ganado-grid">
              <div className="ganado-column">
                <article className="ganado-card">
                  <div className="users-admin-card__title">
                    <h2>{editingAnimalId ? 'Editar ejemplar' : 'Registrar ejemplar'}</h2>
                    {editingAnimalId ? (
                      <Button type="button" variant="ghost" onClick={resetForm}>
                        <X size={15} aria-hidden /> Cancelar
                      </Button>
                    ) : null}
                  </div>

                  {!canCreate && !editingAnimalId ? (
                    <p className="ganado-helper-message">Tu rol puede consultar el hato, pero no registrar nuevos ejemplares.</p>
                  ) : (
                    <>
                      <label className="ganado-field">
                        <span>Numero de arete SINIIGA</span>
                        <input
                          type="text"
                          data-testid="input-arete"
                          value={form.numeroArete}
                          onChange={(event) => onFieldChange('numeroArete', event.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="2712345678"
                          maxLength={10}
                          disabled={editingAnimalId !== null}
                        />
                        <small className="ganado-field-hint">Formato SINIIGA Tabasco: 27 + 8 digitos (ej: 2712345678)</small>
                        {formErrors.numeroArete ? <small>{formErrors.numeroArete}</small> : null}
                      </label>

                      <div className="ganado-field-row">
                        <label className="ganado-field">
                          <span>Fecha de ingreso</span>
                          <input
                            type="date"
                            data-testid="input-fecha"
                            value={form.fechaIngreso}
                            onChange={(event) => onFieldChange('fechaIngreso', event.target.value)}
                          />
                          {formErrors.fechaIngreso ? <small>{formErrors.fechaIngreso}</small> : null}
                        </label>

                        <label className="ganado-field">
                          <span>Peso inicial (kg)</span>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            data-testid="input-peso"
                            value={form.pesoInicial}
                            onChange={(event) => onFieldChange('pesoInicial', event.target.value)}
                            placeholder="350.0"
                          />
                          {formErrors.pesoInicial ? <small>{formErrors.pesoInicial}</small> : null}
                        </label>
                      </div>

                      <div className="ganado-field-row">
                        <label className="ganado-field">
                          <span>Edad estimada (meses)</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            data-testid="input-edad"
                            value={form.edadEstimada}
                            onChange={(event) => onFieldChange('edadEstimada', event.target.value)}
                            placeholder="24"
                          />
                          {formErrors.edadEstimada ? <small>{formErrors.edadEstimada}</small> : null}
                        </label>

                        <label className="ganado-field">
                          <span>Raza</span>
                          <select
                            data-testid="select-raza"
                            value={form.idRaza}
                            onChange={(event) => onFieldChange('idRaza', event.target.value)}
                          >
                            <option value="">Selecciona la raza</option>
                            {razasDisponibles.map((raza) => (
                              <option key={raza.idRaza || raza.nombreRaza} value={raza.idRaza || ''}>
                                {raza.nombreRaza}
                              </option>
                            ))}
                          </select>
                          {formErrors.idRaza ? <small>{formErrors.idRaza}</small> : null}
                        </label>
                      </div>

                      <div className="ganado-field-row">
                        <label className="ganado-field">
                          <span>Sexo</span>
                          <select
                            data-testid="select-sexo"
                            value={form.sexo}
                            onChange={(event) => onFieldChange('sexo', event.target.value as SexoAnimal)}
                          >
                            {SEXO_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          {formErrors.sexo ? <small>{formErrors.sexo}</small> : null}
                        </label>

                        <label className="ganado-field">
                          <span>Procedencia</span>
                          <select
                            data-testid="input-procedencia"
                            value={form.procedencia}
                            onChange={(event) => onFieldChange('procedencia', event.target.value as ProcedenciaAnimal)}
                          >
                            {PROCEDENCIA_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          {formErrors.procedencia ? <small>{formErrors.procedencia}</small> : null}
                        </label>
                      </div>

                      <label className="ganado-field">
                        <span>Estado sanitario inicial</span>
                        <textarea
                          rows={3}
                          data-testid="input-sanitario"
                          value={form.estadoSanitarioInicial}
                          onChange={(event) => onFieldChange('estadoSanitarioInicial', event.target.value)}
                          placeholder="Describe el estado general al ingreso"
                        />
                        {formErrors.estadoSanitarioInicial ? <small>{formErrors.estadoSanitarioInicial}</small> : null}
                      </label>

                      <div className="ganado-photo-field">
                        <div className="ganado-photo-field__preview">
                          {form.fotoPreviewUrl ? (
                            <img src={form.fotoPreviewUrl} alt="Vista previa del ejemplar" className="ganado-photo-preview" />
                          ) : (
                            <div className="ganado-photo-preview ganado-photo-placeholder" aria-hidden="true">
                              <span>{form.numeroArete.trim() ? form.numeroArete.trim().slice(0, 2).toUpperCase() : 'SG'}</span>
                            </div>
                          )}
                        </div>

                        <div className="ganado-photo-field__controls">
                          <label className="ganado-field">
                            <span>Foto del ejemplar</span>
                            <input type="file" accept="image/png,image/jpeg,image/webp" data-testid="input-foto" onChange={(event) => void onPhotoSelected(event)} />
                          </label>
                          <div className="ganado-search-result__actions">
                            <Button type="button" variant="ghost" onClick={onRemovePhoto} disabled={!form.fotoPreviewUrl}>
                              <X size={15} aria-hidden /> Quitar foto
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button type="button" fullWidth disabled={saving} onClick={onSave} data-testid="btn-submit">
                        {saving
                          ? 'Guardando...'
                          : editingAnimalId
                            ? <><Save size={15} aria-hidden /> Guardar cambios</>
                            : <><Plus size={15} aria-hidden /> Guardar ejemplar</>}
                      </Button>
                    </>
                  )}

                  {message ? (
                    <p className={`users-message users-message--${message.type}`} data-testid="ganado-form-message">
                      {message.text}
                    </p>
                  ) : null}
                </article>

                <article className="ganado-card">
                  <div className="users-admin-card__title">
                    <h2>Busqueda por arete</h2>
                    <small>Consulta puntual</small>
                  </div>

                  <label className="ganado-search">
                    <span>Numero de arete</span>
                    <div className="ganado-search__controls">
                      <input
                        type="text"
                        data-testid="input-buscar-arete"
                        value={searchArete}
                        onChange={(event) => setSearchArete(event.target.value)}
                        placeholder="Busca un arete exacto"
                      />
                      <Button type="button" onClick={onSearch} disabled={searching} data-testid="btn-buscar">
                        <Search size={15} aria-hidden /> {searching ? 'Buscando...' : 'Buscar'}
                      </Button>
                    </div>
                  </label>

                  {searchResult ? (
                    <div className="ganado-search-result">
                      <div className="ganado-search-result__summary">
                        <AnimalPhoto animal={searchResult} className="ganado-search-result__photo" />
                        <div>
                          <AreteBandera arete={searchResult.numeroArete} compact />
                          <strong>{formatAreteDisplay(searchResult.numeroArete)}</strong>
                          <p>{animalSummary(searchResult)}</p>
                          <p>{formatProcedenciaAnimal(searchResult.procedencia)} · Estado {formatEstadoAnimal(searchResult.estadoActual)}</p>
                        </div>
                      </div>
                      <div className="ganado-search-result__actions">
                        {canHistorial ? (
                          <Button type="button" variant="ghost" onClick={() => void onOpenHistorial(searchResult)}>
                            <History size={14} aria-hidden /> Ver historial
                          </Button>
                        ) : null}
                        {canEdit && searchResult.estadoActual === 'ACTIVO' ? (
                          <Button type="button" variant="ghost" onClick={() => onSelectEdit(searchResult)}>
                            <Pencil size={14} aria-hidden /> Editar
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </article>
              </div>

              <div className="ganado-column">
                <article className="ganado-card">
                  <div className="users-admin-card__title">
                    <h2>Hato registrado</h2>
                    <small>{filteredAnimales.length} ejemplares visibles</small>
                  </div>
                  <div className="ganado-filters">
                    <label className="ganado-field">
                      <span>Estado</span>
                      <select
                        data-testid="filter-estado"
                        value={filters.estadoActual}
                        onChange={(event) => setFilters((prev) => ({ ...prev, estadoActual: event.target.value as EstadoAnimal | 'TODOS' }))}
                      >
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="TODOS">TODOS</option>
                        <option value="VENDIDO">VENDIDO</option>
                        <option value="MUERTO">MUERTO</option>
                        <option value="TRANSFERIDO">TRANSFERIDO</option>
                      </select>
                    </label>

                    <label className="ganado-field">
                      <span>Raza</span>
                      <select
                        data-testid="filter-raza"
                        value={filters.idRaza}
                        onChange={(event) => setFilters((prev) => ({ ...prev, idRaza: event.target.value }))}
                      >
                        <option value="">Todas</option>
                        {razas.map((raza) => (
                          <option key={raza.idRaza} value={raza.idRaza}>{raza.nombreRaza}</option>
                        ))}
                      </select>
                    </label>

                    <label className="ganado-field">
                      <span>Filtrar por arete</span>
                      <input
                        type="text"
                        data-testid="filter-arete"
                        value={filters.arete}
                        onChange={(event) => setFilters((prev) => ({ ...prev, arete: event.target.value }))}
                        placeholder="Coincidencia parcial"
                      />
                    </label>

                    <div className="ganado-field">
                      <span>Acciones</span>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setFilters({ estadoActual: 'ACTIVO', idRaza: '', arete: '' })}
                        data-testid="btn-limpiar-filtros"
                      >
                        <FilterX size={15} aria-hidden /> Limpiar filtros
                      </Button>
                    </div>
                  </div>

                  <div className="ganado-list">
                    {loadingList ? (
                      <p className="ganado-helper-message">Cargando animales registrados...</p>
                    ) : filteredAnimales.length === 0 ? (
                      <p className="ganado-helper-message">No hay animales para los filtros seleccionados.</p>
                    ) : filteredAnimales.map((animal) => (
                      <article key={animal.idAnimal} className="ganado-item" data-testid={`card-${animal.numeroArete}`}>
                        <div className="ganado-item__layout">
                          <AnimalPhoto animal={animal} className="ganado-item__photo" />
                          <div className="ganado-item__body">
                            <div className="ganado-item__head">
                              <strong>{formatAreteDisplay(animal.numeroArete)}</strong>
                              <span className={`ganado-status ${getEstadoClass(animal.estadoActual)}`}>
                                {formatEstadoAnimal(animal.estadoActual)}
                              </span>
                            </div>
                            <p>{animalSummary(animal)}</p>
                            <p>{formatProcedenciaAnimal(animal.procedencia)} · Sanitario inicial: {animal.estadoSanitarioInicial}</p>
                          </div>
                        </div>

                        <div className="ganado-item__actions">
                          {canEdit && animal.estadoActual === 'ACTIVO' ? (
                            <Button
                              type="button"
                              variant="ghost"
                              data-testid={`btn-editar-${animal.numeroArete}`}
                              onClick={() => onSelectEdit(animal)}
                            >
                              <Pencil size={14} aria-hidden /> Editar
                            </Button>
                          ) : null}

                          {canBaja && animal.estadoActual === 'ACTIVO' ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="users-btn-danger"
                              data-testid={`btn-baja-${animal.numeroArete}`}
                              onClick={() => onOpenBaja(animal)}
                            >
                              <UserMinus size={14} aria-hidden /> Dar de baja
                            </Button>
                          ) : null}

                          {canHistorial ? (
                            <Button
                              type="button"
                              variant="ghost"
                              data-testid={`btn-historial-${animal.numeroArete}`}
                              onClick={() => void onOpenHistorial(animal)}
                            >
                              <History size={14} aria-hidden /> Historial
                            </Button>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          )}
        </div>
      </main>

      {bajaTarget ? (
        <div className="ganado-modal-backdrop" role="presentation">
          <div className="ganado-modal" role="dialog" aria-modal="true" aria-labelledby="ganado-baja-title">
            <header>
              <h3 id="ganado-baja-title">Dar de baja a {bajaTarget.numeroArete}</h3>
            </header>

            <label className="ganado-field">
              <span>Estado de salida</span>
              <select
                data-testid="select-motivo"
                value={bajaForm.estadoActual}
                onChange={(event) => setBajaForm((prev) => ({ ...prev, estadoActual: event.target.value as BajaFormState['estadoActual'] }))}
              >
                <option value="VENDIDO">VENDIDO</option>
                <option value="MUERTO">MUERTO</option>
                <option value="TRANSFERIDO">TRANSFERIDO</option>
              </select>
            </label>

            <label className="ganado-field">
              <span>Motivo de baja</span>
              <textarea
                rows={3}
                data-testid="input-baja-motivo"
                value={bajaForm.motivoBaja}
                onChange={(event) => {
                  setBajaForm((prev) => ({ ...prev, motivoBaja: event.target.value }));
                  setBajaErrors((prev) => ({ ...prev, motivoBaja: undefined }));
                }}
              />
              {bajaErrors.motivoBaja ? <small>{bajaErrors.motivoBaja}</small> : null}
            </label>

            <label className="ganado-field">
              <span>Fecha de baja</span>
              <input
                type="date"
                data-testid="input-baja-fecha"
                value={bajaForm.fechaBaja}
                onChange={(event) => {
                  setBajaForm((prev) => ({ ...prev, fechaBaja: event.target.value }));
                  setBajaErrors((prev) => ({ ...prev, fechaBaja: undefined }));
                }}
              />
              {bajaErrors.fechaBaja ? <small>{bajaErrors.fechaBaja}</small> : null}
            </label>

            <div className="ganado-modal__actions">
              <Button type="button" variant="ghost" onClick={() => setBajaTarget(null)}>
                <X size={15} aria-hidden /> Cancelar
              </Button>
              <Button type="button" disabled={submittingBaja} onClick={() => void onConfirmBaja()} data-testid="btn-confirmar-baja">
                {submittingBaja ? 'Procesando...' : <><Check size={15} aria-hidden /> Confirmar baja</>}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {historialModalOpen ? (
        <div className="ganado-modal-backdrop" role="presentation">
          <div className="ganado-modal ganado-historial" role="dialog" aria-modal="true" aria-labelledby="ganado-historial-title">
            <header>
              <h3 id="ganado-historial-title">Historial por arete</h3>
            </header>

            {historialLoading ? (
              <p className="ganado-helper-message">Cargando historial...</p>
            ) : historialError ? (
              <p className="users-message users-message--error">{historialError}</p>
            ) : historialData ? (
              <>
                <div className="ganado-historial__hero">
                  <AnimalPhoto animal={historialData.animal} className="ganado-historial__photo" />
                  <div>
                    <AreteBandera arete={historialData.animal.numeroArete} compact />
                    <strong>{formatAreteDisplay(historialData.animal.numeroArete)}</strong>
                    <p>{animalSummary(historialData.animal)}</p>
                    <p>{formatProcedenciaAnimal(historialData.animal.procedencia)} · {formatEstadoAnimal(historialData.animal.estadoActual)}</p>
                  </div>
                </div>

                <div className="ganado-historial__summary">
                  <p>Eventos sanitarios: {historialData.historial.resumen.totalEventosSanitarios}</p>
                  <p>Pesajes: {historialData.historial.resumen.totalRegistrosPeso}</p>
                  <p>Registros de leche: {historialData.historial.resumen.totalRegistrosLeche}</p>
                  <p>Eventos reproductivos: {historialData.historial.resumen.totalEventosReproductivos}</p>
                </div>

                <div className="ganado-historial__sections">
                  <section>
                    <strong>Sanitario</strong>
                    <ul>
                      {historialData.historial.sanitario.eventos.length === 0 ? <li>Sin eventos sanitarios.</li> : historialData.historial.sanitario.eventos.slice(0, 5).map((item, index) => <li key={`se-${index}`}>{describeSanitarioEvento(item as Record<string, unknown>)}</li>)}
                    </ul>
                  </section>

                  <section>
                    <strong>Calendario</strong>
                    <ul>
                      {historialData.historial.sanitario.calendario.length === 0 ? <li>Sin calendario sanitario.</li> : historialData.historial.sanitario.calendario.slice(0, 5).map((item, index) => <li key={`ca-${index}`}>{describeCalendarioEvento(item as Record<string, unknown>)}</li>)}
                    </ul>
                  </section>

                  <section>
                    <strong>Peso</strong>
                    <ul>
                      {historialData.historial.productivo.registrosPeso.length === 0 ? <li>Sin registros de peso.</li> : historialData.historial.productivo.registrosPeso.slice(0, 5).map((item, index) => <li key={`pe-${index}`}>{describePeso(item as Record<string, unknown>)}</li>)}
                    </ul>
                  </section>

                  <section>
                    <strong>Leche</strong>
                    <ul>
                      {historialData.historial.productivo.produccionesLeche.length === 0 ? <li>Sin registros de leche.</li> : historialData.historial.productivo.produccionesLeche.slice(0, 5).map((item, index) => <li key={`le-${index}`}>{describeLeche(item as Record<string, unknown>)}</li>)}
                    </ul>
                  </section>

                  <section>
                    <strong>Reproductivo</strong>
                    <ul>
                      {historialData.historial.productivo.eventosReproductivos.length === 0 ? <li>Sin eventos reproductivos.</li> : historialData.historial.productivo.eventosReproductivos.slice(0, 5).map((item, index) => <li key={`re-${index}`}>{describeReproductivo(item as Record<string, unknown>)}</li>)}
                    </ul>
                  </section>
                </div>
              </>
            ) : null}

            <div className="ganado-modal__actions">
              <Button type="button" variant="ghost" onClick={() => setHistorialModalOpen(false)}>
                <X size={15} aria-hidden /> Cerrar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
