export type EstadoRegistro = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type TipoEventoReproductivo = 'CELO' | 'MONTA' | 'PREÑEZ' | 'PARTO' | 'ABORTO';

// ─── Lotes ────────────────────────────────────────────────────────────────────

export interface LoteProductivo {
  idLote: number;
  fechaInicio: string;
  fechaFin: string;
  creadoPor: number;
  fechaCreacion: string;
  estado: EstadoRegistro;
  creador?: { idUsuario: number; nombreCompleto: string } | null;
}

export interface CreateLoteInput {
  fechaInicio: string;
  fechaFin: string;
}

// ─── Registro de peso ─────────────────────────────────────────────────────────

export interface RegistroPeso {
  idRegistroPeso: number;
  idAnimal: number;
  idLote: number;
  peso: number | string;
  fechaRegistro: string;
  registradoPor: number;
  estadoValidacion: EstadoRegistro;
  validadoPor: number | null;
  animal?: { idAnimal: number; numeroArete: string; raza?: { nombreRaza: string } | null } | null;
  lote?: { idLote: number; fechaInicio: string; fechaFin: string } | null;
  registrador?: { nombreCompleto: string } | null;
}

export interface CreateRegistroPesoInput {
  idAnimal: number;
  idLote: number;
  peso: number;
  fechaRegistro: string;
}

// ─── Producción de leche ──────────────────────────────────────────────────────

export interface ProduccionLeche {
  idProduccion: number;
  idAnimal: number;
  idLote: number;
  litrosProducidos: number | string;
  fechaRegistro: string;
  registradoPor: number;
  estadoValidacion: EstadoRegistro;
  validadoPor: number | null;
  animal?: { idAnimal: number; numeroArete: string; raza?: { nombreRaza: string } | null } | null;
  lote?: { idLote: number; fechaInicio: string; fechaFin: string } | null;
  registrador?: { nombreCompleto: string } | null;
}

export interface CreateProduccionLecheInput {
  idAnimal: number;
  idLote: number;
  litrosProducidos: number;
  fechaRegistro: string;
}

// ─── Eventos reproductivos ────────────────────────────────────────────────────

export interface EventoReproductivo {
  idEventoReproductivo: number;
  idAnimal: number;
  idLote: number | null;
  tipoEvento: TipoEventoReproductivo;
  fechaEvento: string;
  observaciones: string | null;
  registradoPor: number;
  estadoValidacion: EstadoRegistro;
  validadoPor: number | null;
  animal?: { idAnimal: number; numeroArete: string; raza?: { nombreRaza: string } | null } | null;
  lote?: { idLote: number; fechaInicio: string; fechaFin: string } | null;
  registrador?: { nombreCompleto: string } | null;
}

export interface CreateEventoReproductivoInput {
  idAnimal: number;
  idLote?: number;
  tipoEvento: TipoEventoReproductivo;
  fechaEvento: string;
  observaciones?: string;
}
