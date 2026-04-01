import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ApiClientError } from '../../types/api';
import { authApi, type LoginInput } from './auth-api';
import {
  clearSession,
  readSession,
  writeSession,
  type AuthSession,
  type SessionUser,
} from '../../lib/auth-storage';

type AuthStatus = 'booting' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  apiError: string | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearApiError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toSessionUserFromMe(me: Awaited<ReturnType<typeof authApi.me>>): SessionUser {
  return {
    idUsuario: me.idUsuario,
    nombreCompleto: me.nombreCompleto,
    username: me.username,
    rol: me.rol?.nombreRol,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 423) return 'Cuenta bloqueada temporalmente por seguridad. Intenta mas tarde.';
    if (error.status === 401) return 'Credenciales invalidas o sesion expirada.';
    if (error.status === 403) return 'Tu rol no tiene permisos para esta accion.';
    if (error.status === 400) return 'Datos incompletos o invalidos.';
    if (error.status === 0) return 'No hay conexion con el backend.';
    return error.message;
  }

  return 'Ocurrio un error inesperado.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialSession = readSession();

  const [status, setStatus] = useState<AuthStatus>(initialSession ? 'booting' : 'unauthenticated');
  const [session, setSession] = useState<AuthSession | null>(initialSession);
  const [apiError, setApiError] = useState<string | null>(null);

  const sessionRef = useRef<AuthSession | null>(initialSession);

  const applySession = useCallback((nextSession: AuthSession | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);

    if (nextSession) {
      writeSession(nextSession);
      setStatus('authenticated');
      return;
    }

    clearSession();
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const refreshProfile = useCallback(async () => {
    const currentSession = sessionRef.current;

    if (!currentSession) {
      setStatus('unauthenticated');
      return;
    }

    try {
      const me = await authApi.me();
      const latestSession = sessionRef.current;

      // Evita rehidratar sesion si se cerro mientras la peticion estaba en vuelo.
      if (!latestSession || latestSession.refreshToken !== currentSession.refreshToken) {
        return;
      }

      applySession({
        ...latestSession,
        user: toSessionUserFromMe(me),
      });
      setApiError(null);
    } catch (error) {
      setApiError(getErrorMessage(error));

      if (error instanceof ApiClientError && error.status === 401) {
        applySession(null);
      }

      throw error;
    }
  }, [applySession]);

  useEffect(() => {
    if (!initialSession) {
      setStatus('unauthenticated');
      return;
    }

    void refreshProfile().catch(() => {
      // El estado se gestiona dentro de refreshProfile.
    });
  }, [initialSession, refreshProfile]);

  const login = useCallback(async (input: LoginInput) => {
    try {
      const data = await authApi.login(input);

      applySession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.usuario,
      });
      setApiError(null);
    } catch (error) {
      setApiError(getErrorMessage(error));
      throw error;
    }
  }, [applySession]);

  const logout = useCallback(async () => {
    const currentSession = sessionRef.current;

    // Primero cerramos sesion en cliente para que la UI responda de inmediato.
    applySession(null);
    setApiError(null);

    if (!currentSession?.refreshToken) {
      return;
    }

    try {
      await authApi.logout(currentSession.refreshToken, currentSession.accessToken);
    } catch {
      // Logout remoto best-effort.
    }
  }, [applySession]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user: session?.user || null,
    apiError,
    login,
    logout,
    refreshProfile,
    clearApiError: () => setApiError(null),
  }), [status, session, apiError, login, logout, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
