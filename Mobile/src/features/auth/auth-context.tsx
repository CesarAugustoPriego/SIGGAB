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

import { ApiClientError } from '@/src/types/api';
import {
  clearSession,
  readSession,
  writeSession,
  type AuthSession,
  type SessionUser,
} from '@/src/lib/session-storage';

import { authApi, type LoginInput } from './auth-api';
import { setupPushNotifications } from '@/src/lib/notifications';

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
    if (error.status === 0) return 'No fue posible conectar con el backend.';
    if (error.status === 423) return 'Cuenta bloqueada temporalmente por seguridad.';
    if (error.status === 400) return 'Datos incompletos o inválidos.';
    if (error.status === 401) return 'Credenciales inválidas o sesión expirada.';
    if (error.status === 403) return 'Tu rol no tiene permisos para esta acción.';
    return error.message;
  }

  return 'Ocurrió un error inesperado.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('booting');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const sessionRef = useRef<AuthSession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const applySession = useCallback(async (nextSession: AuthSession | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);

    if (nextSession) {
      await writeSession(nextSession);
      setStatus('authenticated');
      return;
    }

    await clearSession();
    setStatus('unauthenticated');
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentSession = sessionRef.current;

    if (!currentSession) {
      setStatus('unauthenticated');
      return;
    }

    try {
      const me = await authApi.me();
      const latestSession = sessionRef.current;

      if (!latestSession || latestSession.refreshToken !== currentSession.refreshToken) {
        return;
      }

      await applySession({
        ...latestSession,
        user: toSessionUserFromMe(me),
      });
      setApiError(null);
    } catch (error) {
      setApiError(getErrorMessage(error));

      if (error instanceof ApiClientError && error.status === 401) {
        await applySession(null);
      }

      throw error;
    }
  }, [applySession]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const storedSession = await readSession();

      if (!active) return;

      if (!storedSession) {
        setStatus('unauthenticated');
        return;
      }

      sessionRef.current = storedSession;
      setSession(storedSession);
      setStatus('authenticated');

      try {
        await refreshProfile();
      } catch {
        // Error gestionado en refreshProfile
      }
    })();

    return () => {
      active = false;
    };
  }, [refreshProfile]);

  const login = useCallback(async (input: LoginInput) => {
    try {
      const data = await authApi.login(input);

      await applySession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.usuario,
      });

      // Si es un rol autorizado, intentamos recolectar token de notificaciones push
      try {
        const token = await setupPushNotifications();
        if (token) {
          // Send silently to the backend inside a setTimeout or async wrap 
          // so we don't delay the UI transition for the dashboard
          setTimeout(() => {
             authApi.updatePushToken(token).catch(e => console.log('Silenced push push error:', e));
          }, 500);
        }
      } catch (e) {
        console.log('Setup push failed automatically: ', e);
      }
      
      setApiError(null);
    } catch (error) {
      setApiError(getErrorMessage(error));
      throw error;
    }
  }, [applySession]);

  const logout = useCallback(async () => {
    const currentSession = sessionRef.current;

    await applySession(null);
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
  }), [status, session?.user, apiError, login, logout, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
