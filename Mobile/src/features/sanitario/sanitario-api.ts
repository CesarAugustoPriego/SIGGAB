import { httpClient } from '@/src/lib/http-client';

import type {
  AprobarEventoInput,
  CalendarioSanitario,
  CalendarioSanitarioFilters,
  CompletarCalendarioInput,
  CreateCalendarioInput,
  CreateEventoSanitarioInput,
  EventoSanitario,
  EventoSanitarioFilters,
  TipoEventoSanitario,
  UpdateCalendarioInput,
  UpdateEventoSanitarioInput,
} from './sanitario-types';

function buildEventosQuery(filters: EventoSanitarioFilters = {}) {
  const params = new URLSearchParams();

  if (filters.idAnimal && filters.idAnimal > 0) {
    params.set('animal', String(filters.idAnimal));
  }

  if (filters.idTipoEvento && filters.idTipoEvento > 0) {
    params.set('tipo', String(filters.idTipoEvento));
  }

  if (filters.estado && filters.estado !== 'TODOS') {
    params.set('estado', filters.estado);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

function buildCalendarioQuery(filters: CalendarioSanitarioFilters = {}) {
  const params = new URLSearchParams();

  if (filters.idAnimal && filters.idAnimal > 0) {
    params.set('animal', String(filters.idAnimal));
  }

  if (filters.estado && filters.estado !== 'TODOS') {
    params.set('estado', filters.estado);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const sanitarioApi = {
  getTiposEvento: () => httpClient.get<TipoEventoSanitario[]>('/eventos-sanitarios/tipos'),

  getEventos: (filters: EventoSanitarioFilters = {}) => {
    const query = buildEventosQuery(filters);
    return httpClient.get<EventoSanitario[]>(`/eventos-sanitarios${query}`);
  },

  getEventoById: (idEvento: number) => httpClient.get<EventoSanitario>(`/eventos-sanitarios/${idEvento}`),

  createEvento: (payload: CreateEventoSanitarioInput) => (
    httpClient.post<EventoSanitario>('/eventos-sanitarios', payload)
  ),

  updateEvento: (idEvento: number, payload: UpdateEventoSanitarioInput) => (
    httpClient.patch<EventoSanitario>(`/eventos-sanitarios/${idEvento}`, payload)
  ),

  aprobarEvento: (idEvento: number, payload: AprobarEventoInput) => (
    httpClient.patch<EventoSanitario>(`/eventos-sanitarios/${idEvento}/aprobar`, payload)
  ),

  getCalendario: (filters: CalendarioSanitarioFilters = {}) => {
    const query = buildCalendarioQuery(filters);
    return httpClient.get<CalendarioSanitario[]>(`/calendario-sanitario${query}`);
  },

  getCalendarioById: (idCalendario: number) => (
    httpClient.get<CalendarioSanitario>(`/calendario-sanitario/${idCalendario}`)
  ),

  getAlertas: (dias = 7) => httpClient.get<CalendarioSanitario[]>(`/calendario-sanitario/alertas?dias=${dias}`),

  createCalendario: (payload: CreateCalendarioInput) => (
    httpClient.post<CalendarioSanitario>('/calendario-sanitario', payload)
  ),

  updateCalendario: (idCalendario: number, payload: UpdateCalendarioInput) => (
    httpClient.patch<CalendarioSanitario>(`/calendario-sanitario/${idCalendario}`, payload)
  ),

  completarCalendario: (idCalendario: number, payload: CompletarCalendarioInput) => (
    httpClient.patch<CalendarioSanitario>(`/calendario-sanitario/${idCalendario}/completar`, payload)
  ),
};

