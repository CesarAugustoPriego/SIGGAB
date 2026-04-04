export type EstadoRegistro = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type EstadoCalendario = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
export type SanitarioCategoria = 'VACUNA' | 'TRATAMIENTO' | 'PADECIMIENTO';

export interface TipoEventoSanitario {
  idTipoEvento: number;
  nombreTipo: string;
  activo?: boolean;
}

export interface EventoSanitario {
  idEvento: number;
  idAnimal: number;
  idTipoEvento: number;
  fechaEvento: string;
  diagnostico: string | null;
  medicamento: string | null;
  dosis: string | null;
  estadoAprobacion: EstadoRegistro;
  autorizadoPor: number | null;
  animal?: {
    idAnimal: number;
    numeroArete: string;
  } | null;
  tipoEvento?: TipoEventoSanitario | null;
  autorizador?: {
    idUsuario: number;
    nombreCompleto: string;
  } | null;
}

export interface CalendarioSanitario {
  idCalendario: number;
  idAnimal: number;
  idTipoEvento: number;
  fechaProgramada: string;
  fechaAlerta: string | null;
  programadoPor: number;
  estado: EstadoCalendario;
  animal?: {
    idAnimal: number;
    numeroArete: string;
  } | null;
  tipoEvento?: TipoEventoSanitario | null;
  programador?: {
    idUsuario: number;
    nombreCompleto: string;
  } | null;
}

export interface EventoSanitarioFilters {
  idAnimal?: number;
  idTipoEvento?: number;
  estado?: EstadoRegistro | 'TODOS';
}

export interface CalendarioSanitarioFilters {
  idAnimal?: number;
  estado?: EstadoCalendario | 'TODOS';
}

export interface CreateEventoSanitarioInput {
  idAnimal: number;
  idTipoEvento: number;
  fechaEvento: string;
  diagnostico?: string;
  medicamento?: string;
  dosis?: string;
}

export interface UpdateEventoSanitarioInput {
  idTipoEvento?: number;
  fechaEvento?: string;
  diagnostico?: string;
  medicamento?: string;
  dosis?: string;
}

export interface AprobarEventoInput {
  estadoAprobacion: Exclude<EstadoRegistro, 'PENDIENTE'>;
}

export interface CreateCalendarioInput {
  idAnimal: number;
  idTipoEvento: number;
  fechaProgramada: string;
  fechaAlerta?: string;
}

export interface UpdateCalendarioInput {
  idTipoEvento?: number;
  fechaProgramada?: string;
  fechaAlerta?: string | null;
}

export interface CompletarCalendarioInput {
  estado: Exclude<EstadoCalendario, 'PENDIENTE'>;
}

