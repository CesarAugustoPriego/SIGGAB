import { ApiClientError } from '../../types/api';
import { getApiErrorMessage } from '../../shared/errors/api-error-messages';
import type { Animal, EstadoAnimal, ProcedenciaAnimal, SexoAnimal } from './ganado-types';

// ── Constantes SINIIGA Tabasco ─────────────────────────────────────────
export const ARETE_PREFIX = '27';
export const ARETE_LENGTH = 10;
export const ARETE_REGEX = /^27\d{8}$/;

/** Valida que el arete tenga el formato SINIIGA Tabasco: 27XXXXXXXX (10 dígitos) */
export function isValidAreteFormat(value: string) {
  return ARETE_REGEX.test(value.trim());
}

/** Formatea 2712345678 → "27 1234 5678" para lectura legible */
export function formatAreteDisplay(arete: string) {
  const clean = arete.trim();
  if (clean.length !== 10) return clean;
  return `${clean.slice(0, 2)} ${clean.slice(2, 6)} ${clean.slice(6)}`;
}

type GanadoFieldErrorKey =
  | 'numeroArete'
  | 'fechaIngreso'
  | 'pesoInicial'
  | 'idRaza'
  | 'sexo'
  | 'procedencia'
  | 'edadEstimada'
  | 'estadoSanitarioInicial'
  | 'motivoBaja'
  | 'fechaBaja';

interface ValidationIssue {
  campo?: string;
  mensaje?: string;
}

function normalizeText(value: string | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function asValidationIssues(payloadErrors: unknown): ValidationIssue[] {
  if (!Array.isArray(payloadErrors)) return [];
  return payloadErrors
    .filter((issue) => issue && typeof issue === 'object')
    .map((issue) => ({
      campo: String((issue as { campo?: unknown }).campo || ''),
      mensaje: String((issue as { mensaje?: unknown }).mensaje || ''),
    }))
    .filter((issue) => issue.mensaje);
}

function toFieldKey(campo: string): GanadoFieldErrorKey | null {
  if (campo === 'numeroArete') return 'numeroArete';
  if (campo === 'fechaIngreso') return 'fechaIngreso';
  if (campo === 'pesoInicial') return 'pesoInicial';
  if (campo === 'idRaza') return 'idRaza';
  if (campo === 'sexo') return 'sexo';
  if (campo === 'procedencia') return 'procedencia';
  if (campo === 'edadEstimada') return 'edadEstimada';
  if (campo === 'estadoSanitarioInicial') return 'estadoSanitarioInicial';
  if (campo === 'motivoBaja') return 'motivoBaja';
  if (campo === 'fechaBaja') return 'fechaBaja';
  return null;
}

function hasRole(roleName: string | undefined, allowed: string[]) {
  const normalized = normalizeText(roleName);
  return allowed.includes(normalized);
}

export function canViewGanado(roleName: string | undefined) {
  return hasRole(roleName, [
    'propietario',
    'administrador',
    'medico veterinario',
    'veterinario',
    'produccion',
    'campo',
  ]);
}

export function canCreateAnimal(roleName: string | undefined) {
  return hasRole(roleName, [
    'administrador',
    'medico veterinario',
    'veterinario',
    'produccion',
    'campo',
  ]);
}

export function canEditAnimal(roleName: string | undefined) {
  return hasRole(roleName, ['administrador']);
}

export function canBajaAnimal(roleName: string | undefined) {
  return hasRole(roleName, ['administrador']);
}

export function canViewAnimalHistorial(roleName: string | undefined) {
  return canViewGanado(roleName);
}

export function getGanadoFieldErrors(error: unknown) {
  const fieldErrors: Partial<Record<GanadoFieldErrorKey, string>> = {};

  if (!(error instanceof ApiClientError)) {
    return fieldErrors;
  }

  const issues = asValidationIssues(error.payload?.errors);
  for (const issue of issues) {
    const key = toFieldKey(issue.campo || '');
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.mensaje || 'Valor invalido.';
    }
  }

  return fieldErrors;
}

