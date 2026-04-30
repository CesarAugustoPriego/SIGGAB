import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../auth/auth-context';
import { getVisibleNavItemsForRole } from '../../auth/navigation-utils';
import { Button, NAV_ITEMS, LogOut } from '../../../shared/ui';
import { ApiClientError } from '../../../types/api';
import { reportesApi } from '../reportes-api';
import type {
  DownloadFormat,
  ModuloComparativoFechas,
  ReporteComparativoFechas,
  ReporteInventario,
  ReportePerdidas,
  ReportePerdidasComparativo,
  ReporteProductividad,
  ReporteSanitarioComparativo,
  ReporteSanitarioHato,
} from '../reportes-types';
import {
  canViewReporteComparativo,
  canViewReporteInventario,
  canViewReportePerdidas,
  canViewReporteProductivo,
  canViewReporteSanitario,
  canViewReportes,
  formatDecimal,
  formatNumber,
  getDaysAgoInputDate,
  getReportesErrorMessage,
  getTodayInputDate,
  isValidDateRange,
  saveBlobAsFile,
} from '../reportes-utils';

interface ReportesPageProps {
  onGoHome: () => void;
  onGoUsersAdmin?: () => void;
  onNavigateModule?: (moduleName: string) => void;
}

type TabKey =
  | 'inventario'
  | 'sanitario'
  | 'sanitario-comparativo'
  | 'productividad'
  | 'comparativo-fechas'
  | 'perdidas'
  | 'perdidas-comparativo';

interface UiMessage {
  type: 'error' | 'success';
  text: string;
}

interface TabConfig {
  key: TabKey;
  label: string;
}

const COLORS = {
  blue: '#2563EB',
  green: '#15803D',
  amber: '#D97706',
  red: '#B91C1C',
  purple: '#6D28D9',
  teal: '#0F766E',
};

const CHART_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.red, COLORS.purple, COLORS.teal];
const DEFAULT_FECHA_FIN = getTodayInputDate();
const DEFAULT_FECHA_INICIO = getDaysAgoInputDate(30);
const DEFAULT_PERIODO_A_INICIO = getDaysAgoInputDate(60);
const DEFAULT_PERIODO_A_FIN = getDaysAgoInputDate(31);
const DEFAULT_PERIODO_B_INICIO = getDaysAgoInputDate(30);
const DEFAULT_PERIODO_B_FIN = getTodayInputDate();

function getMessageClass(type: UiMessage['type']) {
  return type === 'success' ? 'users-message users-message--success' : 'users-message users-message--error';
}

function toNumber(value: number | string | null | undefined) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatMetric(value: number | string | null | undefined, unit = '') {
  const numeric = toNumber(value);
  const display = Number.isInteger(numeric) ? formatNumber(numeric) : formatDecimal(numeric, 2);
  return unit ? `${display} ${unit}` : display;
}

function inventoryStatusColor(status: string) {
  if (status === 'CRITICO') return COLORS.red;
  if (status === 'BAJO') return COLORS.amber;
  return COLORS.green;
}

function sanitaryStatusColor(status: string) {
  if (status === 'ENFERMO') return COLORS.red;
  if (status === 'EN_TRATAMIENTO') return COLORS.amber;
  return COLORS.green;
}

function lossReasonColor(reason: string, index = 0) {
  const normalized = reason.toLowerCase();
  if (normalized.includes('enfermedad')) return COLORS.blue;
  if (normalized.includes('accidente')) return COLORS.green;
  if (normalized.includes('venta')) return COLORS.amber;
  if (normalized.includes('muerte')) return COLORS.red;
  if (normalized.includes('transfer')) return COLORS.purple;
  return CHART_COLORS[index % CHART_COLORS.length];
}

function sanitizeDownloadFilters<T extends Record<string, unknown>>(filters: T) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined)) as T;
}

