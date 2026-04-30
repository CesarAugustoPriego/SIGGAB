export type DownloadFormat = 'pdf' | 'csv';
export type ModuloComparativoFechas = 'productividad' | 'sanitario' | 'perdidas';

export interface ReportPeriod {
  fechaInicio: string;
  fechaFin: string;
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
  insumos: {
    idInsumo: number;
    nombre: string;
    categoria: string;
    stockActual: number;
    unidadMedida: string;
    estado: 'OPTIMO' | 'BAJO' | 'CRITICO';
  }[];
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
  animales: {
    idAnimal: number;
    arete: string;
    raza: string;
    edadMeses: number;
    sexo: string;
    pesoKg: number;
    estadoSanitario: 'SANO' | 'EN_TRATAMIENTO' | 'ENFERMO';
    estadoSanitarioLabel: string;
    tratamiento: string;
  }[];
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
  animales: {
    idAnimal: number;
    arete: string;
    raza: string;
    edadMeses: number;
    pesoKg: number;
    gpdKgDia: number | null;
  }[];
}

export interface ReporteMetricaComparativa {
  label: string;
  periodoA: number;
  periodoB: number;
  delta: number;
  porcentaje: number;
  unit: string;
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
}

export interface ReportePerdidasComparativo extends ReporteComparativoFechas {
  tipo: 'perdidas-comparativo';
  motivos: { motivo: string; periodoA: number; periodoB: number; pesoA: number; pesoB: number }[];
}
