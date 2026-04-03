export type ReportFormat = 'json' | 'csv' | 'pdf';
export type DownloadFormat = Exclude<ReportFormat, 'json'>;
export type EstadoRegistro = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
export type TipoMovimiento = 'ENTRADA' | 'SALIDA';
export type ModuloComparativo = 'sanitario' | 'productivo';
export type NumericValue = number | string;

export interface ReportPeriod {
  fechaInicio: string;
  fechaFin: string;
}

export interface ReportDownload {
  blob: Blob;
  fileName: string;
}

export interface ReporteSanitarioFilters {
  fechaInicio?: string;
  fechaFin?: string;
  estadoAprobacion?: EstadoRegistro;
  idTipoEvento?: number;
}

export interface ReporteProductivoFilters {
  fechaInicio?: string;
  fechaFin?: string;
  idAnimal?: number;
  idLote?: number;
}

export interface ReporteAdministrativoFilters {
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ReporteComparativoFilters {
  modulo: ModuloComparativo;
  periodoAInicio: string;
  periodoAFin: string;
  periodoBInicio: string;
  periodoBFin: string;
}

export interface TipoEventoReporteOption {
  idTipoEvento: number;
  nombreTipo: string;
}

export interface AnimalReporteOption {
  idAnimal: number;
  numeroArete: string;
}

export interface LoteReporteOption {
  idLote: number;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoRegistro;
}

export interface ReporteSanitarioRegistro {
  idEvento: number;
  idAnimal: number;
  idTipoEvento: number;
  fechaEvento: string;
  diagnostico: string | null;
  medicamento: string | null;
  dosis: string | null;
  estadoAprobacion: EstadoRegistro;
  autorizadoPor: number | null;
  animal: {
    idAnimal: number;
    numeroArete: string;
  };
  tipoEvento: {
    idTipoEvento: number;
    nombreTipo: string;
  };
}

export interface ReporteSanitario {
  tipo: 'sanitario';
  periodo: ReportPeriod;
  resumen: {
    totalRegistros: number;
    aprobados: number;
    rechazados: number;
    pendientes: number;
  };
  registros: ReporteSanitarioRegistro[];
}

export interface ReporteProductivoPesoRegistro {
  idRegistroPeso: number;
  idAnimal: number;
  idLote: number;
  peso: NumericValue;
  fechaRegistro: string;
  estadoValidacion: EstadoRegistro;
  animal: {
    idAnimal: number;
    numeroArete: string;
  };
}

export interface ReporteProductivoLecheRegistro {
  idProduccion: number;
  idAnimal: number;
  idLote: number;
  litrosProducidos: NumericValue;
  fechaRegistro: string;
  estadoValidacion: EstadoRegistro;
  animal: {
    idAnimal: number;
    numeroArete: string;
  };
}

export interface ReporteProductivoReproductivoRegistro {
  idEventoReproductivo: number;
  idAnimal: number;
  idLote: number;
  tipoEvento: string;
  fechaEvento: string;
  observaciones: string | null;
  estadoValidacion: EstadoRegistro;
  animal: {
    idAnimal: number;
    numeroArete: string;
  };
}

export interface ReporteProductivo {
  tipo: 'productivo';
  periodo: ReportPeriod;
  resumen: {
    totalRegistrosPeso: number;
    promedioPesoKg: number;
    totalRegistrosLeche: number;
    totalLitrosLeche: number;
    totalEventosReproductivos: number;
    tasaNatalidadPorcentaje: number;
  };
  registrosPeso: ReporteProductivoPesoRegistro[];
  produccionLeche: ReporteProductivoLecheRegistro[];
  eventosReproductivos: ReporteProductivoReproductivoRegistro[];
}

export interface ReporteSolicitudDetalle {
  idDetalle: number;
  idSolicitud: number;
  idInsumo: number;
  cantidad: NumericValue;
  precioEstimado: NumericValue;
  subtotalEstimado: NumericValue;
}

export interface ReporteSolicitud {
  idSolicitud: number;
  fechaSolicitud: string;
  estadoSolicitud: EstadoSolicitud;
  observaciones: string | null;
  solicitante?: {
    idUsuario: number;
    nombreCompleto: string;
  } | null;
  aprobador?: {
    idUsuario: number;
    nombreCompleto: string;
  } | null;
  detalles: ReporteSolicitudDetalle[];
}

export interface ReporteCompraDetalle {
  idDetalleCompra: number;
  idCompra: number;
  idInsumo: number;
  cantidadReal: NumericValue;
  precioUnitario: NumericValue;
  subtotal: NumericValue;
}

export interface ReporteCompra {
  idCompra: number;
  idSolicitud: number;
  fechaCompra: string;
  totalReal: NumericValue;
  realizador?: {
    idUsuario: number;
    nombreCompleto: string;
  } | null;
  detalles: ReporteCompraDetalle[];
}

export interface ReporteMovimientoInventario {
  idMovimiento: number;
  idInsumo: number;
  tipoMovimiento: TipoMovimiento;
  cantidad: NumericValue;
  fechaMovimiento: string;
  insumo?: {
    idInsumo: number;
    nombreInsumo: string;
    unidadMedida: string;
    tipoInsumo?: {
      idTipoInsumo: number;
      nombreTipo: string;
    } | null;
  } | null;
}

export interface ReporteInsumoActual {
  idInsumo: number;
  nombreInsumo: string;
  unidadMedida: string;
  stockActual: NumericValue;
  tipoInsumo?: {
    idTipoInsumo: number;
    nombreTipo: string;
  } | null;
}

export interface ReporteAdministrativo {
  tipo: 'administrativo';
  periodo: ReportPeriod;
  resumen: {
    totalSolicitudes: number;
    totalCompras: number;
    montoCompras: number;
    totalMovimientosInventario: number;
    totalInsumosActivos: number;
    stockTotalUnidades: number;
    consumoMedicamentos: number;
    consumoAlimentos: number;
  };
  solicitudes: ReporteSolicitud[];
  compras: ReporteCompra[];
  movimientos: ReporteMovimientoInventario[];
  inventarioActual: ReporteInsumoActual[];
}

export interface ReporteComparativoVariacion {
  delta: number;
  porcentaje: number;
}

export interface ReporteComparativo {
  tipo: 'comparativo';
  modulo: ModuloComparativo;
  periodoA: Record<string, number | string>;
  periodoB: Record<string, number | string>;
  variacion: Record<string, ReporteComparativoVariacion>;
}
