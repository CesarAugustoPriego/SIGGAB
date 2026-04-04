import * as SecureStore from 'expo-secure-store';

export interface SessionUser {
  idUsuario: number;
  nombreCompleto: string;
  username: string;
  rol?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

const STORAGE_KEY = 'siggab.auth.session.v1';

export async function readSession(): Promise<AuthSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function writeSession(session: AuthSession): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Persistencia best-effort para no bloquear la UI.
  }
}

export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // Persistencia best-effort para no bloquear la UI.
  }
}
