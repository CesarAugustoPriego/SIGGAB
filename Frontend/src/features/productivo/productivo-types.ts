export type EstadoRegistro = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type TipoEventoReproductivo = 'CELO' | 'MONTA' | 'PRENEZ' | 'PREÑEZ' | 'PARTO' | 'ABORTO';

export interface RegistroPeso {
  idRegistroPeso: number;
  idAnimal: number;
  peso: number | string;
  fechaRegistro: string;
  registradoPor: number;
  estadoValidacion: EstadoRegistro;
  validadoPor: number | null;
  animal?: { idAnimal: number; numeroArete: string; raza?: { nombreRaza: string } | null } | null;
  registrador?: { nombreCompleto: string } | null;
  validador?: { nombreCompleto: string } | null;
}

export interface CreateRegistroPesoInput {
  idAnimal: number;
  peso: number;
  fechaRegistro: string;
}

export interface UpdateRegistroPesoInput {
  peso?: number;
  fechaRegistro?: string;
}

export interface ProduccionLeche {
  idProduccion: number;
  idAnimal: number;
  litrosProducidos: number | string;
  fechaRegistro: string;
  registradoPor: number;
  estadoValidacion: EstadoRegistro;
  validadoPor: number | null;
  animal?: { idAnimal: number; numeroArete: string; raza?: { nombreRaza: string } | null } | null;
  registrador?: { nombreCompleto: string } | null;
  validador?: { nombreCompleto: string } | null;
}

export interface CreateProduccionLecheInput {
  idAnimal: number;
  litrosProducidos: number;
  fechaRegistro: string;
}

export interface UpdateProduccionLecheInput {
  litrosProducidos?: number;
  fechaRegistro?: string;
}

export interface EventoReproductivo {
  idEventoReproductivo: number;
  idAnimal: number;
  tipoEvento: TipoEventoReproductivo;
  fechaEvento: string;
  observaciones: string | null;
  registradoPor: number;
  estadoValidacion: EstadoRegistro;
  validadoPor: number | null;
  animal?: { idAnimal: number; numeroArete: string; raza?: { nombreRaza: string } | null } | null;
  registrador?: { nombreCompleto: string } | null;
  validador?: { nombreCompleto: string } | null;
}

export interface CreateEventoReproductivoInput {
  idAnimal: number;
  tipoEvento: TipoEventoReproductivo;
  fechaEvento: string;
  observaciones?: string;
}

export interface UpdateEventoReproductivoInput {
  tipoEvento?: TipoEventoReproductivo;
  fechaEvento?: string;
  observaciones?: string;
}

export interface ValidarRegistroInput {
  estadoValidacion: 'APROBADO' | 'RECHAZADO';
}

export interface RegistroPesoFilters {
  idAnimal?: number;
  estado?: EstadoRegistro | 'TODOS';
}

export interface ProduccionLecheFilters {
  idAnimal?: number;
  estado?: EstadoRegistro | 'TODOS';
}

export interface EventoReproductivoFilters {
  idAnimal?: number;
  tipo?: TipoEventoReproductivo | 'TODOS';
  estado?: EstadoRegistro | 'TODOS';
}
