import { httpClient } from '../../lib/http-client';
import type {
  Animal,
  AnimalFilters,
  BajaAnimalInput,
  CreateAnimalInput,
  HistorialAnimalResponse,
  Raza,
  UpdateAnimalInput,
} from './ganado-types';

function buildAnimalesQuery(filters: AnimalFilters = {}) {
  const params = new URLSearchParams();

  if (filters.estadoActual && filters.estadoActual !== 'TODOS') {
    params.set('estado', filters.estadoActual);
  }

  if (filters.idRaza && Number.isInteger(filters.idRaza) && filters.idRaza > 0) {
    params.set('raza', String(filters.idRaza));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const ganadoApi = {
  getRazas: () => httpClient.get<Raza[]>('/razas'),

  getAnimales: (filters: AnimalFilters = {}) => {
    const query = buildAnimalesQuery(filters);
    return httpClient.get<Animal[]>(`/animales${query}`);
  },

  getAnimalByArete: (numeroArete: string) => (
    httpClient.get<Animal>(`/animales/arete/${encodeURIComponent(numeroArete)}`)
  ),

  getHistorialByArete: (numeroArete: string) => (
    httpClient.get<HistorialAnimalResponse>(`/animales/arete/${encodeURIComponent(numeroArete)}/historial`)
  ),

  createAnimal: (payload: CreateAnimalInput) => httpClient.post<Animal>('/animales', payload),

  updateAnimal: (idAnimal: number, payload: UpdateAnimalInput) => (
    httpClient.patch<Animal>(`/animales/${idAnimal}`, payload)
  ),

  bajaAnimal: (idAnimal: number, payload: BajaAnimalInput) => (
    httpClient.patch<Animal>(`/animales/${idAnimal}/baja`, payload)
  ),
};
