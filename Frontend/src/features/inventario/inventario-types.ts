export type TipoMovimiento = 'ENTRADA' | 'SALIDA';
export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

// ─── Tipos de insumo ──────────────────────────────────────────────────────────

export interface TipoInsumo {
  idTipoInsumo: number;
  nombreTipo: string;
  descripcion: string | null;
  activo: boolean;
}

export interface CreateTipoInsumoInput {
  nombreTipo: string;
  descripcion?: string;
}

export interface UpdateTipoInsumoInput {
  nombreTipo?: string;
  descripcion?: string;
  activo?: boolean;
}

// ─── Insumos ──────────────────────────────────────────────────────────────────

export interface Insumo {
  idInsumo: number;
  nombreInsumo: string;
  idTipoInsumo: number;
  unidadMedida: string;
  descripcion: string | null;
  stockActual: number | string;
  activo: boolean;
  tipoInsumo?: { idTipoInsumo: number; nombreTipo: string } | null;
}

export interface CreateInsumoInput {
  nombreInsumo: string;
  idTipoInsumo: number;
  unidadMedida: string;
  descripcion?: string;
  stockActual?: number;
}

export interface UpdateInsumoInput {
  nombreInsumo?: string;
  idTipoInsumo?: number;
  unidadMedida?: string;
  descripcion?: string;
  activo?: boolean;
}

// ─── Movimientos de inventario ────────────────────────────────────────────────

export interface MovimientoInventario {
  idMovimiento: number;
  idInsumo: number;
  tipoMovimiento: TipoMovimiento;
  cantidad: number | string;
  fechaMovimiento: string;
  referenciaCompra: number | null;
  registradoPor: number;
  insumo?: { idInsumo: number; nombreInsumo: string; unidadMedida: string } | null;
  registrador?: { nombreCompleto: string } | null;
}

export interface CreateMovimientoInput {
  idInsumo: number;
  tipoMovimiento: TipoMovimiento;
  cantidad: number;
  fechaMovimiento: string;
}

// ─── Solicitudes de compra ────────────────────────────────────────────────────

export interface DetalleSolicitud {
  idDetalle: number;
  idSolicitud: number;
  idInsumo: number;
  cantidad: number | string;
  precioEstimado: number | string;
  subtotalEstimado: number | string;
  insumo?: { idInsumo: number; nombreInsumo: string; unidadMedida: string } | null;
}

export interface SolicitudCompra {
  idSolicitud: number;
  fechaSolicitud: string;
  solicitadaPor: number;
  estadoSolicitud: EstadoSolicitud;
  aprobadaPor: number | null;
  fechaAprobacion: string | null;
  observaciones: string | null;
  solicitante?: { nombreCompleto: string } | null;
  aprobador?: { nombreCompleto: string } | null;
  detalles?: DetalleSolicitud[];
  comprasRealizadas?: { idCompra: number }[];
}

export interface DetalleSolicitudInput {
  idInsumo: number;
  cantidad: number;
  precioEstimado: number;
}

export interface CreateSolicitudInput {
  fechaSolicitud: string;
  observaciones?: string;
  detalles: DetalleSolicitudInput[];
}

export interface AprobarSolicitudInput {
  estadoSolicitud: 'APROBADA' | 'RECHAZADA';
  observaciones?: string;
}

// ─── Compras realizadas ───────────────────────────────────────────────────────

export interface DetalleCompra {
  idDetalleCompra: number;
  idCompra: number;
  idInsumo: number;
  cantidadReal: number | string;
  precioUnitario: number | string;
  subtotal: number | string;
  insumo?: { idInsumo: number; nombreInsumo: string; unidadMedida: string } | null;
}

export interface CompraRealizada {
  idCompra: number;
  idSolicitud: number;
  fechaCompra: string;
  realizadaPor: number;
  totalReal: number | string;
  solicitud?: { idSolicitud: number; fechaSolicitud: string } | null;
  realizador?: { nombreCompleto: string } | null;
  detalles?: DetalleCompra[];
  movimientos?: MovimientoInventario[];
}

export interface DetalleCompraInput {
  idInsumo: number;
  cantidadReal: number;
  precioUnitario: number;
}

export interface CreateCompraInput {
  idSolicitud: number;
  fechaCompra: string;
  detalles: DetalleCompraInput[];
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

export interface InsumoFilters { idTipoInsumo?: number; }
export interface MovimientoFilters { idInsumo?: number; tipo?: TipoMovimiento | 'TODOS'; }
export interface SolicitudFilters { estado?: EstadoSolicitud | 'TODOS'; }
