import { ApiClientError } from '@/src/types/api';

import type {
  CalendarioSanitario,
  EstadoCalendario,
  EstadoRegistro,
  EventoSanitario,
  SanitarioCategoria,
  TipoEventoSanitario,
} from './sanitario-types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseDateInput(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed;
}

export interface EventoFormState {
  idTipoEvento: string;
  fechaEvento: string;
  campoPrincipal: string;
  campoSecundario: string;
  campoTerciario: string;
  fechaAlertaProgramacion: string;
}

export interface EventoFormErrors {
  idTipoEvento?: string;
  fechaEvento?: string;
  campoPrincipal?: string;
  campoSecundario?: string;
  campoTerciario?: string;
  fechaAlertaProgramacion?: string;
}

export interface ProgramacionFormState {
  idAnimal: string;
  idTipoEvento: string;
  fechaProgramada: string;
  fechaAlerta: string;
}

export interface ProgramacionFormErrors {
  idAnimal?: string;
  idTipoEvento?: string;
  fechaProgramada?: string;
  fechaAlerta?: string;
}

export interface CalendarCell {
  isoDate: string;
  day: number;
  inCurrentMonth: boolean;
}

export const EMPTY_EVENTO_FORM: EventoFormState = {
  idTipoEvento: '',
  fechaEvento: new Date().toISOString().slice(0, 10),
  campoPrincipal: '',
  campoSecundario: '',
  campoTerciario: '',
  fechaAlertaProgramacion: '',
};

export const EMPTY_PROGRAMACION_FORM: ProgramacionFormState = {
  idAnimal: '',
  idTipoEvento: '',
  fechaProgramada: new Date().toISOString().slice(0, 10),
  fechaAlerta: '',
};

export function toInputDate(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

export function formatDate(value: string | null | undefined) {
  const dateValue = toInputDate(value);
  if (!dateValue) return 'Sin fecha';

  const parsed = parseDateInput(dateValue);
  if (!parsed) return dateValue;

  return parsed.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatEstadoRegistro(estado: EstadoRegistro) {
  if (estado === 'PENDIENTE') return 'PENDIENTE';
  if (estado === 'APROBADO') return 'APROBADO';
  return 'RECHAZADO';
}

export function formatEstadoCalendario(estado: EstadoCalendario) {
  if (estado === 'PENDIENTE') return 'PENDIENTE';
  if (estado === 'COMPLETADO') return 'REALIZADO';
  return 'CANCELADO';
}

export function getEstadoRegistroColor(estado: EstadoRegistro) {
  if (estado === 'APROBADO') return '#17813A';
  if (estado === 'RECHAZADO') return '#B42318';
  return '#B54708';
}

export function getEstadoCalendarioColor(estado: EstadoCalendario) {
  if (estado === 'COMPLETADO') return '#17813A';
  if (estado === 'CANCELADO') return '#B42318';
  return '#B54708';
}

export function getSanitarioErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 0) return 'No fue posible conectar con el backend.';
    if (error.status === 400) return error.message || 'Datos invalidos en modulo sanitario.';
    if (error.status === 401) return 'Sesion expirada. Inicia sesion nuevamente.';
    if (error.status === 403) return 'Tu rol no tiene permisos para esta accion sanitaria.';
    if (error.status === 404) return 'No se encontro el registro sanitario solicitado.';
    return error.message || 'Error inesperado en modulo sanitario.';
  }

  return 'Ocurrio un error inesperado en modulo sanitario.';
}

export function resolveCategoriaFromTipoName(nombreTipo: string | undefined): SanitarioCategoria {
  const normalized = normalizeText(nombreTipo || '');
  if (normalized.includes('vacun')) return 'VACUNA';
  if (normalized.includes('trat')) return 'TRATAMIENTO';
  return 'PADECIMIENTO';
}

export function getCategoriaLabel(categoria: SanitarioCategoria) {
  if (categoria === 'VACUNA') return 'Vacuna';
  if (categoria === 'TRATAMIENTO') return 'Tratamiento';
  return 'Padecimiento';
}

export function getCategoriaFieldLabels(categoria: SanitarioCategoria) {
  if (categoria === 'VACUNA') {
    return {
      principal: 'Nombre de la vacuna',
      secundario: 'Lote / Fabricante',
      terciario: 'Observaciones',
      alerta: 'Generar alerta de revacunacion',
    };
  }

  if (categoria === 'TRATAMIENTO') {
    return {
      principal: 'Nombre del tratamiento / medicamento',
      secundario: 'Dosis y via de administracion',
      terciario: 'Periodo de retiro (dias)',
      alerta: 'Generar alerta de retiro',
    };
  }

  return {
    principal: 'Diagnostico / padecimiento',
    secundario: 'Observaciones',
    terciario: '',
    alerta: 'Generar alerta de revision',
  };
}

