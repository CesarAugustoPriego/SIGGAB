import { httpClient } from '@/src/lib/http-client';
import type {
  LoteProductivo,
  CreateLoteInput,
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
  // ─── Lotes ──────────────────────────────────────────────────────────────────
  getLotes: (estado?: string) => {
    const q = buildQuery({ estado });
    return httpClient.get<LoteProductivo[]>(`/lotes-productivos${q}`);
  },

  createLote: (payload: CreateLoteInput) =>
    httpClient.post<LoteProductivo>('/lotes-productivos', payload),

  // ─── Registro de peso ───────────────────────────────────────────────────────
  getRegistrosPeso: (params: { idAnimal?: number; idLote?: number; estado?: string } = {}) => {
    const q = buildQuery(params);
    return httpClient.get<RegistroPeso[]>(`/registros-peso${q}`);
  },

  createRegistroPeso: (payload: CreateRegistroPesoInput) =>
    httpClient.post<RegistroPeso>('/registros-peso', payload),

  // ─── Producción de leche ────────────────────────────────────────────────────
  getProduccionLeche: (params: { idAnimal?: number; idLote?: number; estado?: string } = {}) => {
    const q = buildQuery(params);
    return httpClient.get<ProduccionLeche[]>(`/produccion-leche${q}`);
  },

  createProduccionLeche: (payload: CreateProduccionLecheInput) =>
    httpClient.post<ProduccionLeche>('/produccion-leche', payload),

  // ─── Eventos reproductivos ──────────────────────────────────────────────────
  getEventosReproductivos: (params: { idAnimal?: number; idLote?: number; tipo?: string; estado?: string } = {}) => {
    const q = buildQuery(params);
    return httpClient.get<EventoReproductivo[]>(`/eventos-reproductivos${q}`);
  },

  createEventoReproductivo: (payload: CreateEventoReproductivoInput) =>
    httpClient.post<EventoReproductivo>('/eventos-reproductivos', payload),
};
