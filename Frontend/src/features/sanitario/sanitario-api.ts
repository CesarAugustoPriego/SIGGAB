import { httpClient } from '../../lib/http-client';
import type { Animal } from '../ganado/ganado-types';
import type {
  AprobarEventoSanitarioInput,
  CalendarioSanitario,
  CalendarioSanitarioFilters,
  CompletarCalendarioSanitarioInput,
  CreateCalendarioSanitarioInput,
  CreateEventoSanitarioInput,
  EventoSanitario,
  EventoSanitarioFilters,
  TipoEventoSanitario,
  UpdateCalendarioSanitarioInput,
  UpdateEventoSanitarioInput,
} from './sanitario-types';

function buildEventosQuery(filters: EventoSanitarioFilters = {}) {
  const params = new URLSearchParams();

  if (filters.idAnimal && Number.isInteger(filters.idAnimal) && filters.idAnimal > 0) {
    params.set('animal', String(filters.idAnimal));
  }
  if (filters.idTipoEvento && Number.isInteger(filters.idTipoEvento) && filters.idTipoEvento > 0) {
    params.set('tipo', String(filters.idTipoEvento));
  }
  if (filters.estadoAprobacion) {
    params.set('estado', filters.estadoAprobacion);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

function buildCalendarioQuery(filters: CalendarioSanitarioFilters = {}) {
  const params = new URLSearchParams();

  if (filters.idAnimal && Number.isInteger(filters.idAnimal) && filters.idAnimal > 0) {
    params.set('animal', String(filters.idAnimal));
  }
  if (filters.estado) {
    params.set('estado', filters.estado);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const sanitarioApi = {
  getTiposEvento: () => httpClient.get<TipoEventoSanitario[]>('/eventos-sanitarios/tipos'),

  getAnimalesActivos: () => httpClient.get<Animal[]>('/animales?estado=ACTIVO'),

  getEventos: (filters: EventoSanitarioFilters = {}) => {
    const query = buildEventosQuery(filters);
    return httpClient.get<EventoSanitario[]>(`/eventos-sanitarios${query}`);
  },

  createEvento: (payload: CreateEventoSanitarioInput) => (
    httpClient.post<EventoSanitario>('/eventos-sanitarios', payload)
  ),

  updateEvento: (idEvento: number, payload: UpdateEventoSanitarioInput) => (
    httpClient.patch<EventoSanitario>(`/eventos-sanitarios/${idEvento}`, payload)
  ),

  aprobarEvento: (idEvento: number, payload: AprobarEventoSanitarioInput) => (
    httpClient.patch<EventoSanitario>(`/eventos-sanitarios/${idEvento}/aprobar`, payload)
  ),

  getCalendario: (filters: CalendarioSanitarioFilters = {}) => {
    const query = buildCalendarioQuery(filters);
    return httpClient.get<CalendarioSanitario[]>(`/calendario-sanitario${query}`);
  },

  getAlertas: (dias = 7) => httpClient.get<CalendarioSanitario[]>(`/calendario-sanitario/alertas?dias=${dias}`),

  createCalendario: (payload: CreateCalendarioSanitarioInput) => (
    httpClient.post<CalendarioSanitario>('/calendario-sanitario', payload)
  ),

  updateCalendario: (idCalendario: number, payload: UpdateCalendarioSanitarioInput) => (
    httpClient.patch<CalendarioSanitario>(`/calendario-sanitario/${idCalendario}`, payload)
  ),

  completarCalendario: (idCalendario: number, payload: CompletarCalendarioSanitarioInput) => (
    httpClient.patch<CalendarioSanitario>(`/calendario-sanitario/${idCalendario}/completar`, payload)
  ),
};
