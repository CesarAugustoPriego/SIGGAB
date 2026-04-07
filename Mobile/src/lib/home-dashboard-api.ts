import { httpClient } from './http-client';

// ── Tipos de retorno por endpoint ─────────────────────────────────────────

export interface HomeStats {
  /** Total de animales con estadoActual = ACTIVO */
  totalHato: number;
  /** Etiqueta dinámica para el segundo stat */
  secondLabel: string;
  /** Valor del segundo stat */
  secondValue: number;
}

interface ResumenPayload {
  totalAnimalesActivos?: number;
  alertasProximas7Dias?: number;
  pesosPendientesValidar?: number;
  solicitudesCompraPendientes?: number;
  insumosStockAgotado?: number;
}

interface GanadoPayload {
  porEstado?: { estadoActual: string; _count: { idAnimal: number } }[];
}

interface SanitarioPayload {
  proximosEventos?: unknown[];
  pendientesAprobacion?: unknown[];
}

interface InventarioPayload {
  agotados?: unknown[];
  bajoStock?: unknown[];
}

interface ProduccionPayload {
  leche?: { totalRegistros?: number };
  peso?: { totalRegistros?: number };
}

// ── Helper: cuenta animales activos vía /dashboard/ganado ─────────────────
async function fetchTotalHatoFromGanado(): Promise<number> {
  try {
    const data = await httpClient.get<GanadoPayload>('/dashboard/ganado');
    const activos = data.porEstado?.find((e) => e.estadoActual === 'ACTIVO');
    return activos?._count?.idAnimal ?? 0;
  } catch {
    return 0;
  }
}

// ── Stats para cada rol ───────────────────────────────────────────────────

/** Administrador / Propietario — usan /dashboard/resumen */
async function fetchStatsForAdmin(): Promise<HomeStats> {
  try {
    const data = await httpClient.get<ResumenPayload>('/dashboard/resumen');
    return {
      totalHato: data.totalAnimalesActivos ?? 0,
      secondLabel: 'ALERTAS (7 DÍAS)',
      secondValue: data.alertasProximas7Dias ?? 0,
    };
  } catch {
    return { totalHato: 0, secondLabel: 'ALERTAS (7 DÍAS)', secondValue: 0 };
  }
}

/** Veterinario — usa /dashboard/sanitario para segundo stat */
async function fetchStatsForVeterinario(): Promise<HomeStats> {
  const [hato, sanitario] = await Promise.allSettled([
    fetchTotalHatoFromGanado(),
    httpClient.get<SanitarioPayload>('/dashboard/sanitario'),
  ]);

  const totalHato = hato.status === 'fulfilled' ? hato.value : 0;
  const pendientes =
    sanitario.status === 'fulfilled'
      ? (sanitario.value.proximosEventos?.length ?? 0)
      : 0;

  return { totalHato, secondLabel: 'PRÓXIMOS EVENTOS', secondValue: pendientes };
}

/** Producción / Campo — usa /dashboard/produccion para segundo stat */
async function fetchStatsForProduccion(): Promise<HomeStats> {
  const [hato, produccion] = await Promise.allSettled([
    fetchTotalHatoFromGanado(),
    httpClient.get<ProduccionPayload>('/dashboard/produccion'),
  ]);

  const totalHato = hato.status === 'fulfilled' ? hato.value : 0;
  const registros =
    produccion.status === 'fulfilled'
      ? (produccion.value.leche?.totalRegistros ?? 0)
      : 0;

  return { totalHato, secondLabel: 'REGISTROS (30d)', secondValue: registros };
}

/** Almacén — usa /dashboard/inventario para segundo stat (insumos agotados) */
async function fetchStatsForAlmacen(): Promise<HomeStats> {
  try {
    const data = await httpClient.get<InventarioPayload>('/dashboard/inventario');
    return {
      totalHato: 0,
      secondLabel: 'INSUMOS AGOTADOS',
      secondValue: data.agotados?.length ?? 0,
    };
  } catch {
    return { totalHato: 0, secondLabel: 'INSUMOS AGOTADOS', secondValue: 0 };
  }
}

// ── Función principal: elige el endpoint correcto según el rol ─────────────
function normalizeRole(rol: string | undefined) {
  return (rol || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export async function fetchHomeStats(rol: string | undefined): Promise<HomeStats> {
  const r = normalizeRole(rol);

  if (r === 'administrador' || r === 'propietario') {
    return fetchStatsForAdmin();
  }
  if (r === 'medico veterinario' || r === 'veterinario') {
    return fetchStatsForVeterinario();
  }
  if (r === 'produccion' || r === 'campo') {
    return fetchStatsForProduccion();
  }
  if (r === 'almacen') {
    return fetchStatsForAlmacen();
  }

  // Fallback: solo total hato
  const totalHato = await fetchTotalHatoFromGanado().catch(() => 0);
  return { totalHato, secondLabel: 'ACTIVOS', secondValue: totalHato };
}
