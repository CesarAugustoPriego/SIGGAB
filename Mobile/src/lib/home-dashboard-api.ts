import { httpClient } from './http-client';

export interface HomeStats {
  /** Total de animales activos visibles para el rol. */
  totalHato: number;
  /** Etiqueta dinamica para el segundo stat. */
  secondLabel: string;
  /** Valor del segundo stat. */
  secondValue: number;
  /** Aviso no bloqueante cuando alguna metrica no pudo cargarse. */
  warning?: string;
}

interface ResumenPayload {
  totalAnimalesActivos?: number;
  alertasProximas7Dias?: number;
}

interface SanitarioPayload {
  proximosEventos?: unknown[];
}

interface InventarioPayload {
  agotados?: unknown[];
}

interface ProduccionPayload {
  leche?: { totalRegistros?: number };
}

function normalizeRole(rol: string | undefined) {
  return (rol || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function fetchActiveAnimalCount(): Promise<number> {
  const animales = await httpClient.get<unknown[]>('/animales?estado=ACTIVO');
  return Array.isArray(animales) ? animales.length : 0;
}

async function fetchStatsForAdmin(): Promise<HomeStats> {
  try {
    const data = await httpClient.get<ResumenPayload>('/dashboard/resumen');
    return {
      totalHato: data.totalAnimalesActivos ?? 0,
      secondLabel: 'ALERTAS (7 DIAS)',
      secondValue: data.alertasProximas7Dias ?? 0,
    };
  } catch {
    return {
      totalHato: 0,
      secondLabel: 'ALERTAS (7 DIAS)',
      secondValue: 0,
      warning: 'No se pudieron cargar las metricas generales.',
    };
  }
}

async function fetchStatsForVeterinario(): Promise<HomeStats> {
  const [hato, sanitario] = await Promise.allSettled([
    fetchActiveAnimalCount(),
    httpClient.get<SanitarioPayload>('/dashboard/sanitario'),
  ]);

  return {
    totalHato: hato.status === 'fulfilled' ? hato.value : 0,
    secondLabel: 'PROXIMOS EVENTOS',
    secondValue: sanitario.status === 'fulfilled'
      ? (sanitario.value.proximosEventos?.length ?? 0)
      : 0,
    warning: hato.status === 'rejected' || sanitario.status === 'rejected'
      ? 'No se pudieron cargar todas las metricas sanitarias.'
      : undefined,
  };
}

async function fetchStatsForProduccion(): Promise<HomeStats> {
  const [hato, produccion] = await Promise.allSettled([
    fetchActiveAnimalCount(),
    httpClient.get<ProduccionPayload>('/dashboard/produccion'),
  ]);

  return {
    totalHato: hato.status === 'fulfilled' ? hato.value : 0,
    secondLabel: 'REGISTROS (30d)',
    secondValue: produccion.status === 'fulfilled'
      ? (produccion.value.leche?.totalRegistros ?? 0)
      : 0,
    warning: hato.status === 'rejected' || produccion.status === 'rejected'
      ? 'No se pudieron cargar todas las metricas productivas.'
      : undefined,
  };
}

async function fetchStatsForCampo(): Promise<HomeStats> {
  try {
    const totalHato = await fetchActiveAnimalCount();
    return {
      totalHato,
      secondLabel: 'CAPTURA ACTIVA',
      secondValue: totalHato,
    };
  } catch {
    return {
      totalHato: 0,
      secondLabel: 'CAPTURA ACTIVA',
      secondValue: 0,
      warning: 'No se pudieron cargar las metricas de campo.',
    };
  }
}

async function fetchStatsForAlmacen(): Promise<HomeStats> {
  try {
    const data = await httpClient.get<InventarioPayload>('/dashboard/inventario');
    return {
      totalHato: 0,
      secondLabel: 'INSUMOS AGOTADOS',
      secondValue: data.agotados?.length ?? 0,
    };
  } catch {
    return {
      totalHato: 0,
      secondLabel: 'INSUMOS AGOTADOS',
      secondValue: 0,
      warning: 'No se pudieron cargar las metricas de inventario.',
    };
  }
}

export async function fetchHomeStats(rol: string | undefined): Promise<HomeStats> {
  const r = normalizeRole(rol);

  if (r === 'administrador' || r === 'propietario') {
    return fetchStatsForAdmin();
  }

  if (r === 'medico veterinario' || r === 'veterinario') {
    return fetchStatsForVeterinario();
  }

  if (r === 'produccion') {
    return fetchStatsForProduccion();
  }

  if (r === 'campo') {
    return fetchStatsForCampo();
  }

  if (r === 'almacen') {
    return fetchStatsForAlmacen();
  }

  return {
    totalHato: 0,
    secondLabel: 'SIN METRICAS',
    secondValue: 0,
    warning: 'No hay metricas configuradas para este rol.',
  };
}
