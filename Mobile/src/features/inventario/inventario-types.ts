export interface TipoInsumo {
  idTipoInsumo: number;
  nombreTipo: string;
  descripcion?: string | null;
  activo: boolean;
}

export interface Insumo {
  idInsumo: number;
  nombreInsumo: string;
  idTipoInsumo: number;
  unidadMedida: string;
  descripcion?: string | null;
  stockActual: number | string;
  activo: boolean;
  tipoInsumo?: TipoInsumo;
}

export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

export interface MovimientoInventario {
  idMovimiento: number;
  idInsumo: number;
  tipoMovimiento: TipoMovimiento;
  cantidad: number | string;
  fechaMovimiento: string;
  referenciaCompra?: number | null;
  registradoPor: number;
  insumo?: Insumo;
  registrador?: {
    idUsuario: number;
    nombreCompleto: string;
  };
}

export interface CreateMovimientoInput {
  idInsumo: number;
  tipoMovimiento: TipoMovimiento;
  cantidad: number;
  fechaMovimiento: string;
}
