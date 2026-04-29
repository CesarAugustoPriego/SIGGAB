import { env } from '../../config/env';
import { readSession } from '../../lib/auth-storage';
import { httpClient } from '../../lib/http-client';
import { ApiClientError, type ApiErrorPayload } from '../../types/api';
import type {
  DownloadFormat,
  ReportDownload,
  ReporteAdministrativo,
  ReporteAdministrativoFilters,
  ReporteComparativo,
  ReporteComparativoFilters,
  ReporteProductivo,
  ReporteProductivoFilters,
  ReporteSanitario,
  ReporteSanitarioFilters,
} from './reportes-types';

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

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

async function downloadReport(
  path: string,
  query: Record<string, string | number | undefined>,
  format: DownloadFormat,
  fallbackFileName: string,
): Promise<ReportDownload> {
  const session = readSession();
  const headers: Record<string, string> = {};

  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const queryString = buildQuery({
    ...query,
    formato: format,
  });

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}${queryString}`, {
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
  const fileName = extractFileName(response.headers.get('content-disposition'))
    || `${fallbackFileName}.${format}`;

  return { blob, fileName };
}

export const reportesApi = {
  getSanitario: (filters: ReporteSanitarioFilters = {}) => {
    const query = buildQuery({
      fechaInicio: filters.fechaInicio,
      fechaFin: filters.fechaFin,
      estadoAprobacion: filters.estadoAprobacion,
      idTipoEvento: filters.idTipoEvento,
      formato: 'json',
    });
    return httpClient.get<ReporteSanitario>(`/reportes/sanitario${query}`);
  },

  getProductivo: (filters: ReporteProductivoFilters = {}) => {
    const query = buildQuery({
      fechaInicio: filters.fechaInicio,
      fechaFin: filters.fechaFin,
      idAnimal: filters.idAnimal,
      formato: 'json',
    });
    return httpClient.get<ReporteProductivo>(`/reportes/productivo${query}`);
  },

  getAdministrativo: (filters: ReporteAdministrativoFilters = {}) => {
    const query = buildQuery({
      fechaInicio: filters.fechaInicio,
      fechaFin: filters.fechaFin,
      formato: 'json',
    });
    return httpClient.get<ReporteAdministrativo>(`/reportes/administrativo${query}`);
  },

  getComparativo: (filters: ReporteComparativoFilters) => {
    const query = buildQuery({
      modulo: filters.modulo,
      periodoAInicio: filters.periodoAInicio,
      periodoAFin: filters.periodoAFin,
      periodoBInicio: filters.periodoBInicio,
      periodoBFin: filters.periodoBFin,
      formato: 'json',
    });
    return httpClient.get<ReporteComparativo>(`/reportes/comparativo${query}`);
  },

  downloadSanitario: (filters: ReporteSanitarioFilters, format: DownloadFormat) => (
    downloadReport(
      '/reportes/sanitario',
      {
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
        estadoAprobacion: filters.estadoAprobacion,
        idTipoEvento: filters.idTipoEvento,
      },
      format,
      'reporte-sanitario',
    )
  ),

  downloadProductivo: (filters: ReporteProductivoFilters, format: DownloadFormat) => (
    downloadReport(
      '/reportes/productivo',
      {
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
        idAnimal: filters.idAnimal,
      },
      format,
      'reporte-productivo',
    )
  ),

  downloadAdministrativo: (filters: ReporteAdministrativoFilters, format: DownloadFormat) => (
    downloadReport(
      '/reportes/administrativo',
      {
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
      },
      format,
      'reporte-administrativo',
    )
  ),

  downloadComparativo: (filters: ReporteComparativoFilters, format: DownloadFormat) => (
    downloadReport(
      '/reportes/comparativo',
      {
        modulo: filters.modulo,
        periodoAInicio: filters.periodoAInicio,
        periodoAFin: filters.periodoAFin,
        periodoBInicio: filters.periodoBInicio,
        periodoBFin: filters.periodoBFin,
      },
      format,
      'reporte-comparativo',
    )
  ),
};
