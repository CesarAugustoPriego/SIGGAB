import { httpClient } from '../../lib/http-client';
import type {
  CreateUsuarioInput,
  Rol,
  UpdateUsuarioInput,
  Usuario,
} from './users-types';

export const usersApi = {
  getRoles: () => httpClient.get<Rol[]>('/usuarios/roles'),
  getUsuarios: () => httpClient.get<Usuario[]>('/usuarios'),
  createUsuario: (payload: CreateUsuarioInput) => httpClient.post<Usuario>('/usuarios', payload),
  updateUsuario: (idUsuario: number, payload: UpdateUsuarioInput) => httpClient.patch<Usuario>(`/usuarios/${idUsuario}`, payload),
  updateEstadoUsuario: (idUsuario: number, activo: boolean) => httpClient.patch<Usuario>(`/usuarios/${idUsuario}/estado`, { activo }),
};
