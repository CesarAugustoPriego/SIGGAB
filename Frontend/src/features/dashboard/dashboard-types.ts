// ─── Resumen KPIs ────────────────────────────────────────────────────────────

export interface DashboardResumen {
  totalAnimalesActivos: number;
  vacunacionesMes: number;
  pesosPendientesValidar: number;
  alertasProximas7Dias: number;
  solicitudesCompraPendientes: number;
  insumosStockAgotado: number;
  inventarioTotalItems: number;
  inventarioTotalUnidades: number;
  generadoEn: string;
}

// ─── Ganado ──────────────────────────────────────────────────────────────────

export interface GrupoEstado {
  estadoActual: string;
  _count: { idAnimal: number };
}

export interface GrupoRaza {
  idRaza: number;
  nombreRaza: string;
  _count: { idAnimal: number };
}

export interface AnimalReciente {
  idAnimal: number;
  numeroArete: string;
  nombre?: string;
  fechaIngreso: string;
  raza?: { nombreRaza: string };
}

export interface DashboardGanado {
  porEstado: GrupoEstado[];
  porRaza: GrupoRaza[];
  recienIngresados: AnimalReciente[];
}

// ─── Producción ──────────────────────────────────────────────────────────────

export interface EventoReproCount {
  tipoEvento: string;
  _count: { idEventoReproductivo: number };
}

export interface DashboardProduccion {
  peso: { gananciaPromedioKg: number; totalRegistros: number };
  leche: { totalLitros: number; promedioLitros: number; totalRegistros: number };
  eventosReproductivos: EventoReproCount[];
  tasas: {
    natalidadPorcentaje: number;
    mortalidadPorcentaje: number;
    partosPeriodo: number;
    muertesPeriodo: number;
  };
  periodo: string;
}

// ─── Sanitario ───────────────────────────────────────────────────────────────

export interface ProximoEvento {
  idCalendario: number;
  fechaProgramada: string;
  estado: string;
  animal: { idAnimal: number; numeroArete: string };
  tipoEvento: { nombreTipo: string };
}

export interface PendienteAprobacion {
  idEventoSanitario: number;
  fechaEvento: string;
  animal: { idAnimal: number; numeroArete: string };
  tipoEvento: { nombreTipo: string };
}

export interface DashboardSanitario {
  proximosEventos: ProximoEvento[];
  pendientesAprobacion: PendienteAprobacion[];
}

// ─── Inventario ──────────────────────────────────────────────────────────────

export interface InsumoAlerta {
  idInsumo: number;
  nombreInsumo: string;
  stockActual: number | string;
  unidadMedida: string;
  tipoInsumo: { nombreTipo: string };
}

export interface MovimientoReciente {
  idMovimiento: number;
  fechaMovimiento: string;
  tipoMovimiento: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  insumo: { idInsumo: number; nombreInsumo: string; unidadMedida: string };
}

export interface DashboardInventario {
  agotados: InsumoAlerta[];
  bajoStock: InsumoAlerta[];
  movimientosRecientes: MovimientoReciente[];
}

// ─── Bitácora ────────────────────────────────────────────────────────────────

export interface BitacoraEntry {
  idBitacora: number;
  idUsuario: number;
  accion: string;
  tablaAfectada: string;
  idRegistro: number;
  fechaHora: string;
  detalles: Record<string, unknown> | null;
  usuario: {
    idUsuario: number;
    nombreCompleto: string;
    username: string;
    rol?: { idRol: number; nombreRol: string } | null;
  };
}
