import { httpClient } from '../../lib/http-client';
import type {
  LoteProductivo,
  LoteFilters,
  CreateLoteInput,
  ValidarLoteInput,
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
  // ─── Lotes ──────────────────────────────────────────────────────────────────
  getLotes: (filters: LoteFilters = {}) => {
    const q = buildQuery({ estado: filters.estado });
    return httpClient.get<LoteProductivo[]>(`/lotes-productivos${q}`);
  },

  getLoteById: (id: number) =>
    httpClient.get<LoteProductivo>(`/lotes-productivos/${id}`),

  createLote: (payload: CreateLoteInput) =>
    httpClient.post<LoteProductivo>('/lotes-productivos', payload),

  validarLote: (id: number, payload: ValidarLoteInput) =>
    httpClient.patch<LoteProductivo>(`/lotes-productivos/${id}/validar`, payload),

  // ─── Registro de peso ───────────────────────────────────────────────────────
  getRegistrosPeso: (filters: RegistroPesoFilters = {}) => {
    const q = buildQuery({ idAnimal: filters.idAnimal, idLote: filters.idLote, estado: filters.estado });
    return httpClient.get<RegistroPeso[]>(`/registros-peso${q}`);
  },

  createRegistroPeso: (payload: CreateRegistroPesoInput) =>
    httpClient.post<RegistroPeso>('/registros-peso', payload),

  updateRegistroPeso: (id: number, payload: UpdateRegistroPesoInput) =>
    httpClient.patch<RegistroPeso>(`/registros-peso/${id}`, payload),

  validarRegistroPeso: (id: number, payload: ValidarRegistroInput) =>
    httpClient.patch<RegistroPeso>(`/registros-peso/${id}/validar`, payload),

  // ─── Producción de leche ────────────────────────────────────────────────────
  getProduccionLeche: (filters: ProduccionLecheFilters = {}) => {
    const q = buildQuery({ idAnimal: filters.idAnimal, idLote: filters.idLote, estado: filters.estado });
    return httpClient.get<ProduccionLeche[]>(`/produccion-leche${q}`);
  },

  createProduccionLeche: (payload: CreateProduccionLecheInput) =>
    httpClient.post<ProduccionLeche>('/produccion-leche', payload),

  updateProduccionLeche: (id: number, payload: UpdateProduccionLecheInput) =>
    httpClient.patch<ProduccionLeche>(`/produccion-leche/${id}`, payload),

  validarProduccionLeche: (id: number, payload: ValidarRegistroInput) =>
    httpClient.patch<ProduccionLeche>(`/produccion-leche/${id}/validar`, payload),

  // ─── Eventos reproductivos ──────────────────────────────────────────────────
  getEventosReproductivos: (filters: EventoReproductivoFilters = {}) => {
    const q = buildQuery({ idAnimal: filters.idAnimal, idLote: filters.idLote, tipo: filters.tipo, estado: filters.estado });
    return httpClient.get<EventoReproductivo[]>(`/eventos-reproductivos${q}`);
  },

  createEventoReproductivo: (payload: CreateEventoReproductivoInput) =>
    httpClient.post<EventoReproductivo>('/eventos-reproductivos', payload),

  updateEventoReproductivo: (id: number, payload: UpdateEventoReproductivoInput) =>
    httpClient.patch<EventoReproductivo>(`/eventos-reproductivos/${id}`, payload),

  validarEventoReproductivo: (id: number, payload: ValidarRegistroInput) =>
    httpClient.patch<EventoReproductivo>(`/eventos-reproductivos/${id}/validar`, payload),
};
