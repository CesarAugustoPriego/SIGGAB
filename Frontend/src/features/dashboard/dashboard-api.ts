import { httpClient } from '../../lib/http-client';
import type {
  DashboardResumen,
  DashboardGanado,
  DashboardProduccion,
  DashboardSanitario,
  DashboardInventario,
  BitacoraEntry,
} from './dashboard-types';

export const dashboardApi = {
  getResumen: () => httpClient.get<DashboardResumen>('/dashboard/resumen'),
  getGanado: () => httpClient.get<DashboardGanado>('/dashboard/ganado'),
  getProduccion: () => httpClient.get<DashboardProduccion>('/dashboard/produccion'),
  getSanitario: () => httpClient.get<DashboardSanitario>('/dashboard/sanitario'),
  getInventario: () => httpClient.get<DashboardInventario>('/dashboard/inventario'),
  getBitacora: (limit = 100) => httpClient.get<BitacoraEntry[]>(`/dashboard/bitacora?limit=${limit}`),
};
