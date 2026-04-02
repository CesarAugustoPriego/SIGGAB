import { httpClient } from '../../lib/http-client';
import type {
  TipoInsumo, CreateTipoInsumoInput, UpdateTipoInsumoInput,
  Insumo, InsumoFilters, CreateInsumoInput, UpdateInsumoInput,
  MovimientoInventario, MovimientoFilters, CreateMovimientoInput,
  SolicitudCompra, SolicitudFilters, CreateSolicitudInput, AprobarSolicitudInput,
  CompraRealizada, CreateCompraInput,
} from './inventario-types';

function buildQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== '' && val !== 'TODOS') qs.set(key, String(val));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const inventarioApi = {
  // ─── Tipos de insumo ────────────────────────────────────────────────────────
  getTipos: () => httpClient.get<TipoInsumo[]>('/insumos/tipos'),
  createTipo: (p: CreateTipoInsumoInput) => httpClient.post<TipoInsumo>('/insumos/tipos', p),
  updateTipo: (id: number, p: UpdateTipoInsumoInput) => httpClient.patch<TipoInsumo>(`/insumos/tipos/${id}`, p),

  // ─── Insumos ────────────────────────────────────────────────────────────────
  getInsumos: (f: InsumoFilters = {}) => {
    const q = buildQuery({ idTipoInsumo: f.idTipoInsumo });
    return httpClient.get<Insumo[]>(`/insumos${q}`);
  },
  getInsumoById: (id: number) => httpClient.get<Insumo>(`/insumos/${id}`),
  createInsumo: (p: CreateInsumoInput) => httpClient.post<Insumo>('/insumos', p),
  updateInsumo: (id: number, p: UpdateInsumoInput) => httpClient.patch<Insumo>(`/insumos/${id}`, p),

  // ─── Movimientos ────────────────────────────────────────────────────────────
  getMovimientos: (f: MovimientoFilters = {}) => {
    const q = buildQuery({ idInsumo: f.idInsumo, tipo: f.tipo });
    return httpClient.get<MovimientoInventario[]>(`/insumos/movimientos${q}`);
  },
  createMovimiento: (p: CreateMovimientoInput) => httpClient.post<MovimientoInventario>('/insumos/movimientos', p),

  // ─── Solicitudes de compra ──────────────────────────────────────────────────
  getSolicitudes: (f: SolicitudFilters = {}) => {
    const q = buildQuery({ estado: f.estado });
    return httpClient.get<SolicitudCompra[]>(`/solicitudes-compra${q}`);
  },
  getSolicitudById: (id: number) => httpClient.get<SolicitudCompra>(`/solicitudes-compra/${id}`),
  createSolicitud: (p: CreateSolicitudInput) => httpClient.post<SolicitudCompra>('/solicitudes-compra', p),
  aprobarSolicitud: (id: number, p: AprobarSolicitudInput) => httpClient.patch<SolicitudCompra>(`/solicitudes-compra/${id}/aprobar`, p),

  // ─── Compras realizadas ─────────────────────────────────────────────────────
  getCompras: () => httpClient.get<CompraRealizada[]>('/compras-realizadas'),
  getCompraById: (id: number) => httpClient.get<CompraRealizada>(`/compras-realizadas/${id}`),
  createCompra: (p: CreateCompraInput) => httpClient.post<CompraRealizada>('/compras-realizadas', p),
};
