import { httpClient } from '@/src/lib/http-client';
import type {
  RegistroPeso,
  CreateRegistroPesoInput,
  ProduccionLeche,
  CreateProduccionLecheInput,
  EventoReproductivo,
  CreateEventoReproductivoInput,
} from './productivo-types';

function buildQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== '' && String(val) !== 'TODOS') {
      qs.set(key, String(val));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const productivoApi = {
  getRegistrosPeso: (params: { idAnimal?: number; estado?: string } = {}) => {
    const q = buildQuery(params);
    return httpClient.get<RegistroPeso[]>(`/registros-peso${q}`);
  },

  createRegistroPeso: (payload: CreateRegistroPesoInput) =>
    httpClient.post<RegistroPeso>('/registros-peso', payload),

  getProduccionLeche: (params: { idAnimal?: number; estado?: string } = {}) => {
    const q = buildQuery(params);
    return httpClient.get<ProduccionLeche[]>(`/produccion-leche${q}`);
  },

  createProduccionLeche: (payload: CreateProduccionLecheInput) =>
    httpClient.post<ProduccionLeche>('/produccion-leche', payload),

  getEventosReproductivos: (params: { idAnimal?: number; tipo?: string; estado?: string } = {}) => {
    const q = buildQuery(params);
    return httpClient.get<EventoReproductivo[]>(`/eventos-reproductivos${q}`);
  },

  createEventoReproductivo: (payload: CreateEventoReproductivoInput) =>
    httpClient.post<EventoReproductivo>('/eventos-reproductivos', payload),
};
