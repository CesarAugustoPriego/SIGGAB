export type EstadoAprobacionSanitaria = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type EstadoCalendarioSanitario = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';

export interface AnimalRef {
  idAnimal: number;
  numeroArete: string;
}

export interface TipoEventoSanitario {
  idTipoEvento: number;
  nombreTipo: string;
  activo?: boolean;
}

export interface UsuarioRef {
  idUsuario: number;
  nombreCompleto: string;
}

export interface EventoSanitario {
  idEvento: number;
  idAnimal: number;
  idTipoEvento: number;
  fechaEvento: string;
  diagnostico: string | null;
  medicamento: string | null;
  dosis: string | null;
  estadoAprobacion: EstadoAprobacionSanitaria;
  autorizadoPor: number | null;
  animal?: AnimalRef;
  tipoEvento?: TipoEventoSanitario;
  autorizador?: UsuarioRef | null;
}

export interface CalendarioSanitario {
  idCalendario: number;
  idAnimal: number;
  idTipoEvento: number;
  fechaProgramada: string;
  fechaAlerta: string | null;
  programadoPor: number | null;
  estado: EstadoCalendarioSanitario;
  animal?: AnimalRef;
  tipoEvento?: TipoEventoSanitario;
  programador?: UsuarioRef | null;
}

export interface EventoSanitarioFilters {
  idAnimal?: number;
  idTipoEvento?: number;
  estadoAprobacion?: EstadoAprobacionSanitaria;
}

export interface CalendarioSanitarioFilters {
  idAnimal?: number;
  estado?: EstadoCalendarioSanitario;
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

export interface AprobarEventoSanitarioInput {
  estadoAprobacion: Extract<EstadoAprobacionSanitaria, 'APROBADO' | 'RECHAZADO'>;
}

export interface CreateCalendarioSanitarioInput {
  idAnimal: number;
  idTipoEvento: number;
  fechaProgramada: string;
  fechaAlerta?: string;
}

export interface UpdateCalendarioSanitarioInput {
  idTipoEvento?: number;
  fechaProgramada?: string;
  fechaAlerta?: string | null;
}

export interface CompletarCalendarioSanitarioInput {
  estado: Extract<EstadoCalendarioSanitario, 'COMPLETADO' | 'CANCELADO'>;
}