export function findTipoForCategoria(
  tipos: TipoEventoSanitario[],
  categoria: SanitarioCategoria
) {
  return tipos.find((tipo) => resolveCategoriaFromTipoName(tipo.nombreTipo) === categoria) || null;
}

export function validateEventoForm(
  form: EventoFormState,
  categoria: SanitarioCategoria
): EventoFormErrors {
  const errors: EventoFormErrors = {};

  if (!form.idTipoEvento || Number(form.idTipoEvento) <= 0) {
    errors.idTipoEvento = 'Selecciona un tipo de evento valido.';
  }

  if (!form.fechaEvento || !DATE_PATTERN.test(form.fechaEvento)) {
    errors.fechaEvento = 'Fecha invalida (YYYY-MM-DD).';
  }

  if (!form.campoPrincipal.trim()) {
    errors.campoPrincipal = 'Este campo es obligatorio.';
  }

  if (categoria === 'TRATAMIENTO' && !form.campoSecundario.trim()) {
    errors.campoSecundario = 'La dosis y via son obligatorias.';
  }

  if (categoria === 'TRATAMIENTO' && !form.campoTerciario.trim()) {
    errors.campoTerciario = 'El periodo de retiro es obligatorio.';
  }

  if (form.fechaAlertaProgramacion && !DATE_PATTERN.test(form.fechaAlertaProgramacion)) {
    errors.fechaAlertaProgramacion = 'Fecha invalida (YYYY-MM-DD).';
  }

  if (form.fechaAlertaProgramacion && DATE_PATTERN.test(form.fechaEvento)) {
    const fechaEvento = parseDateInput(form.fechaEvento);
    const fechaAlerta = parseDateInput(form.fechaAlertaProgramacion);
    if (fechaEvento && fechaAlerta && fechaAlerta < fechaEvento) {
      errors.fechaAlertaProgramacion = 'La fecha de alerta no puede ser menor que la fecha del evento.';
    }
  }

  return errors;
}

export function validateProgramacionForm(form: ProgramacionFormState): ProgramacionFormErrors {
  const errors: ProgramacionFormErrors = {};

  if (!form.idAnimal || Number(form.idAnimal) <= 0) {
    errors.idAnimal = 'Selecciona un animal valido.';
  }

  if (!form.idTipoEvento || Number(form.idTipoEvento) <= 0) {
    errors.idTipoEvento = 'Selecciona un tipo de evento valido.';
  }

  if (!form.fechaProgramada || !DATE_PATTERN.test(form.fechaProgramada)) {
    errors.fechaProgramada = 'Fecha invalida (YYYY-MM-DD).';
  }

  if (form.fechaAlerta && !DATE_PATTERN.test(form.fechaAlerta)) {
    errors.fechaAlerta = 'Fecha invalida (YYYY-MM-DD).';
  }

  if (form.fechaAlerta && form.fechaProgramada) {
    const fechaProgramada = parseDateInput(form.fechaProgramada);
    const fechaAlerta = parseDateInput(form.fechaAlerta);
    if (fechaAlerta && fechaProgramada && fechaAlerta >= fechaProgramada) {
      errors.fechaAlerta = 'La alerta debe ser previa a la fecha programada.';
    }
  }

  return errors;
}

export function toEventoPayload(form: EventoFormState) {
  const diagnostico = form.campoPrincipal.trim();
  const medicamento = form.campoSecundario.trim();
  const dosis = form.campoTerciario.trim();

  return {
    idTipoEvento: Number(form.idTipoEvento),
    fechaEvento: form.fechaEvento,
    diagnostico: diagnostico || undefined,
    medicamento: medicamento || undefined,
    dosis: dosis || undefined,
  };
}

export function toEventoFormState(evento: EventoSanitario): EventoFormState {
  return {
    idTipoEvento: String(evento.idTipoEvento),
    fechaEvento: toInputDate(evento.fechaEvento),
    campoPrincipal: evento.diagnostico || '',
    campoSecundario: evento.medicamento || '',
    campoTerciario: evento.dosis || '',
    fechaAlertaProgramacion: '',
  };
}

export function monthTitle(referenceDate: Date) {
  return referenceDate.toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });
}

export function buildMonthGrid(referenceDate: Date): CalendarCell[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - firstWeekday);

  const cells: CalendarCell[] = [];
  for (let index = 0; index < 42; index += 1) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + index);
    const isoDate = current.toISOString().slice(0, 10);
    cells.push({
      isoDate,
      day: current.getDate(),
      inCurrentMonth: current.getMonth() === month,
    });
  }

  return cells;
}

export function groupCalendarioByDate(items: CalendarioSanitario[]) {
  const map = new Map<string, CalendarioSanitario[]>();

  for (const item of items) {
    const dateKey = toInputDate(item.fechaProgramada);
    if (!map.has(dateKey)) {
      map.set(dateKey, []);
    }
    map.get(dateKey)?.push(item);
  }

  return map;
}

