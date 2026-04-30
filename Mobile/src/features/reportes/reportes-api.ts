import { httpClient } from '@/src/lib/http-client';

import type {
  ModuloComparativoFechas,
  ReporteComparativoFechas,
  ReporteInventario,
  ReportePerdidas,
  ReportePerdidasComparativo,
  ReporteProductividad,
  ReporteSanitarioHato,
} from './reportes-types';

type QueryValue = string | number | undefined;

export interface FechaFilters {
  fechaInicio?: string;
  fechaFin?: string;
}

export interface PeriodoFilters {
  periodoAInicio: string;
  periodoAFin: string;
  periodoBInicio: string;
  periodoBFin: string;
}

function buildQuery(params: Record<string, QueryValue>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const reportesApi = {
  getInventario: (filters: FechaFilters & { categoria?: string } = {}) => {
    const query = buildQuery({ ...filters, formato: 'json' });
    return httpClient.get<ReporteInventario>(`/reportes/inventario${query}`);
  },

  getSanitarioHato: (filters: FechaFilters & { estado?: 'SANO' | 'EN_TRATAMIENTO' | 'ENFERMO' } = {}) => {
    const query = buildQuery({ ...filters, formato: 'json' });
    return httpClient.get<ReporteSanitarioHato>(`/reportes/sanitario-hato${query}`);
  },

  getSanitarioComparativo: (filters: PeriodoFilters) => {
    const query = buildQuery({ ...filters, formato: 'json' });
    return httpClient.get<ReporteComparativoFechas>(`/reportes/sanitario-comparativo${query}`);
  },

  getProductividad: (filters: FechaFilters & { edadMinimaMeses?: number } = {}) => {
    const query = buildQuery({ ...filters, formato: 'json' });
    return httpClient.get<ReporteProductividad>(`/reportes/productividad${query}`);
  },

  getComparativoFechas: (filters: PeriodoFilters & { modulo: ModuloComparativoFechas; edadMinimaMeses?: number }) => {
    const query = buildQuery({ ...filters, formato: 'json' });
    return httpClient.get<ReporteComparativoFechas>(`/reportes/comparativo-fechas${query}`);
  },

  getPerdidas: (filters: FechaFilters & { motivo?: string } = {}) => {
    const query = buildQuery({ ...filters, formato: 'json' });
    return httpClient.get<ReportePerdidas>(`/reportes/perdidas${query}`);
  },

  getPerdidasComparativo: (filters: PeriodoFilters) => {
    const query = buildQuery({ ...filters, formato: 'json' });
    return httpClient.get<ReportePerdidasComparativo>(`/reportes/perdidas-comparativo${query}`);
  },
};

export function reportEndpoint(path: string, params: Record<string, QueryValue>) {
  return `${path}${buildQuery(params)}`;
}
