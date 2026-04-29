import { httpClient } from '../../lib/http-client';
import type {
  RegistroPeso,
  RegistroPesoFilters,
  CreateRegistroPesoInput,
  UpdateRegistroPesoInput,
  ProduccionLeche,
  ProduccionLecheFilters,
  CreateProduccionLecheInput,
  UpdateProduccionLecheInput,
  EventoReproductivo,
  EventoReproductivoFilters,
  CreateEventoReproductivoInput,
  UpdateEventoReproductivoInput,
  ValidarRegistroInput,
} from './productivo-types';

function buildQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== '' && val !== 'TODOS') {
      qs.set(key, String(val));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const productivoApi = {
  getRegistrosPeso: (filters: RegistroPesoFilters = {}) => {
    const q = buildQuery({ idAnimal: filters.idAnimal, estado: filters.estado });
    return httpClient.get<RegistroPeso[]>(`/registros-peso${q}`);
  },

  createRegistroPeso: (payload: CreateRegistroPesoInput) =>
    httpClient.post<RegistroPeso>('/registros-peso', payload),

  updateRegistroPeso: (id: number, payload: UpdateRegistroPesoInput) =>
    httpClient.patch<RegistroPeso>(`/registros-peso/${id}`, payload),

  validarRegistroPeso: (id: number, payload: ValidarRegistroInput) =>
    httpClient.patch<RegistroPeso>(`/registros-peso/${id}/validar`, payload),

  getProduccionLeche: (filters: ProduccionLecheFilters = {}) => {
    const q = buildQuery({ idAnimal: filters.idAnimal, estado: filters.estado });
    return httpClient.get<ProduccionLeche[]>(`/produccion-leche${q}`);
  },

  createProduccionLeche: (payload: CreateProduccionLecheInput) =>
    httpClient.post<ProduccionLeche>('/produccion-leche', payload),

  updateProduccionLeche: (id: number, payload: UpdateProduccionLecheInput) =>
    httpClient.patch<ProduccionLeche>(`/produccion-leche/${id}`, payload),

  validarProduccionLeche: (id: number, payload: ValidarRegistroInput) =>
    httpClient.patch<ProduccionLeche>(`/produccion-leche/${id}/validar`, payload),

  getEventosReproductivos: (filters: EventoReproductivoFilters = {}) => {
    const q = buildQuery({ idAnimal: filters.idAnimal, tipo: filters.tipo, estado: filters.estado });
    return httpClient.get<EventoReproductivo[]>(`/eventos-reproductivos${q}`);
  },

  createEventoReproductivo: (payload: CreateEventoReproductivoInput) =>
    httpClient.post<EventoReproductivo>('/eventos-reproductivos', payload),

  updateEventoReproductivo: (id: number, payload: UpdateEventoReproductivoInput) =>
    httpClient.patch<EventoReproductivo>(`/eventos-reproductivos/${id}`, payload),

  validarEventoReproductivo: (id: number, payload: ValidarRegistroInput) =>
    httpClient.patch<EventoReproductivo>(`/eventos-reproductivos/${id}/validar`, payload),
};
