import { httpClient } from '@/src/lib/http-client';
import type {
  Insumo,
  TipoInsumo,
  MovimientoInventario,
  CreateMovimientoInput,
} from './inventario-types';

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

export const inventarioApi = {
  getTipos: () => httpClient.get<TipoInsumo[]>('/insumos/tipos'),

  getInsumos: (idTipoInsumo?: number) => {
    const q = buildQuery({ idTipoInsumo });
    return httpClient.get<Insumo[]>(`/insumos${q}`);
  },

  getMovimientos: (params: { idInsumo?: number; tipo?: 'ENTRADA' | 'SALIDA' } = {}) => {
    const q = buildQuery(params);
    return httpClient.get<MovimientoInventario[]>(`/insumos/movimientos${q}`);
  },

  createMovimiento: (payload: CreateMovimientoInput) =>
    httpClient.post<MovimientoInventario>('/insumos/movimientos', payload),
};