function KpiCard({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' }) {
  return (
    <article className={`reportes-metric reportes-metric--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function DateRangeFields({
  start,
  end,
  onStart,
  onEnd,
}: {
  start: string;
  end: string;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
}) {
  return (
    <div className="productivo-field-row">
      <label className="productivo-field">
        <span>Inicio</span>
        <input type="date" value={start} onChange={(event) => onStart(event.target.value)} />
      </label>
      <label className="productivo-field">
        <span>Fin</span>
        <input type="date" value={end} onChange={(event) => onEnd(event.target.value)} />
      </label>
    </div>
  );
}

function PeriodFields({
  filters,
  onChange,
}: {
  filters: {
    periodoAInicio: string;
    periodoAFin: string;
    periodoBInicio: string;
    periodoBFin: string;
  };
  onChange: (next: Partial<typeof filters>) => void;
}) {
  return (
    <div className="reportes-period-grid">
      <article className="reportes-period-card">
        <h3>Periodo 1</h3>
        <DateRangeFields
          start={filters.periodoAInicio}
          end={filters.periodoAFin}
          onStart={(value) => onChange({ periodoAInicio: value })}
          onEnd={(value) => onChange({ periodoAFin: value })}
        />
      </article>
      <article className="reportes-period-card">
        <h3>Periodo 2</h3>
        <DateRangeFields
          start={filters.periodoBInicio}
          end={filters.periodoBFin}
          onStart={(value) => onChange({ periodoBInicio: value })}
          onEnd={(value) => onChange({ periodoBFin: value })}
        />
      </article>
    </div>
  );
}

function ReportActions({
  busy,
  runLabel,
  onRun,
  onPdf,
}: {
  busy: boolean;
  runLabel?: string;
  onRun: () => void;
  onPdf: () => void;
}) {
  return (
    <div className="reportes-actions">
      <Button type="button" onClick={onRun} disabled={busy}>{busy ? 'Generando...' : runLabel || 'Generar'}</Button>
      <Button type="button" variant="ghost" onClick={onPdf} disabled={busy}>Exportar PDF</Button>
    </div>
  );
}

function ChartShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="reportes-chart-card">
      <h3>{title}</h3>
      <div className="reportes-chart-frame">{children}</div>
    </article>
  );
}

function DonutChart({ data }: { data: { name: string; value: number; fill: string }[] }) {
  const visibleData = data.filter((item) => item.value > 0);
  const total = visibleData.reduce((sum, item) => sum + item.value, 0);
  const radius = 72;
  const strokeWidth = 34;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (!total) return <EmptyReport text="Sin datos para graficar." />;

  return (
    <div className="reportes-donut">
      <svg className="reportes-donut__svg" viewBox="0 0 220 220" role="img" aria-label="Grafica de dona">
        <circle cx="110" cy="110" r={radius} fill="none" stroke="#edf3ed" strokeWidth={strokeWidth} />
        {visibleData.map((item) => {
          const rawLength = (item.value / total) * circumference;
          const dashLength = Math.max(0, rawLength - (visibleData.length > 1 ? 2 : 0));
          const segment = (
            <circle
              key={item.name}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={item.fill}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 110 110)"
            />
          );
          offset += rawLength;
          return segment;
        })}
        <circle cx="110" cy="110" r={radius - strokeWidth / 2 - 2} fill="#ffffff" />
        <text x="110" y="104" textAnchor="middle" className="reportes-donut__total">{formatNumber(total)}</text>
        <text x="110" y="124" textAnchor="middle" className="reportes-donut__caption">Total</text>
      </svg>
      <ul className="reportes-donut__legend">
        {visibleData.map((item) => (
          <li key={item.name}>
            <span className="reportes-donut__swatch" style={{ backgroundColor: item.fill }} />
            <span>{item.name}</span>
            <strong>{formatNumber(item.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyReport({ text = 'Genera el reporte para ver resultados.' }: { text?: string }) {
  return <p className="reportes-empty">{text}</p>;
}

export function ReportesPage({ onGoHome, onGoUsersAdmin, onNavigateModule }: ReportesPageProps) {
  const { user, logout } = useAuth();
  const visibleNavItems = useMemo(() => getVisibleNavItemsForRole(user?.rol, NAV_ITEMS), [user?.rol]);

  const canView = useMemo(() => canViewReportes(user?.rol), [user?.rol]);
  const canInventario = useMemo(() => canViewReporteInventario(user?.rol), [user?.rol]);
  const canSanitario = useMemo(() => canViewReporteSanitario(user?.rol), [user?.rol]);
  const canProductivo = useMemo(() => canViewReporteProductivo(user?.rol), [user?.rol]);
  const canComparativo = useMemo(() => canViewReporteComparativo(user?.rol), [user?.rol]);
  const canPerdidas = useMemo(() => canViewReportePerdidas(user?.rol), [user?.rol]);

  const tabs = useMemo<TabConfig[]>(() => {
    const nextTabs: TabConfig[] = [];
    if (canInventario) nextTabs.push({ key: 'inventario', label: 'Inventario' });
    if (canSanitario) nextTabs.push({ key: 'sanitario', label: 'Sanitario' });
    if (canPerdidas) nextTabs.push({ key: 'sanitario-comparativo', label: 'Sanitario comparativo' });
    if (canProductivo) nextTabs.push({ key: 'productividad', label: 'Productividad' });
    if (canComparativo) nextTabs.push({ key: 'comparativo-fechas', label: 'Comparativo fechas' });
    if (canPerdidas) nextTabs.push({ key: 'perdidas', label: 'Perdidas' });
    if (canPerdidas) nextTabs.push({ key: 'perdidas-comparativo', label: 'Perdidas comparativo' });
    return nextTabs;
  }, [canInventario, canSanitario, canProductivo, canComparativo, canPerdidas]);

  const [activeTab, setActiveTab] = useState<TabKey>('inventario');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState<UiMessage | null>(null);

  const [inventarioReport, setInventarioReport] = useState<ReporteInventario | null>(null);
  const [sanitarioReport, setSanitarioReport] = useState<ReporteSanitarioHato | null>(null);
  const [sanitarioComparativoReport, setSanitarioComparativoReport] = useState<ReporteSanitarioComparativo | null>(null);
  const [productividadReport, setProductividadReport] = useState<ReporteProductividad | null>(null);
  const [comparativoFechasReport, setComparativoFechasReport] = useState<ReporteComparativoFechas | null>(null);
  const [perdidasReport, setPerdidasReport] = useState<ReportePerdidas | null>(null);
  const [perdidasComparativoReport, setPerdidasComparativoReport] = useState<ReportePerdidasComparativo | null>(null);

  const [inventarioFilters, setInventarioFilters] = useState({ fechaInicio: DEFAULT_FECHA_INICIO, fechaFin: DEFAULT_FECHA_FIN, categoria: '' });
  const [sanitarioFilters, setSanitarioFilters] = useState({ fechaInicio: DEFAULT_FECHA_INICIO, fechaFin: DEFAULT_FECHA_FIN, estado: 'TODOS' });
  const [productividadFilters, setProductividadFilters] = useState({ fechaInicio: DEFAULT_FECHA_INICIO, fechaFin: DEFAULT_FECHA_FIN, edadMinimaMeses: '0' });
  const [perdidasFilters, setPerdidasFilters] = useState({ fechaInicio: DEFAULT_FECHA_INICIO, fechaFin: DEFAULT_FECHA_FIN, motivo: '' });
  const [sanitarioPeriodFilters, setSanitarioPeriodFilters] = useState({
    periodoAInicio: DEFAULT_PERIODO_A_INICIO,
    periodoAFin: DEFAULT_PERIODO_A_FIN,
    periodoBInicio: DEFAULT_PERIODO_B_INICIO,
    periodoBFin: DEFAULT_PERIODO_B_FIN,
  });
  const [comparativoFilters, setComparativoFilters] = useState({
    modulo: 'productividad' as ModuloComparativoFechas,
    periodoAInicio: DEFAULT_PERIODO_A_INICIO,
    periodoAFin: DEFAULT_PERIODO_A_FIN,
    periodoBInicio: DEFAULT_PERIODO_B_INICIO,
    periodoBFin: DEFAULT_PERIODO_B_FIN,
    edadMinimaMeses: '0',
  });
  const [perdidasPeriodFilters, setPerdidasPeriodFilters] = useState({
    periodoAInicio: DEFAULT_PERIODO_A_INICIO,
    periodoAFin: DEFAULT_PERIODO_A_FIN,
    periodoBInicio: DEFAULT_PERIODO_B_INICIO,
    periodoBFin: DEFAULT_PERIODO_B_FIN,
  });

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab) && tabs.length > 0) {
      setActiveTab(tabs[0].key);
    }
  }, [activeTab, tabs]);

  const handleApiError = useCallback(async (error: unknown) => {
    setMessage({ type: 'error', text: getReportesErrorMessage(error) });
    if (error instanceof ApiClientError && error.status === 401) {
      await logout();
    }
  }, [logout]);

  const executeAction = useCallback(async (actionKey: string, action: () => Promise<void>, successText: string) => {
    try {
      setBusyAction(actionKey);
      setMessage(null);
      await action();
      setMessage({ type: 'success', text: successText });
    } catch (error) {
      await handleApiError(error);
    } finally {
      setBusyAction(null);
    }
  }, [handleApiError]);

  const runDownload = async (
    actionKey: string,
    successText: string,
    request: () => Promise<{ blob: Blob; fileName: string }>,
  ) => {
    await executeAction(actionKey, async () => {
      const file = await request();
      saveBlobAsFile(file.blob, file.fileName);
    }, successText);
  };

  const validatePeriods = (filters: typeof sanitarioPeriodFilters) => (
    isValidDateRange(filters.periodoAInicio, filters.periodoAFin)
    && isValidDateRange(filters.periodoBInicio, filters.periodoBFin)
  );

  const onNavigate = (moduleName: string) => {
    if (moduleName === 'Usuarios' && onGoUsersAdmin) return onGoUsersAdmin();
    if (onNavigateModule) return onNavigateModule(moduleName);
    return onGoHome();
  };

  const runInventario = () => {
    const filters = sanitizeDownloadFilters(inventarioFilters);
    void executeAction('inventario-json', async () => {
      setInventarioReport(await reportesApi.getInventario(filters));
    }, 'Reporte de inventario generado.');
  };

  const runSanitario = () => {
    const filters = {
      fechaInicio: sanitarioFilters.fechaInicio,
      fechaFin: sanitarioFilters.fechaFin,
      estado: sanitarioFilters.estado === 'TODOS' ? undefined : sanitarioFilters.estado as 'SANO' | 'EN_TRATAMIENTO' | 'ENFERMO',
    };
    void executeAction('sanitario-hato-json', async () => {
      setSanitarioReport(await reportesApi.getSanitarioHato(filters));
    }, 'Reporte sanitario generado.');
  };

  const runSanitarioComparativo = () => {
    if (!validatePeriods(sanitarioPeriodFilters)) {
      setMessage({ type: 'error', text: 'Valida las fechas de ambos periodos antes de generar.' });
      return;
    }
    void executeAction('sanitario-comparativo-json', async () => {
      setSanitarioComparativoReport(await reportesApi.getSanitarioComparativo(sanitarioPeriodFilters));
    }, 'Reporte sanitario comparativo generado.');
  };

  const runProductividad = () => {
    const filters = {
      fechaInicio: productividadFilters.fechaInicio,
      fechaFin: productividadFilters.fechaFin,
      edadMinimaMeses: Number(productividadFilters.edadMinimaMeses || 0),
    };
    void executeAction('productividad-json', async () => {
      setProductividadReport(await reportesApi.getProductividad(filters));
    }, 'Reporte de productividad generado.');
  };

  const runComparativoFechas = () => {
    if (!validatePeriods(comparativoFilters)) {
      setMessage({ type: 'error', text: 'Valida las fechas de ambos periodos antes de generar.' });
      return;
    }
    const filters = {
      ...comparativoFilters,
      edadMinimaMeses: Number(comparativoFilters.edadMinimaMeses || 0),
    };
    void executeAction('comparativo-fechas-json', async () => {
      setComparativoFechasReport(await reportesApi.getComparativoFechas(filters));
    }, 'Reporte comparativo por fechas generado.');
  };

  const runPerdidas = () => {
    const filters = sanitizeDownloadFilters(perdidasFilters);
    void executeAction('perdidas-json', async () => {
      setPerdidasReport(await reportesApi.getPerdidas(filters));
    }, 'Reporte de perdidas generado.');
  };

  const runPerdidasComparativo = () => {
    if (!validatePeriods(perdidasPeriodFilters)) {
      setMessage({ type: 'error', text: 'Valida las fechas de ambos periodos antes de generar.' });
      return;
    }
    void executeAction('perdidas-comparativo-json', async () => {
      setPerdidasComparativoReport(await reportesApi.getPerdidasComparativo(perdidasPeriodFilters));
    }, 'Reporte comparativo de perdidas generado.');
  };

  const exportInventario = (format: DownloadFormat) => {
    const filters = sanitizeDownloadFilters(inventarioFilters);
    void runDownload(`inventario-${format}`, 'Reporte de inventario exportado.', () => reportesApi.downloadInventario(filters, format));
  };

  const exportSanitario = (format: DownloadFormat) => {
    const filters = {
      fechaInicio: sanitarioFilters.fechaInicio,
      fechaFin: sanitarioFilters.fechaFin,
      estado: sanitarioFilters.estado === 'TODOS' ? undefined : sanitarioFilters.estado as 'SANO' | 'EN_TRATAMIENTO' | 'ENFERMO',
    };
    void runDownload(`sanitario-hato-${format}`, 'Reporte sanitario exportado.', () => reportesApi.downloadSanitarioHato(filters, format));
  };

  const exportSanitarioComparativo = (format: DownloadFormat) => {
    if (!validatePeriods(sanitarioPeriodFilters)) return;
    void runDownload(`sanitario-comparativo-${format}`, 'Reporte sanitario comparativo exportado.', () => reportesApi.downloadSanitarioComparativo(sanitarioPeriodFilters, format));
  };

  const exportProductividad = (format: DownloadFormat) => {
    const filters = {
      fechaInicio: productividadFilters.fechaInicio,
      fechaFin: productividadFilters.fechaFin,
      edadMinimaMeses: Number(productividadFilters.edadMinimaMeses || 0),
    };
    void runDownload(`productividad-${format}`, 'Reporte de productividad exportado.', () => reportesApi.downloadProductividad(filters, format));
  };

  const exportComparativoFechas = (format: DownloadFormat) => {
    if (!validatePeriods(comparativoFilters)) return;
    const filters = {
      ...comparativoFilters,
      edadMinimaMeses: Number(comparativoFilters.edadMinimaMeses || 0),
    };
    void runDownload(`comparativo-fechas-${format}`, 'Reporte comparativo por fechas exportado.', () => reportesApi.downloadComparativoFechas(filters, format));
  };

  const exportPerdidas = (format: DownloadFormat) => {
    const filters = sanitizeDownloadFilters(perdidasFilters);
    void runDownload(`perdidas-${format}`, 'Reporte de perdidas exportado.', () => reportesApi.downloadPerdidas(filters, format));
  };

  const exportPerdidasComparativo = (format: DownloadFormat) => {
    if (!validatePeriods(perdidasPeriodFilters)) return;
    void runDownload(`perdidas-comparativo-${format}`, 'Reporte comparativo de perdidas exportado.', () => reportesApi.downloadPerdidasComparativo(perdidasPeriodFilters, format));
  };

  const inventarioChart = ['OPTIMO', 'BAJO', 'CRITICO'].map((status) => {
    const item = inventarioReport?.estados.find((entry) => entry.estado === status);
    return {
      estado: status,
      name: status,
      value: item?.total || 0,
      total: item?.total || 0,
      fill: inventoryStatusColor(status),
    };
  });

  const sanitarioChart = sanitarioReport?.distribucion.map((item) => ({
    estado: item.label,
    name: item.label,
    value: item.total,
    total: item.total,
    fill: sanitaryStatusColor(item.estado),
  })) || [];

  const sanitaryPeriodPie = (period: Record<string, number | string>) => {
    const total = toNumber(period.totalEvaluados);
    const sanos = toNumber(period.sanos);
    const enfermos = toNumber(period.enfermos);
    const otros = Math.max(0, total - sanos - enfermos);
    return [
      { name: 'Sanos', value: sanos, fill: COLORS.green },
      { name: 'Enfermos', value: enfermos, fill: COLORS.red },
      { name: 'Tratamiento', value: otros, fill: COLORS.amber },
    ].filter((item) => item.value > 0);
  };

  const productividadChart = productividadReport?.metricas.map((item, index) => ({
    metrica: item.label,
    valor: item.value,
    fill: index === 2 ? COLORS.green : COLORS.blue,
  })) || [];

  const perdidasPie = perdidasReport?.porMotivo.map((item, index) => ({
    name: item.motivo,
    value: item.pesoKg,
    bajas: item.bajas,
    fill: lossReasonColor(item.motivo, index),
  })) || [];

  const toComparativoRows = (metricas: { label: string; periodoA: number; periodoB: number; delta: number; porcentaje: number; unit: string }[] = []) => metricas.map((item) => ({
    indicador: item.label,
    periodo1: item.periodoA,
    periodo2: item.periodoB,
    delta: item.delta,
    variacion: item.porcentaje,
    unit: item.unit,
  }));
  const comparativoFechasRows = toComparativoRows(comparativoFechasReport?.metricas);
  const perdidasComparativoRows = toComparativoRows(perdidasComparativoReport?.metricas);

  const perdidasComparativoPie = (periodKey: 'periodoA' | 'periodoB') => (perdidasComparativoReport?.motivos || [])
    .map((item, index) => ({
      name: item.motivo,
      value: Number(item[periodKey] || 0),
      fill: lossReasonColor(item.motivo, index),
    }))
    .filter((item) => item.value > 0);

  return (
    <section className="users-admin-shell" data-testid="reportes-page">
      <aside className="users-admin-sidebar">
        <div className="users-admin-sidebar__logo">
          <img src="/branding/logo-rancho-los-alpes.png" alt="Logo Rancho Los Alpes" />
        </div>
        <nav className="users-admin-sidebar__nav" aria-label="Navegacion de modulos">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                data-testid={`reportes-nav-${item.label.toLowerCase()}`}
                className={`users-admin-sidebar__nav-item ${item.label === 'Reportes' ? 'is-active' : ''}`}
                onClick={item.label === 'Reportes' ? undefined : () => onNavigate(item.label)}
              >
                <Icon size={18} aria-hidden /> {item.label}
              </button>
            );
          })}
        </nav>
        <footer className="users-admin-sidebar__footer">
          <p>{user?.nombreCompleto || 'Usuario'}</p>
          <small>{user?.rol || 'Sin rol'}</small>
          <Button type="button" className="users-admin-sidebar__logout" onClick={() => void logout()} data-testid="reportes-sidebar-logout">
            <LogOut size={15} aria-hidden /> Cerrar sesion
          </Button>
        </footer>
      </aside>

      <main className="users-admin-main">
        <header className="users-admin-main__header" data-testid="reportes-header">
          <h1>Reportes</h1>
          <p>Reportes ejecutivos SIGGAB para Rancho Los Alpes con graficas, filtros por fecha y exportacion empresarial.</p>
        </header>

        <div className="users-admin-main__body">
          {!canView ? (
            <article className="users-admin-empty">
              <h2>Sin permisos para reportes</h2>
              <p>Tu rol actual no puede consultar reportes.</p>
            </article>
          ) : (
            <div className="reportes-content">
              {message ? <p className={getMessageClass(message.type)}>{message.text}</p> : null}

              <div className="productivo-tabs reportes-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`productivo-tab ${activeTab === tab.key ? 'is-active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                    data-testid={`reportes-tab-${tab.key}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'inventario' && canInventario ? (
                <div className="reportes-block reportes-report-layout">
                  <article className="productivo-card reportes-filter-card">
                    <div className="users-admin-card__title"><h2>Reporte de Inventario</h2></div>
                    <DateRangeFields
                      start={inventarioFilters.fechaInicio}
                      end={inventarioFilters.fechaFin}
                      onStart={(value) => setInventarioFilters((prev) => ({ ...prev, fechaInicio: value }))}
                      onEnd={(value) => setInventarioFilters((prev) => ({ ...prev, fechaFin: value }))}
                    />
                    <label className="productivo-field">
                      <span>Categoria</span>
                      <select value={inventarioFilters.categoria} onChange={(event) => setInventarioFilters((prev) => ({ ...prev, categoria: event.target.value }))}>
                        <option value="">Todas</option>
                        {inventarioReport?.categorias.map((item) => <option key={item.categoria} value={item.categoria}>{item.categoria}</option>)}
                      </select>
                    </label>
                    <ReportActions busy={busyAction !== null} onRun={runInventario} onPdf={() => exportInventario('pdf')} />
                  </article>

                  <article className="productivo-card reportes-result-card">
                    {inventarioReport ? (
                      <>
                        <div className="reportes-metric-grid">
                          <KpiCard label="Total insumos" value={formatNumber(inventarioReport.resumen.totalInsumos)} tone="blue" />
                          <KpiCard label="Optimos" value={formatNumber(inventarioReport.resumen.optimos)} tone="green" />
                          <KpiCard label="Bajos" value={formatNumber(inventarioReport.resumen.bajos)} tone="amber" />
                          <KpiCard label="Criticos" value={formatNumber(inventarioReport.resumen.criticos)} tone="red" />
                        </div>
                        <ChartShell title="Estado del inventario">
                          <DonutChart data={inventarioChart} />
                        </ChartShell>
                        <div className="productivo-table-wrap">
                          <table className="productivo-table">
                            <thead><tr><th>Nombre</th><th>Categoria</th><th>Stock</th><th>Estado</th></tr></thead>
                            <tbody>
                              {inventarioReport.insumos.slice(0, 20).map((item) => (
                                <tr key={item.idInsumo}>
                                  <td>{item.nombre}</td>
                                  <td>{item.categoria}</td>
                                  <td>{formatMetric(item.stockActual)} {item.unidadMedida}</td>
                                  <td><span className="reportes-status" style={{ color: inventoryStatusColor(item.estado), borderColor: inventoryStatusColor(item.estado) }}>{item.estado}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : <EmptyReport />}
                  </article>
                </div>
              ) : null}

              {activeTab === 'sanitario' && canSanitario ? (
                <div className="reportes-block reportes-report-layout">
                  <article className="productivo-card reportes-filter-card">
                    <div className="users-admin-card__title"><h2>Reporte Sanitario del Hato</h2></div>
                    <DateRangeFields
                      start={sanitarioFilters.fechaInicio}
                      end={sanitarioFilters.fechaFin}
                      onStart={(value) => setSanitarioFilters((prev) => ({ ...prev, fechaInicio: value }))}
                      onEnd={(value) => setSanitarioFilters((prev) => ({ ...prev, fechaFin: value }))}
                    />
                    <label className="productivo-field">
                      <span>Estado</span>
                      <select value={sanitarioFilters.estado} onChange={(event) => setSanitarioFilters((prev) => ({ ...prev, estado: event.target.value }))}>
                        <option value="TODOS">Todos</option>
                        <option value="SANO">Sano</option>
                        <option value="EN_TRATAMIENTO">En tratamiento</option>
                        <option value="ENFERMO">Enfermo</option>
                      </select>
                    </label>
                    <ReportActions busy={busyAction !== null} onRun={runSanitario} onPdf={() => exportSanitario('pdf')} />
                  </article>

                  <article className="productivo-card reportes-result-card">
                    {sanitarioReport ? (
                      <>
                        <div className="reportes-metric-grid">
                          <KpiCard label="Total evaluados" value={formatNumber(sanitarioReport.resumen.totalEvaluados)} tone="blue" />
                          <KpiCard label="Sanos" value={formatNumber(sanitarioReport.resumen.sanos)} tone="green" />
                          <KpiCard label="En tratamiento" value={formatNumber(sanitarioReport.resumen.enTratamiento)} tone="amber" />
                          <KpiCard label="Enfermos" value={formatNumber(sanitarioReport.resumen.enfermos)} tone="red" />
                        </div>
                        <ChartShell title="Distribucion sanitaria">
                          <DonutChart data={sanitarioChart} />
                        </ChartShell>
                        <div className="productivo-table-wrap">
                          <table className="productivo-table">
                            <thead><tr><th>Arete</th><th>Raza</th><th>Edad</th><th>Sexo</th><th>Peso</th><th>Estado</th><th>Tratamiento</th></tr></thead>
                            <tbody>
                              {sanitarioReport.animales.slice(0, 30).map((item) => (
                                <tr key={item.idAnimal}>
                                  <td className="productivo-table-id">{item.arete}</td>
                                  <td>{item.raza}</td>
                                  <td>{item.edadMeses} meses</td>
                                  <td>{item.sexo}</td>
                                  <td>{formatMetric(item.pesoKg, 'kg')}</td>
                                  <td><span className="reportes-status" style={{ color: sanitaryStatusColor(item.estadoSanitario), borderColor: sanitaryStatusColor(item.estadoSanitario) }}>{item.estadoSanitarioLabel}</span></td>
                                  <td>{item.tratamiento}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : <EmptyReport />}
                  </article>
                </div>
              ) : null}

              {activeTab === 'sanitario-comparativo' && canPerdidas ? (
                <div className="reportes-block reportes-report-layout">
                  <article className="productivo-card reportes-filter-card">
                    <div className="users-admin-card__title"><h2>Sanitario Comparativo</h2></div>
                    <PeriodFields filters={sanitarioPeriodFilters} onChange={(next) => setSanitarioPeriodFilters((prev) => ({ ...prev, ...next }))} />
                    <ReportActions busy={busyAction !== null} onRun={runSanitarioComparativo} onPdf={() => exportSanitarioComparativo('pdf')} />
                  </article>
                  <article className="productivo-card reportes-result-card">
                    {sanitarioComparativoReport ? (
                      <>
                        <div className="reportes-metric-grid">
                          {sanitarioComparativoReport.metricas.map((item, index) => (
                            <KpiCard key={item.label} label={item.label} value={`${formatMetric(item.periodoB)} (${item.delta >= 0 ? '+' : ''}${formatMetric(item.delta)})`} tone={index === 2 ? 'red' : index === 1 ? 'green' : 'blue'} />
                          ))}
                        </div>
                        <div className="reportes-chart-pair">
                          <ChartShell title="Periodo 1">
                            <DonutChart data={sanitaryPeriodPie(sanitarioComparativoReport.periodoA)} />
                          </ChartShell>
                          <ChartShell title="Periodo 2">
                            <DonutChart data={sanitaryPeriodPie(sanitarioComparativoReport.periodoB)} />
                          </ChartShell>
                        </div>
                      </>
                    ) : <EmptyReport text="Genera el comparativo para ver las graficas de total, sanos y enfermos." />}
                  </article>
                </div>
              ) : null}

              {activeTab === 'productividad' && canProductivo ? (
                <div className="reportes-block reportes-report-layout">
                  <article className="productivo-card reportes-filter-card">
                    <div className="users-admin-card__title"><h2>Reporte de Productividad</h2></div>
                    <DateRangeFields
                      start={productividadFilters.fechaInicio}
                      end={productividadFilters.fechaFin}
                      onStart={(value) => setProductividadFilters((prev) => ({ ...prev, fechaInicio: value }))}
                      onEnd={(value) => setProductividadFilters((prev) => ({ ...prev, fechaFin: value }))}
                    />
                    <label className="productivo-field">
                      <span>Edad minima (meses)</span>
                      <input type="number" min="0" value={productividadFilters.edadMinimaMeses} onChange={(event) => setProductividadFilters((prev) => ({ ...prev, edadMinimaMeses: event.target.value }))} />
                    </label>
                    <ReportActions busy={busyAction !== null} onRun={runProductividad} onPdf={() => exportProductividad('pdf')} />
                  </article>
                  <article className="productivo-card reportes-result-card">
                    {productividadReport ? (
                      <>
                        <div className="reportes-metric-grid">
                          <KpiCard label="Total animales" value={formatNumber(productividadReport.resumen.totalAnimales)} tone="blue" />
                          <KpiCard label="Peso total" value={formatMetric(productividadReport.resumen.pesoTotalKg, 'kg')} tone="green" />
                          <KpiCard label="Peso promedio" value={formatMetric(productividadReport.resumen.pesoPromedioKg, 'kg')} tone="blue" />
                          <KpiCard label="GPD promedio" value={formatMetric(productividadReport.resumen.gpdPromedioKgDia, 'kg/dia')} tone="green" />
                        </div>
                        <ChartShell title="Metricas productivas">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productividadChart}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="metrica" />
                              <YAxis />
                              <Tooltip cursor={false} />
                              <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                                {productividadChart.map((entry) => <Cell key={entry.metrica} fill={entry.fill} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartShell>
                        <div className="productivo-table-wrap">
                          <table className="productivo-table">
                            <thead><tr><th>Arete</th><th>Raza</th><th>Edad</th><th>Peso</th><th>GPD</th></tr></thead>
                            <tbody>
                              {productividadReport.animales.slice(0, 30).map((item) => (
                                <tr key={item.idAnimal}>
                                  <td className="productivo-table-id">{item.arete}</td>
                                  <td>{item.raza}</td>
                                  <td>{item.edadMeses} meses</td>
                                  <td>{formatMetric(item.pesoKg, 'kg')}</td>
                                  <td>{item.gpdKgDia === null ? '--' : formatMetric(item.gpdKgDia, 'kg/dia')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : <EmptyReport />}
                  </article>
                </div>
              ) : null}

              {activeTab === 'comparativo-fechas' && canComparativo ? (
                <div className="reportes-block reportes-report-layout">
                  <article className="productivo-card reportes-filter-card">
                    <div className="users-admin-card__title"><h2>Comparativo por Fechas</h2></div>
                    <label className="productivo-field">
                      <span>Tipo</span>
                      <select value={comparativoFilters.modulo} onChange={(event) => setComparativoFilters((prev) => ({ ...prev, modulo: event.target.value as ModuloComparativoFechas }))}>
                        <option value="productividad">Productividad</option>
                        {canPerdidas ? <option value="sanitario">Sanitario</option> : null}
                        {canPerdidas ? <option value="perdidas">Perdidas</option> : null}
                      </select>
                    </label>
                    <PeriodFields filters={comparativoFilters} onChange={(next) => setComparativoFilters((prev) => ({ ...prev, ...next }))} />
                    {comparativoFilters.modulo === 'productividad' ? (
                      <label className="productivo-field">
                        <span>Edad minima (meses)</span>
                        <input type="number" min="0" value={comparativoFilters.edadMinimaMeses} onChange={(event) => setComparativoFilters((prev) => ({ ...prev, edadMinimaMeses: event.target.value }))} />
                      </label>
                    ) : null}
                    <ReportActions busy={busyAction !== null} onRun={runComparativoFechas} onPdf={() => exportComparativoFechas('pdf')} />
                  </article>
                  <article className="productivo-card reportes-result-card">
                    {comparativoFechasReport ? (
                      <>
                        <ChartShell title="Comparativo de indicadores">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparativoFechasReport.metricas}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="label" />
                              <YAxis />
                              <Tooltip cursor={false} />
                              <Legend />
                              <Bar dataKey="periodoA" name="Periodo 1" fill={COLORS.purple} radius={[8, 8, 0, 0]} />
                              <Bar dataKey="periodoB" name="Periodo 2" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartShell>
                        <ComparativoTable rows={comparativoFechasRows} />
                      </>
                    ) : <EmptyReport text="Genera el reporte para comparar dos rangos de fechas." />}
                  </article>
                </div>
              ) : null}

              {activeTab === 'perdidas' && canPerdidas ? (
                <div className="reportes-block reportes-report-layout">
                  <article className="productivo-card reportes-filter-card">
                    <div className="users-admin-card__title"><h2>Reporte de Bajas y Perdidas</h2></div>
                    <DateRangeFields
                      start={perdidasFilters.fechaInicio}
                      end={perdidasFilters.fechaFin}
                      onStart={(value) => setPerdidasFilters((prev) => ({ ...prev, fechaInicio: value }))}
                      onEnd={(value) => setPerdidasFilters((prev) => ({ ...prev, fechaFin: value }))}
                    />
                    <label className="productivo-field">
                      <span>Motivo</span>
                      <select value={perdidasFilters.motivo} onChange={(event) => setPerdidasFilters((prev) => ({ ...prev, motivo: event.target.value }))}>
                        <option value="">Todos</option>
                        <option value="Enfermedad">Enfermedad</option>
                        <option value="Accidente">Accidente</option>
                        <option value="Venta">Venta</option>
                        <option value="Muerte">Muerte</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </label>
                    <ReportActions busy={busyAction !== null} onRun={runPerdidas} onPdf={() => exportPerdidas('pdf')} />
                  </article>
                  <article className="productivo-card reportes-result-card">
                    {perdidasReport ? (
                      <>
                        <div className="reportes-metric-grid">
                          <KpiCard label="Bajas totales" value={formatNumber(perdidasReport.resumen.bajasTotales)} tone="red" />
                          <KpiCard label="Peso perdido" value={formatMetric(perdidasReport.resumen.pesoTotalPerdidoKg, 'kg')} tone="amber" />
                          <KpiCard label="Filtro activo" value={String(perdidasReport.resumen.filtroActivo)} tone="blue" />
                        </div>
                        <ChartShell title="Peso perdido por motivo">
                          <DonutChart data={perdidasPie} />
                        </ChartShell>
                        <ChartShell title="Bajas por mes">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={perdidasReport.porPeriodo}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="periodo" />
                              <YAxis allowDecimals={false} />
                              <Tooltip cursor={false} />
                              <Bar dataKey="bajas" fill={COLORS.red} radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartShell>
                      </>
                    ) : <EmptyReport />}
                  </article>
                </div>
              ) : null}

              {activeTab === 'perdidas-comparativo' && canPerdidas ? (
                <div className="reportes-block reportes-report-layout">
                  <article className="productivo-card reportes-filter-card">
                    <div className="users-admin-card__title"><h2>Comparativo de Perdidas</h2></div>
                    <PeriodFields filters={perdidasPeriodFilters} onChange={(next) => setPerdidasPeriodFilters((prev) => ({ ...prev, ...next }))} />
                    <ReportActions busy={busyAction !== null} onRun={runPerdidasComparativo} onPdf={() => exportPerdidasComparativo('pdf')} />
                  </article>
                  <article className="productivo-card reportes-result-card">
                    {perdidasComparativoReport ? (
                      <>
                        <div className="reportes-metric-grid">
                          {perdidasComparativoReport.metricas.map((item, index) => (
                            <KpiCard
                              key={item.label}
                              label={item.label}
                              value={`${formatMetric(item.periodoB, item.unit)} (${item.delta >= 0 ? '+' : ''}${formatMetric(item.delta, item.unit)})`}
                              tone={index === 0 ? 'red' : 'amber'}
                            />
                          ))}
                        </div>
                        <div className="reportes-chart-pair">
                          <ChartShell title="Motivos Periodo 1">
                            <DonutChart data={perdidasComparativoPie('periodoA')} />
                          </ChartShell>
                          <ChartShell title="Motivos Periodo 2">
                            <DonutChart data={perdidasComparativoPie('periodoB')} />
                          </ChartShell>
                        </div>
                        <ComparativoTable rows={perdidasComparativoRows} />
                      </>
                    ) : <EmptyReport text="Genera el comparativo para revisar bajas y peso perdido entre periodos." />}
                  </article>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </section>
  );
}

function ComparativoTable({ rows }: { rows: { indicador: string; periodo1: number; periodo2: number; delta: number; variacion: number; unit: string }[] }) {
  return (
    <div className="productivo-table-wrap">
      <table className="productivo-table">
        <thead><tr><th>Indicador</th><th>Periodo 1</th><th>Periodo 2</th><th>Delta</th><th>Variacion</th></tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={5} className="productivo-table-empty">Sin indicadores.</td></tr> : rows.map((item) => (
            <tr key={item.indicador}>
              <td>{item.indicador}</td>
              <td>{formatMetric(item.periodo1, item.unit)}</td>
              <td>{formatMetric(item.periodo2, item.unit)}</td>
              <td><span className={`reportes-delta ${item.delta > 0 ? 'is-up' : item.delta < 0 ? 'is-down' : 'is-flat'}`}>{item.delta > 0 ? '+' : ''}{formatMetric(item.delta, item.unit)}</span></td>
              <td><span className={`reportes-delta ${item.variacion > 0 ? 'is-up' : item.variacion < 0 ? 'is-down' : 'is-flat'}`}>{item.variacion > 0 ? '+' : ''}{formatDecimal(item.variacion, 2)}%</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
