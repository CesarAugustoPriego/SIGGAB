export type ReportFormat = 'json' | 'csv' | 'pdf';
export type DownloadFormat = Exclude<ReportFormat, 'json'>;
export type EstadoRegistro = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
export type TipoMovimiento = 'ENTRADA' | 'SALIDA';
export type ModuloComparativo = 'sanitario' | 'productivo';
export type ModuloComparativoFechas = 'productividad' | 'sanitario' | 'perdidas';
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
}

export interface ReporteAdministrativoFilters {
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ReporteInventarioFilters {
  fechaInicio?: string;
  fechaFin?: string;
  categoria?: string;
}

export interface ReporteSanitarioHatoFilters {
  fechaInicio?: string;
  fechaFin?: string;
  estado?: 'SANO' | 'EN_TRATAMIENTO' | 'ENFERMO';
}

export interface ReporteProductividadFilters {
  fechaInicio?: string;
  fechaFin?: string;
  edadMinimaMeses?: number;
}

export interface ReporteComparativoFilters {
  modulo: ModuloComparativo;
  periodoAInicio: string;
  periodoAFin: string;
  periodoBInicio: string;
  periodoBFin: string;
}

export interface ReporteComparativoFechasFilters {
  modulo: ModuloComparativoFechas;
  periodoAInicio: string;
  periodoAFin: string;
  periodoBInicio: string;
  periodoBFin: string;
  edadMinimaMeses?: number;
}

export interface ReportePeriodosFilters {
  periodoAInicio: string;
  periodoAFin: string;
  periodoBInicio: string;
  periodoBFin: string;
}

export interface ReportePerdidasFilters {
  fechaInicio?: string;
  fechaFin?: string;
  motivo?: string;
}

export interface TipoEventoReporteOption {
  idTipoEvento: number;
  nombreTipo: string;
}

export interface AnimalReporteOption {
  idAnimal: number;
  numeroArete: string;
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

export interface ReporteInventarioInsumo {
  idInsumo: number;
  nombre: string;
  categoria: string;
  stockActual: number;
  unidadMedida: string;
  estado: 'OPTIMO' | 'BAJO' | 'CRITICO';
  puntoReorden: number | null;
  caducidad: string | null;
}

export interface ReporteInventario {
  tipo: 'inventario';
  periodo: ReportPeriod;
  resumen: {
    totalInsumos: number;
    criticos: number;
    bajos: number;
    optimos: number;
    stockTotalUnidades: number;
  };
  categorias: { categoria: string; totalInsumos: number; stockTotal: number }[];
  estados: { estado: string; total: number }[];
  insumos: ReporteInventarioInsumo[];
}

export interface ReporteSanitarioHatoAnimal {
  idAnimal: number;
  arete: string;
  raza: string;
  edadMeses: number;
  sexo: string;
  pesoKg: number;
  estadoSanitario: 'SANO' | 'EN_TRATAMIENTO' | 'ENFERMO';
  estadoSanitarioLabel: string;
  tratamiento: string;
}

export interface ReporteSanitarioHato {
  tipo: 'sanitario-hato';
  periodo: ReportPeriod;
  resumen: {
    totalEvaluados: number;
    sanos: number;
    enTratamiento: number;
    enfermos: number;
  };
  distribucion: { estado: string; label: string; total: number }[];
  animales: ReporteSanitarioHatoAnimal[];
}

export interface ReporteMetricaComparativa {
  label: string;
  periodoA: number;
  periodoB: number;
  delta: number;
  porcentaje: number;
  unit: string;
}

export interface ReporteSanitarioComparativo {
  tipo: 'sanitario-comparativo';
  periodoA: Record<string, number | string>;
  periodoB: Record<string, number | string>;
  metricas: ReporteMetricaComparativa[];
}

export interface ReporteProductividadAnimal {
  idAnimal: number;
  arete: string;
  raza: string;
  edadMeses: number;
  pesoKg: number;
  gpdKgDia: number | null;
}

export interface ReporteProductividad {
  tipo: 'productividad';
  periodo: ReportPeriod;
  filtros: { edadMinimaMeses: number };
  resumen: {
    totalAnimales: number;
    pesoTotalKg: number;
    pesoPromedioKg: number;
    gpdPromedioKgDia: number;
  };
  metricas: { label: string; value: number; unit: string }[];
  animales: ReporteProductividadAnimal[];
}

export interface ReporteComparativoFechas {
  tipo: 'comparativo-fechas' | 'sanitario-comparativo' | 'perdidas-comparativo';
  modulo?: ModuloComparativoFechas;
  periodoA: Record<string, number | string>;
  periodoB: Record<string, number | string>;
  metricas: ReporteMetricaComparativa[];
}

export interface ReportePerdidas {
  tipo: 'perdidas';
  periodo: ReportPeriod;
  resumen: {
    bajasTotales: number;
    pesoTotalPerdidoKg: number;
    filtroActivo: string;
  };
  porMotivo: { motivo: string; bajas: number; pesoKg: number; porcentaje: number }[];
  porPeriodo: { periodo: string; bajas: number; pesoKg: number }[];
  bajas: {
    idAnimal: number;
    arete: string;
    fechaBaja: string;
    estadoActual: string;
    motivo: string;
    motivoDetalle: string;
    pesoKg: number;
    raza: string;
  }[];
}

export interface ReportePerdidasComparativo {
  tipo: 'perdidas-comparativo';
  periodoA: Record<string, number | string>;
  periodoB: Record<string, number | string>;
  metricas: ReporteMetricaComparativa[];
  motivos: { motivo: string; periodoA: number; periodoB: number; pesoA: number; pesoB: number }[];
}