export function getGanadoErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const issues = asValidationIssues(error.payload?.errors);

    if (error.status === 400 && issues.length > 0) {
      return issues[0].mensaje || 'Datos invalidos en el formulario de ganado.';
    }
  }
  return getApiErrorMessage(error, {
    badRequest: 'Datos invalidos en el formulario de ganado.',
    forbidden: 'No tienes permisos para esta accion en ganado.',
    notFound: 'No se encontro el animal solicitado.',
    conflict: 'El numero de arete ya existe.',
  });
}

export function formatEstadoAnimal(estado: EstadoAnimal) {
  if (estado === 'ACTIVO') return 'ACTIVO';
  if (estado === 'VENDIDO') return 'VENDIDO';
  if (estado === 'MUERTO') return 'MUERTO';
  if (estado === 'TRANSFERIDO') return 'TRANSFERIDO';
  return estado;
}

export function formatSexoAnimal(sexo: SexoAnimal) {
  return sexo === 'HEMBRA' ? 'Hembra' : 'Macho';
}

export function formatProcedenciaAnimal(procedencia: ProcedenciaAnimal) {
  return procedencia === 'NACIDA' ? 'Nacida en rancho' : 'Adquirida';
}

export function toInputDate(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

export function toNumeric(value: number | string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function getCardTestId(numeroArete: string) {
  return `card-${numeroArete}`;
}

export function findAnimalByArete(animals: Animal[], arete: string) {
  return animals.find((animal) => animal.numeroArete === arete) || null;
}

// ── Shared form state interfaces (aligned with mobile) ────────────────

export interface AnimalFormState {
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

export interface AnimalFormErrors {
  numeroArete?: string;
  fechaIngreso?: string;
  pesoInicial?: string;
  idRaza?: string;
  sexo?: string;
  procedencia?: string;
  edadEstimada?: string;
  estadoSanitarioInicial?: string;
}

export interface BajaFormState {
  estadoActual: Exclude<EstadoAnimal, 'ACTIVO'>;
  motivoBaja: string;
  fechaBaja: string;
}

export interface BajaFormErrors {
  motivoBaja?: string;
  fechaBaja?: string;
}

export const EMPTY_ANIMAL_FORM: AnimalFormState = {
  numeroArete: '',
  fechaIngreso: '',
  pesoInicial: '',
  idRaza: '',
  sexo: 'HEMBRA',
  procedencia: 'ADQUIRIDA',
  edadEstimada: '',
  estadoSanitarioInicial: '',
  fotoBase64: '',
  fotoPreviewUrl: '',
  eliminarFoto: false,
};

export const DEFAULT_BAJA_FORM: BajaFormState = {
  estadoActual: 'VENDIDO',
  motivoBaja: '',
  fechaBaja: new Date().toISOString().slice(0, 10),
};

export function validateAnimalForm(form: AnimalFormState): AnimalFormErrors {
  const errors: AnimalFormErrors = {};

  if (!form.numeroArete.trim()) {
    errors.numeroArete = 'El numero de arete es obligatorio.';
  } else if (!isValidAreteFormat(form.numeroArete)) {
    errors.numeroArete = 'El arete SINIIGA debe ser 10 digitos comenzando con 27.';
  }
  if (!form.fechaIngreso || !/^\d{4}-\d{2}-\d{2}$/.test(form.fechaIngreso)) {
    errors.fechaIngreso = 'Fecha invalida (YYYY-MM-DD).';
  }
  if (!form.pesoInicial.trim() || Number(form.pesoInicial) <= 0) {
    errors.pesoInicial = 'El peso debe ser mayor a 0.';
  }
  if (!form.idRaza || Number(form.idRaza) <= 0) {
    errors.idRaza = 'Selecciona una raza valida.';
  }
  if (!form.sexo) errors.sexo = 'Selecciona el sexo del animal.';
  if (!form.procedencia) errors.procedencia = 'La procedencia es obligatoria.';
  if (!form.edadEstimada.trim() || !Number.isInteger(Number(form.edadEstimada)) || Number(form.edadEstimada) < 0) {
    errors.edadEstimada = 'Edad en meses: entero >= 0.';
  }
  if (!form.estadoSanitarioInicial.trim()) {
    errors.estadoSanitarioInicial = 'El estado sanitario inicial es obligatorio.';
  }

  return errors;
}

export function validateAnimalUpdateForm(form: AnimalFormState): AnimalFormErrors {
  const errors: AnimalFormErrors = {};

  if (!form.fechaIngreso || !/^\d{4}-\d{2}-\d{2}$/.test(form.fechaIngreso)) {
    errors.fechaIngreso = 'Fecha invalida (YYYY-MM-DD).';
  }
  if (!form.pesoInicial.trim() || Number(form.pesoInicial) <= 0) {
    errors.pesoInicial = 'El peso debe ser mayor a 0.';
  }
  if (!form.idRaza || Number(form.idRaza) <= 0) {
    errors.idRaza = 'Selecciona una raza valida.';
  }
  if (!form.sexo) errors.sexo = 'Selecciona el sexo del animal.';
  if (!form.procedencia) errors.procedencia = 'La procedencia es obligatoria.';
  if (!form.edadEstimada.trim() || !Number.isInteger(Number(form.edadEstimada)) || Number(form.edadEstimada) < 0) {
    errors.edadEstimada = 'Edad en meses: entero >= 0.';
  }
  if (!form.estadoSanitarioInicial.trim()) {
    errors.estadoSanitarioInicial = 'El estado sanitario inicial es obligatorio.';
  }

  return errors;
}

export function validateBajaForm(form: BajaFormState): BajaFormErrors {
  const errors: BajaFormErrors = {};

  if (!form.motivoBaja.trim() || form.motivoBaja.trim().length < 5) {
    errors.motivoBaja = 'Minimo 5 caracteres.';
  }
  if (!form.fechaBaja || !/^\d{4}-\d{2}-\d{2}$/.test(form.fechaBaja)) {
    errors.fechaBaja = 'Fecha invalida (YYYY-MM-DD).';
  }

  return errors;
}

export function toAnimalFormState(animal: Animal): AnimalFormState {
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

export function mapServerFieldErrors(error: unknown) {
  if (!(error instanceof ApiClientError)) return {} as AnimalFormErrors;
  if (!Array.isArray(error.payload?.errors)) return {} as AnimalFormErrors;

  const map: AnimalFormErrors = {};

  for (const issue of error.payload.errors) {
    if (!issue || typeof issue !== 'object') continue;
    const campo = String((issue as { campo?: unknown }).campo || '');
    const mensaje = String((issue as { mensaje?: unknown }).mensaje || 'Valor invalido.');

    if (campo === 'numeroArete' && !map.numeroArete) map.numeroArete = mensaje;
    if (campo === 'fechaIngreso' && !map.fechaIngreso) map.fechaIngreso = mensaje;
    if (campo === 'pesoInicial' && !map.pesoInicial) map.pesoInicial = mensaje;
    if (campo === 'idRaza' && !map.idRaza) map.idRaza = mensaje;
    if (campo === 'sexo' && !map.sexo) map.sexo = mensaje;
    if (campo === 'procedencia' && !map.procedencia) map.procedencia = mensaje;
    if (campo === 'edadEstimada' && !map.edadEstimada) map.edadEstimada = mensaje;
    if (campo === 'estadoSanitarioInicial' && !map.estadoSanitarioInicial) map.estadoSanitarioInicial = mensaje;
  }

  return map;
}

export function filterAnimalesByArete(animales: Animal[], areteQuery: string) {
  const term = areteQuery.trim().toLowerCase();
  if (!term) return animales;
  return animales.filter((animal) => animal.numeroArete.toLowerCase().includes(term));
}
