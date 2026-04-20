import { ApiClientError } from '@/src/types/api';

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

export function toNumeric(value: number | string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function toInputDate(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
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

export function getEstadoColor(estado: EstadoAnimal) {
  if (estado === 'ACTIVO') return '#1D8A42';
  if (estado === 'VENDIDO') return '#3B82F6';
  if (estado === 'MUERTO') return '#B42318';
  return '#7A5AF8';
}

export function getGanadoErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 0) return 'No fue posible conectar con el backend.';
    if (error.status === 400) return error.message || 'Datos invalidos en formulario de ganado.';
    if (error.status === 401) return 'Sesion expirada. Inicia sesion nuevamente.';
    if (error.status === 403) return 'Tu rol no tiene permisos para esta accion en ganado.';
    if (error.status === 404) return 'No se encontro el animal solicitado.';
    if (error.status === 409) return 'El numero de arete ya existe.';
    return error.message || 'Error inesperado en modulo ganado.';
  }

  return 'Ocurrio un error inesperado en modulo ganado.';
}

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
