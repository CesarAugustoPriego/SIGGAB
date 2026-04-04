import { httpClient } from '@/src/lib/http-client';
import type { SessionUser } from '@/src/lib/session-storage';

export interface LoginInput {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: SessionUser;
}

interface MeResponse {
  idUsuario: number;
  nombreCompleto: string;
  username: string;
  idRol: number;
  activo: boolean;
  rol?: {
    idRol: number;
    nombreRol: string;
    descripcion?: string | null;
  };
}

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

export const authApi = {
  login: (payload: LoginInput) => httpClient.post<LoginResponse>('/auth/login', payload, false),
  me: () => httpClient.get<MeResponse>('/auth/me', true),
  refresh: (refreshToken: string) => httpClient.post<RefreshResponse>('/auth/refresh', { refreshToken }, false),
  logout: (refreshToken: string, accessTokenOverride?: string) => httpClient.post<null>(
    '/auth/logout',
    { refreshToken },
    true,
    {
      accessTokenOverride,
      retryOn401: false,
      timeoutMs: 6000,
    }
  ),
};
