export interface Rol {
  idRol: number;
  nombreRol: string;
  descripcion?: string | null;
}

export interface Usuario {
  idUsuario: number;
  nombreCompleto: string;
  username: string;
  idRol: number;
  activo: boolean;
  intentosFallidos: number;
  bloqueadoHasta: string | null;
  fechaCreacion: string;
  rol: Rol;
}

export interface CreateUsuarioInput {
  nombreCompleto: string;
  username: string;
  password: string;
  idRol: number;
}

export interface UpdateUsuarioInput {
  nombreCompleto?: string;
  username?: string;
  password?: string;
  idRol?: number;
}
