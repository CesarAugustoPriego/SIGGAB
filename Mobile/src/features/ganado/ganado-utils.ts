import { ApiClientError } from '@/src/types/api';

import type { Animal, EstadoAnimal } from './ganado-types';

export interface AnimalFormState {
  numeroArete: string;
  fechaIngreso: string;
  pesoInicial: string;
  idRaza: string;
  procedencia: string;
  edadEstimada: string;
  estadoSanitarioInicial: string;
}

export interface AnimalFormErrors {
  numeroArete?: string;
  fechaIngreso?: string;
  pesoInicial?: string;
  idRaza?: string;
  procedencia?: string;
  edadEstimada?: string;
  estadoSanitarioInicial?: string;
}

export const EMPTY_ANIMAL_FORM: AnimalFormState = {
  numeroArete: '',
  fechaIngreso: '',
  pesoInicial: '',
  idRaza: '',
  procedencia: '',
  edadEstimada: '',
  estadoSanitarioInicial: '',
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

  if (!form.numeroArete.trim()) errors.numeroArete = 'El numero de arete es obligatorio.';
  if (form.numeroArete.trim().length > 50) errors.numeroArete = 'Maximo 50 caracteres.';
  if (!form.fechaIngreso || !/^\d{4}-\d{2}-\d{2}$/.test(form.fechaIngreso)) {
    errors.fechaIngreso = 'Fecha invalida (YYYY-MM-DD).';
  }
  if (!form.pesoInicial.trim() || Number(form.pesoInicial) <= 0) {
    errors.pesoInicial = 'El peso debe ser mayor a 0.';
  }
  if (!form.idRaza || Number(form.idRaza) <= 0) {
    errors.idRaza = 'Selecciona una raza valida.';
  }
  if (!form.procedencia.trim()) errors.procedencia = 'La procedencia es obligatoria.';
  if (form.procedencia.trim().length > 100) errors.procedencia = 'Maximo 100 caracteres.';
  if (!form.edadEstimada.trim() || !Number.isInteger(Number(form.edadEstimada)) || Number(form.edadEstimada) < 0) {
    errors.edadEstimada = 'Edad en meses: entero >= 0.';
  }
  if (!form.estadoSanitarioInicial.trim()) {
    errors.estadoSanitarioInicial = 'El estado sanitario inicial es obligatorio.';
  }

  return errors;
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
