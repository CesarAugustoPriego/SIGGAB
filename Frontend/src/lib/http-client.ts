import { env } from '../config/env';
import { clearSession, readSession, writeSession } from './auth-storage';
import type { ApiEnvelope, ApiErrorPayload } from '../types/api';
import { ApiClientError } from '../types/api';

const JSON_CONTENT_TYPE = 'application/json';
const AUTH_PATHS_WITHOUT_BEARER = new Set(['/auth/login', '/auth/refresh']);
const DEFAULT_TIMEOUT_MS = 15000;

interface RefreshTokens {
  accessToken: string;
  refreshToken?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  withAuth?: boolean;
  retryOn401?: boolean;
  headers?: Record<string, string>;
  accessTokenOverride?: string;
  timeoutMs?: number;
}

type PublicRequestOptions = Omit<RequestOptions, 'method' | 'body' | 'withAuth'>;

async function parseJsonResponse(response: Response): Promise<ApiEnvelope<unknown> | null> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes(JSON_CONTENT_TYPE)) {
    return null;
  }

  try {
    return (await response.json()) as ApiEnvelope<unknown>;
  } catch {
    return null;
  }
}

async function fetchNewAccessToken(refreshToken: string): Promise<RefreshTokens | null> {
  const response = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': JSON_CONTENT_TYPE,
    },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok || !payload || !payload.success || !payload.data) {
    return null;
  }

  const tokenData = payload.data as { accessToken?: string; refreshToken?: string };

  if (!tokenData.accessToken) {
    return null;
  }

  return {
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
  };
}

function buildHeaders(path: string, withAuth: boolean, accessToken: string | undefined, customHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    'Content-Type': JSON_CONTENT_TYPE,
    ...(customHeaders || {}),
  };

  if (withAuth && accessToken && !AUTH_PATHS_WITHOUT_BEARER.has(path)) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

async function executeRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    withAuth = true,
    retryOn401 = true,
    headers,
    accessTokenOverride,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const session = readSession();
  const accessToken = accessTokenOverride || session?.accessToken;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers: buildHeaders(path, withAuth, accessToken, headers),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await parseJsonResponse(response);

    if (response.ok) {
      if (!payload || !payload.success) {
        throw new ApiClientError('Respuesta invalida del servidor', response.status);
      }
      return payload.data as T;
    }

    const apiErrorPayload = (payload && !payload.success ? payload : null) as ApiErrorPayload | null;

    if (
      response.status === 401
      && retryOn401
      && withAuth
      && session?.refreshToken
      && !AUTH_PATHS_WITHOUT_BEARER.has(path)
    ) {
      const refreshedTokens = await fetchNewAccessToken(session.refreshToken);

      if (refreshedTokens?.accessToken) {
        writeSession({
          ...session,
          accessToken: refreshedTokens.accessToken,
          refreshToken: refreshedTokens.refreshToken || session.refreshToken,
        });

        return executeRequest<T>(path, {
          ...options,
          retryOn401: false,
        });
      }

      clearSession();
    }

    const message = apiErrorPayload?.message || `Error HTTP ${response.status}`;
    throw new ApiClientError(message, response.status, apiErrorPayload);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError('Tiempo de espera agotado al conectar con el backend', 0);
    }

    throw new ApiClientError('No fue posible conectar con el backend', 0);
  } finally {
    clearTimeout(timeout);
  }
}

export const httpClient = {
  get: <T>(path: string, withAuth = true, options: PublicRequestOptions = {}) => executeRequest<T>(path, {
    method: 'GET',
    withAuth,
    ...options,
  }),
  post: <T>(path: string, body?: unknown, withAuth = true, options: PublicRequestOptions = {}) => executeRequest<T>(path, {
    method: 'POST',
    body,
    withAuth,
    ...options,
  }),
  patch: <T>(path: string, body?: unknown, withAuth = true, options: PublicRequestOptions = {}) => executeRequest<T>(path, {
    method: 'PATCH',
    body,
    withAuth,
    ...options,
  }),
};
