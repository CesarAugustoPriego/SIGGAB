import { env } from '../../config/env';
import { readSession } from '../../lib/auth-storage';
import { httpClient } from '../../lib/http-client';
import { ApiClientError, type ApiErrorPayload } from '../../types/api';
import type { BackupDownloadResult, BackupExecutionResult, BackupListItem } from './respaldos-types';

function extractFileName(contentDispositionHeader: string | null) {
  if (!contentDispositionHeader) return null;

  const utf8Match = contentDispositionHeader.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/"/g, ''));
    } catch {
      return utf8Match[1].replace(/"/g, '');
    }
  }

  const simpleMatch = contentDispositionHeader.match(/filename="?([^"]+)"?/i);
  return simpleMatch?.[1] || null;
}

async function parseErrorResponse(response: Response) {
  let payload: ApiErrorPayload | null = null;

  try {
    const parsed = (await response.json()) as ApiErrorPayload;
    if (parsed && parsed.success === false) {
      payload = parsed;
    }
  } catch {
    payload = null;
  }

  const message = payload?.message || `Error HTTP ${response.status}`;
  return new ApiClientError(message, response.status, payload);
}

async function downloadBackupFile(fileName: string): Promise<BackupDownloadResult> {
  const session = readSession();
  const headers: Record<string, string> = {};

  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const encodedFileName = encodeURIComponent(fileName);

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}/respaldos/${encodedFileName}/descargar`, {
      method: 'GET',
      headers,
    });
  } catch {
    throw new ApiClientError('No fue posible conectar con el backend', 0);
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const blob = await response.blob();
  return {
    blob,
    fileName: extractFileName(response.headers.get('content-disposition')) || fileName,
  };
}

export const respaldosApi = {
  getRespaldos: () => httpClient.get<BackupListItem[]>('/respaldos'),
  ejecutarRespaldoManual: () => httpClient.post<BackupExecutionResult>('/respaldos/ejecutar'),
  descargarRespaldo: (fileName: string) => downloadBackupFile(fileName),
};
