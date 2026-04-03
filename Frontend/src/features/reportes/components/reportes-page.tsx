import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { sanitarioApi } from '../../sanitario/sanitario-api';
import { productivoApi } from '../../productivo/productivo-api';
import { Button } from '../../../shared/ui';
import { ApiClientError } from '../../../types/api';
import { reportesApi } from '../reportes-api';
import type {
  AnimalReporteOption,
  DownloadFormat,
  EstadoRegistro,
  LoteReporteOption,
  ReporteAdministrativo,
  ReporteComparativo,
  ReporteProductivo,
  ReporteSanitario,
  TipoEventoReporteOption,
} from '../reportes-types';
import {
  canViewReporteAdministrativo,
  canViewReporteComparativo,
  canViewReporteProductivo,
  canViewReporteSanitario,
  canViewReportes,
  formatDate,
  formatDecimal,
  formatNumber,
  getEstadoClass,
  getReportesErrorMessage,
  getDaysAgoInputDate,
  getTodayInputDate,
  isValidDateRange,
  saveBlobAsFile,
} from '../reportes-utils';

interface ReportesPageProps {
  onGoHome: () => void;
  onGoUsersAdmin?: () => void;
  onNavigateModule?: (moduleName: string) => void;
}

type TabKey = 'sanitario' | 'productivo' | 'administrativo' | 'comparativo';
type EstadoAprobacionFiltro = 'TODOS' | EstadoRegistro;

interface UiMessage {
  type: 'error' | 'success';
  text: string;
}

interface TabConfig {
  key: TabKey;
  label: string;
}

const NAV_ITEMS = ['Dashboard', 'Ganado', 'Sanitario', 'Produccion', 'Inventario', 'Reportes', 'Aprobaciones', 'Auditoria', 'Usuarios', 'Respaldos'];

const DEFAULT_FECHA_FIN = getTodayInputDate();
const DEFAULT_FECHA_INICIO = getDaysAgoInputDate(30);

function parseOptionalId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function getMessageClass(type: UiMessage['type']) {
  return type === 'success' ? 'users-message users-message--success' : 'users-message users-message--error';
}

function formatMetricValue(value: number | string | undefined) {
  if (value === undefined || value === null) return '--';
  if (typeof value === 'number') return formatDecimal(value, 2);
  const numericValue = Number(value);
  if (value !== '' && Number.isFinite(numericValue)) return formatDecimal(numericValue, 2);
  return String(value);
}

export function ReportesPage({ onGoHome, onGoUsersAdmin, onNavigateModule }: ReportesPageProps) {
  const { user, logout } = useAuth();

  const canView = useMemo(() => canViewReportes(user?.rol), [user?.rol]);
  const canSanitario = useMemo(() => canViewReporteSanitario(user?.rol), [user?.rol]);
  const canProductivo = useMemo(() => canViewReporteProductivo(user?.rol), [user?.rol]);
  const canAdministrativo = useMemo(() => canViewReporteAdministrativo(user?.rol), [user?.rol]);
  const canComparativo = useMemo(() => canViewReporteComparativo(user?.rol), [user?.rol]);

  const tabs = useMemo<TabConfig[]>(() => {
    const nextTabs: TabConfig[] = [];
    if (canSanitario) nextTabs.push({ key: 'sanitario', label: 'Sanitario' });
    if (canProductivo) nextTabs.push({ key: 'productivo', label: 'Productivo' });
    if (canAdministrativo) nextTabs.push({ key: 'administrativo', label: 'Administrativo' });
    if (canComparativo) nextTabs.push({ key: 'comparativo', label: 'Comparativo' });
    return nextTabs;
  }, [canSanitario, canProductivo, canAdministrativo, canComparativo]);

  const [activeTab, setActiveTab] = useState<TabKey>('sanitario');
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState<UiMessage | null>(null);

  const [tiposEvento, setTiposEvento] = useState<TipoEventoReporteOption[]>([]);
  const [animales, setAnimales] = useState<AnimalReporteOption[]>([]);
  const [lotes, setLotes] = useState<LoteReporteOption[]>([]);

  const [sanitarioReport, setSanitarioReport] = useState<ReporteSanitario | null>(null);
  const [productivoReport, setProductivoReport] = useState<ReporteProductivo | null>(null);
  const [administrativoReport, setAdministrativoReport] = useState<ReporteAdministrativo | null>(null);
  const [comparativoReport, setComparativoReport] = useState<ReporteComparativo | null>(null);

  const [sanitarioFilters, setSanitarioFilters] = useState({
    fechaInicio: DEFAULT_FECHA_INICIO,
    fechaFin: DEFAULT_FECHA_FIN,
    estadoAprobacion: 'TODOS' as EstadoAprobacionFiltro,
    idTipoEvento: '',
  });
  const [productivoFilters, setProductivoFilters] = useState({
    fechaInicio: DEFAULT_FECHA_INICIO,
    fechaFin: DEFAULT_FECHA_FIN,
    idAnimal: '',
    idLote: '',
  });
  const [administrativoFilters, setAdministrativoFilters] = useState({
    fechaInicio: DEFAULT_FECHA_INICIO,
    fechaFin: DEFAULT_FECHA_FIN,
  });
  const [comparativoFilters, setComparativoFilters] = useState({
    modulo: 'productivo' as 'productivo' | 'sanitario',
    periodoAInicio: getDaysAgoInputDate(60),
    periodoAFin: getDaysAgoInputDate(31),
    periodoBInicio: getDaysAgoInputDate(30),
    periodoBFin: getTodayInputDate(),
  });

  const productivoRows = useMemo(() => {
    if (!productivoReport) return [];

    const pesoRows = productivoReport.registrosPeso.map((registro) => ({
      id: `peso-${registro.idRegistroPeso}`,
      fecha: registro.fechaRegistro,
      arete: registro.animal.numeroArete,
      lote: registro.idLote,
      tipo: 'PESO',
      valor: `${formatDecimal(registro.peso, 1)} kg`,
      estado: registro.estadoValidacion,
    }));

    const lecheRows = productivoReport.produccionLeche.map((registro) => ({
      id: `leche-${registro.idProduccion}`,
      fecha: registro.fechaRegistro,
      arete: registro.animal.numeroArete,
      lote: registro.idLote,
      tipo: 'LECHE',
      valor: `${formatDecimal(registro.litrosProducidos, 2)} L`,
      estado: registro.estadoValidacion,
    }));

    const reproRows = productivoReport.eventosReproductivos.map((evento) => ({
      id: `repro-${evento.idEventoReproductivo}`,
      fecha: evento.fechaEvento,
      arete: evento.animal.numeroArete,
      lote: evento.idLote,
      tipo: 'REPRO',
      valor: evento.tipoEvento,
      estado: evento.estadoValidacion,
    }));

    return [...pesoRows, ...lecheRows, ...reproRows]
      .sort((a, b) => (a.fecha > b.fecha ? -1 : 1))
      .slice(0, 30);
  }, [productivoReport]);

  const comparativoRows = useMemo(() => {
    if (!comparativoReport) return [];
    return Object.entries(comparativoReport.variacion).map(([indicador, variacion]) => ({
      indicador,
      periodoA: comparativoReport.periodoA[indicador],
      periodoB: comparativoReport.periodoB[indicador],
      delta: variacion.delta,
      porcentaje: variacion.porcentaje,
    }));
  }, [comparativoReport]);

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

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab) && tabs.length > 0) {
      setActiveTab(tabs[0].key);
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    if (!canView) return;

    const loadCatalogs = async () => {
      try {
        setLoadingCatalogs(true);

        const tiposPromise = canSanitario ? sanitarioApi.getTiposEvento() : Promise.resolve([]);
        const animalesPromise = canProductivo ? sanitarioApi.getAnimalesActivos() : Promise.resolve([]);
        const lotesPromise = canProductivo ? productivoApi.getLotes() : Promise.resolve([]);

        const [tipos, animalesActivos, lotesActivos] = await Promise.all([
          tiposPromise,
          animalesPromise,
          lotesPromise,
        ]);

        setTiposEvento(tipos.map((item) => ({ idTipoEvento: item.idTipoEvento, nombreTipo: item.nombreTipo })));
        setAnimales(animalesActivos.map((item) => ({ idAnimal: item.idAnimal, numeroArete: item.numeroArete })));
        setLotes(lotesActivos.map((item) => ({
          idLote: item.idLote,
          fechaInicio: item.fechaInicio,
          fechaFin: item.fechaFin,
          estado: item.estado,
        })));
      } catch (error) {
        await handleApiError(error);
      } finally {
        setLoadingCatalogs(false);
      }
    };

    void loadCatalogs();
  }, [canProductivo, canSanitario, canView, handleApiError]);

  const onNavigate = (moduleName: string) => {
    if (moduleName === 'Usuarios' && onGoUsersAdmin) return onGoUsersAdmin();
    if (onNavigateModule) return onNavigateModule(moduleName);
    return onGoHome();
  };

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

  const onRunSanitario = () => {
    const filters = {
      fechaInicio: sanitarioFilters.fechaInicio,
      fechaFin: sanitarioFilters.fechaFin,
      estadoAprobacion: sanitarioFilters.estadoAprobacion === 'TODOS' ? undefined : sanitarioFilters.estadoAprobacion,
      idTipoEvento: parseOptionalId(sanitarioFilters.idTipoEvento),
    };

    void executeAction('sanitario-json', async () => {
      setSanitarioReport(await reportesApi.getSanitario(filters));
    }, 'Reporte sanitario generado.');
  };

  const onRunProductivo = () => {
    const filters = {
      fechaInicio: productivoFilters.fechaInicio,
      fechaFin: productivoFilters.fechaFin,
      idAnimal: parseOptionalId(productivoFilters.idAnimal),
      idLote: parseOptionalId(productivoFilters.idLote),
    };

    void executeAction('productivo-json', async () => {
      setProductivoReport(await reportesApi.getProductivo(filters));
    }, 'Reporte productivo generado.');
  };

  const onRunAdministrativo = () => {
    void executeAction('administrativo-json', async () => {
      setAdministrativoReport(await reportesApi.getAdministrativo(administrativoFilters));
    }, 'Reporte administrativo generado.');
  };

  const onRunComparativo = () => {
    const isRangeAValid = isValidDateRange(comparativoFilters.periodoAInicio, comparativoFilters.periodoAFin);
    const isRangeBValid = isValidDateRange(comparativoFilters.periodoBInicio, comparativoFilters.periodoBFin);

    if (!isRangeAValid || !isRangeBValid) {
      setMessage({ type: 'error', text: 'Valida las fechas de ambos periodos antes de generar.' });
      return;
    }

    void executeAction('comparativo-json', async () => {
      setComparativoReport(await reportesApi.getComparativo(comparativoFilters));
    }, 'Reporte comparativo generado.');
  };

  const onDownloadSanitario = (format: DownloadFormat) => {
    const filters = {
      fechaInicio: sanitarioFilters.fechaInicio,
      fechaFin: sanitarioFilters.fechaFin,
      estadoAprobacion: sanitarioFilters.estadoAprobacion === 'TODOS' ? undefined : sanitarioFilters.estadoAprobacion,
      idTipoEvento: parseOptionalId(sanitarioFilters.idTipoEvento),
    };
    void runDownload(`sanitario-${format}`, `Reporte sanitario ${format.toUpperCase()} descargado.`, () => (
      reportesApi.downloadSanitario(filters, format)
    ));
  };

  const onDownloadProductivo = (format: DownloadFormat) => {
    const filters = {
      fechaInicio: productivoFilters.fechaInicio,
      fechaFin: productivoFilters.fechaFin,
      idAnimal: parseOptionalId(productivoFilters.idAnimal),
      idLote: parseOptionalId(productivoFilters.idLote),
    };
    void runDownload(`productivo-${format}`, `Reporte productivo ${format.toUpperCase()} descargado.`, () => (
      reportesApi.downloadProductivo(filters, format)
    ));
  };

  const onDownloadAdministrativo = (format: DownloadFormat) => {
    void runDownload(`administrativo-${format}`, `Reporte administrativo ${format.toUpperCase()} descargado.`, () => (
      reportesApi.downloadAdministrativo(administrativoFilters, format)
    ));
  };

  const onDownloadComparativo = (format: DownloadFormat) => {
    const isRangeAValid = isValidDateRange(comparativoFilters.periodoAInicio, comparativoFilters.periodoAFin);
    const isRangeBValid = isValidDateRange(comparativoFilters.periodoBInicio, comparativoFilters.periodoBFin);
    if (!isRangeAValid || !isRangeBValid) {
      setMessage({ type: 'error', text: 'Valida las fechas de ambos periodos antes de exportar.' });
      return;
    }
    void runDownload(`comparativo-${format}`, `Reporte comparativo ${format.toUpperCase()} descargado.`, () => (
      reportesApi.downloadComparativo(comparativoFilters, format)
    ));
  };

  return (
    <section className="users-admin-shell" data-testid="reportes-page">
      <aside className="users-admin-sidebar">
        <div className="users-admin-sidebar__logo">
          <img src="/branding/logo-rancho-los-alpes.png" alt="Logo Rancho Los Alpes" />
        </div>
        <nav className="users-admin-sidebar__nav" aria-label="Navegacion de modulos">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              data-testid={`reportes-nav-${item.toLowerCase()}`}
              className={`users-admin-sidebar__nav-item ${item === 'Reportes' ? 'is-active' : ''}`}
              onClick={item === 'Reportes' ? undefined : () => onNavigate(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <footer className="users-admin-sidebar__footer">
          <p>{user?.nombreCompleto || 'Usuario'}</p>
          <small>{user?.rol || 'Sin rol'}</small>
          <Button type="button" className="users-admin-sidebar__logout" onClick={() => void logout()} data-testid="reportes-sidebar-logout">
            Cerrar sesion
          </Button>
        </footer>
      </aside>

      <main className="users-admin-main">
        <header className="users-admin-main__header" data-testid="reportes-header">
          <h1>Reportes</h1>
          <p>Modulo de reportes configurables y exportaciones JSON, CSV y PDF.</p>
        </header>

        <div className="users-admin-main__body">
          {!canView ? (
            <article className="users-admin-empty">
              <h2>Sin permisos para reportes</h2>
              <p>Tu rol actual no puede consultar reportes.</p>
            </article>
          ) : (
            <div className="reportes-content">
              {loadingCatalogs ? <p className="productivo-helper">Cargando catalogos...</p> : null}
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

              {activeTab === 'sanitario' && canSanitario ? (
                <div className="reportes-block">
                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Filtros sanitarios</h2></div>
                    <div className="productivo-field-row">
                      <label className="productivo-field"><span>Inicio</span><input type="date" value={sanitarioFilters.fechaInicio} onChange={(event) => setSanitarioFilters((prev) => ({ ...prev, fechaInicio: event.target.value }))} /></label>
                      <label className="productivo-field"><span>Fin</span><input type="date" value={sanitarioFilters.fechaFin} onChange={(event) => setSanitarioFilters((prev) => ({ ...prev, fechaFin: event.target.value }))} /></label>
                    </div>
                    <div className="productivo-field-row">
                      <label className="productivo-field">
                        <span>Estado</span>
                        <select value={sanitarioFilters.estadoAprobacion} onChange={(event) => setSanitarioFilters((prev) => ({ ...prev, estadoAprobacion: event.target.value as EstadoAprobacionFiltro }))}>
                          <option value="TODOS">Todos</option><option value="PENDIENTE">Pendiente</option><option value="APROBADO">Aprobado</option><option value="RECHAZADO">Rechazado</option>
                        </select>
                      </label>
                      <label className="productivo-field">
                        <span>Tipo evento</span>
                        <select value={sanitarioFilters.idTipoEvento} onChange={(event) => setSanitarioFilters((prev) => ({ ...prev, idTipoEvento: event.target.value }))}>
                          <option value="">Todos</option>{tiposEvento.map((item) => <option key={item.idTipoEvento} value={item.idTipoEvento}>{item.nombreTipo}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="reportes-actions">
                      <Button type="button" onClick={onRunSanitario} disabled={busyAction !== null}>{busyAction === 'sanitario-json' ? 'Generando...' : 'Generar'}</Button>
                      <Button type="button" variant="ghost" onClick={() => onDownloadSanitario('csv')} disabled={busyAction !== null}>CSV</Button>
                      <Button type="button" variant="ghost" onClick={() => onDownloadSanitario('pdf')} disabled={busyAction !== null}>PDF</Button>
                    </div>
                  </article>

                  <article className="productivo-card">
                    {sanitarioReport ? (
                      <>
                        <div className="reportes-kpi-grid">
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatNumber(sanitarioReport.resumen.totalRegistros)}</p><p className="reportes-kpi-label">Total</p></article>
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatNumber(sanitarioReport.resumen.aprobados)}</p><p className="reportes-kpi-label">Aprobados</p></article>
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatNumber(sanitarioReport.resumen.rechazados)}</p><p className="reportes-kpi-label">Rechazados</p></article>
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatNumber(sanitarioReport.resumen.pendientes)}</p><p className="reportes-kpi-label">Pendientes</p></article>
                        </div>
                        <div className="productivo-table-wrap">
                          <table className="productivo-table">
                            <thead><tr><th>Fecha</th><th>Arete</th><th>Tipo</th><th>Estado</th><th>Diagnostico</th></tr></thead>
                            <tbody>
                              {sanitarioReport.registros.length === 0 ? <tr><td colSpan={5} className="productivo-table-empty">Sin datos</td></tr> : sanitarioReport.registros.slice(0, 25).map((item) => (
                                <tr key={item.idEvento}>
                                  <td>{formatDate(item.fechaEvento)}</td>
                                  <td className="productivo-table-id">{item.animal.numeroArete}</td>
                                  <td>{item.tipoEvento.nombreTipo}</td>
                                  <td><span className={`productivo-status ${getEstadoClass(item.estadoAprobacion)}`}>{item.estadoAprobacion}</span></td>
                                  <td className="productivo-table-obs">{item.diagnostico || '--'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : <p className="reportes-empty">Genera el reporte para ver resultados.</p>}
                  </article>
                </div>
              ) : null}

              {activeTab === 'productivo' && canProductivo ? (
                <div className="reportes-block">
                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Filtros productivos</h2></div>
                    <div className="productivo-field-row">
                      <label className="productivo-field"><span>Inicio</span><input type="date" value={productivoFilters.fechaInicio} onChange={(event) => setProductivoFilters((prev) => ({ ...prev, fechaInicio: event.target.value }))} /></label>
                      <label className="productivo-field"><span>Fin</span><input type="date" value={productivoFilters.fechaFin} onChange={(event) => setProductivoFilters((prev) => ({ ...prev, fechaFin: event.target.value }))} /></label>
                    </div>
                    <div className="productivo-field-row">
                      <label className="productivo-field">
                        <span>Animal</span>
                        <select value={productivoFilters.idAnimal} onChange={(event) => setProductivoFilters((prev) => ({ ...prev, idAnimal: event.target.value }))}>
                          <option value="">Todos</option>{animales.map((item) => <option key={item.idAnimal} value={item.idAnimal}>{item.numeroArete}</option>)}
                        </select>
                      </label>
                      <label className="productivo-field">
                        <span>Lote</span>
                        <select value={productivoFilters.idLote} onChange={(event) => setProductivoFilters((prev) => ({ ...prev, idLote: event.target.value }))}>
                          <option value="">Todos</option>{lotes.map((item) => <option key={item.idLote} value={item.idLote}>#{item.idLote} [{item.estado}]</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="reportes-actions">
                      <Button type="button" onClick={onRunProductivo} disabled={busyAction !== null}>{busyAction === 'productivo-json' ? 'Generando...' : 'Generar'}</Button>
                      <Button type="button" variant="ghost" onClick={() => onDownloadProductivo('csv')} disabled={busyAction !== null}>CSV</Button>
                      <Button type="button" variant="ghost" onClick={() => onDownloadProductivo('pdf')} disabled={busyAction !== null}>PDF</Button>
                    </div>
                  </article>

                  <article className="productivo-card">
                    {productivoReport ? (
                      <>
                        <div className="reportes-kpi-grid reportes-kpi-grid--3">
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatNumber(productivoReport.resumen.totalRegistrosPeso)}</p><p className="reportes-kpi-label">Pesos</p></article>
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatDecimal(productivoReport.resumen.promedioPesoKg)} kg</p><p className="reportes-kpi-label">Promedio peso</p></article>
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatNumber(productivoReport.resumen.totalRegistrosLeche)}</p><p className="reportes-kpi-label">Leche</p></article>
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatDecimal(productivoReport.resumen.totalLitrosLeche)} L</p><p className="reportes-kpi-label">Litros totales</p></article>
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatNumber(productivoReport.resumen.totalEventosReproductivos)}</p><p className="reportes-kpi-label">Eventos repro</p></article>
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatDecimal(productivoReport.resumen.tasaNatalidadPorcentaje)}%</p><p className="reportes-kpi-label">Tasa natalidad</p></article>
                        </div>
                        <div className="productivo-table-wrap">
                          <table className="productivo-table">
                            <thead><tr><th>Fecha</th><th>Arete</th><th>Lote</th><th>Tipo</th><th>Valor</th><th>Estado</th></tr></thead>
                            <tbody>
                              {productivoRows.length === 0 ? <tr><td colSpan={6} className="productivo-table-empty">Sin datos</td></tr> : productivoRows.map((item) => (
                                <tr key={item.id}>
                                  <td>{formatDate(item.fecha)}</td>
                                  <td className="productivo-table-id">{item.arete}</td>
                                  <td>#{item.lote}</td>
                                  <td>{item.tipo}</td>
                                  <td>{item.valor}</td>
                                  <td><span className={`productivo-status ${getEstadoClass(item.estado)}`}>{item.estado}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : <p className="reportes-empty">Genera el reporte para ver resultados.</p>}
                  </article>
                </div>
              ) : null}

              {activeTab === 'administrativo' && canAdministrativo ? (
                <div className="reportes-block">
                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Filtros administrativos</h2></div>
                    <div className="productivo-field-row">
                      <label className="productivo-field"><span>Inicio</span><input type="date" value={administrativoFilters.fechaInicio} onChange={(event) => setAdministrativoFilters((prev) => ({ ...prev, fechaInicio: event.target.value }))} /></label>
                      <label className="productivo-field"><span>Fin</span><input type="date" value={administrativoFilters.fechaFin} onChange={(event) => setAdministrativoFilters((prev) => ({ ...prev, fechaFin: event.target.value }))} /></label>
                    </div>
                    <div className="reportes-actions">
                      <Button type="button" onClick={onRunAdministrativo} disabled={busyAction !== null}>{busyAction === 'administrativo-json' ? 'Generando...' : 'Generar'}</Button>
                      <Button type="button" variant="ghost" onClick={() => onDownloadAdministrativo('csv')} disabled={busyAction !== null}>CSV</Button>
                      <Button type="button" variant="ghost" onClick={() => onDownloadAdministrativo('pdf')} disabled={busyAction !== null}>PDF</Button>
                    </div>
                  </article>

                  <article className="productivo-card">
                    {administrativoReport ? (
                      <>
                        <div className="reportes-kpi-grid reportes-kpi-grid--4">
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatNumber(administrativoReport.resumen.totalSolicitudes)}</p><p className="reportes-kpi-label">Solicitudes</p></article>
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatNumber(administrativoReport.resumen.totalCompras)}</p><p className="reportes-kpi-label">Compras</p></article>
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">${formatDecimal(administrativoReport.resumen.montoCompras)}</p><p className="reportes-kpi-label">Monto compras</p></article>
                          <article className="reportes-kpi-card"><p className="reportes-kpi-value">{formatNumber(administrativoReport.resumen.totalMovimientosInventario)}</p><p className="reportes-kpi-label">Movimientos</p></article>
                        </div>
                        <h3 className="reportes-section-title">Compras realizadas</h3>
                        <div className="productivo-table-wrap">
                          <table className="productivo-table">
                            <thead><tr><th>Fecha</th><th>ID compra</th><th>ID solicitud</th><th>Responsable</th><th>Total</th></tr></thead>
                            <tbody>
                              {administrativoReport.compras.length === 0 ? <tr><td colSpan={5} className="productivo-table-empty">Sin compras</td></tr> : administrativoReport.compras.slice(0, 20).map((item) => (
                                <tr key={item.idCompra}>
                                  <td>{formatDate(item.fechaCompra)}</td>
                                  <td className="productivo-table-id">#{item.idCompra}</td>
                                  <td>#{item.idSolicitud}</td>
                                  <td>{item.realizador?.nombreCompleto || '--'}</td>
                                  <td>${formatDecimal(item.totalReal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <h3 className="reportes-section-title">Inventario actual</h3>
                        <div className="productivo-table-wrap">
                          <table className="productivo-table">
                            <thead><tr><th>Insumo</th><th>Tipo</th><th>Stock</th><th>Unidad</th></tr></thead>
                            <tbody>
                              {administrativoReport.inventarioActual.length === 0 ? <tr><td colSpan={4} className="productivo-table-empty">Sin inventario</td></tr> : administrativoReport.inventarioActual.slice(0, 20).map((item) => (
                                <tr key={item.idInsumo}>
                                  <td>{item.nombreInsumo}</td>
                                  <td>{item.tipoInsumo?.nombreTipo || '--'}</td>
                                  <td>{formatDecimal(item.stockActual, 2)}</td>
                                  <td>{item.unidadMedida}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : <p className="reportes-empty">Genera el reporte para ver resultados.</p>}
                  </article>
                </div>
              ) : null}

              {activeTab === 'comparativo' && canComparativo ? (
                <div className="reportes-block">
                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Comparativo historico</h2></div>
                    <label className="productivo-field">
                      <span>Modulo</span>
                      <select value={comparativoFilters.modulo} onChange={(event) => setComparativoFilters((prev) => ({ ...prev, modulo: event.target.value as 'productivo' | 'sanitario' }))}>
                        <option value="productivo">Productivo</option>
                        <option value="sanitario">Sanitario</option>
                      </select>
                    </label>
                    <div className="reportes-period-grid">
                      <article className="reportes-period-card">
                        <h3>Periodo A</h3>
                        <div className="productivo-field-row">
                          <label className="productivo-field"><span>Inicio</span><input type="date" value={comparativoFilters.periodoAInicio} onChange={(event) => setComparativoFilters((prev) => ({ ...prev, periodoAInicio: event.target.value }))} /></label>
                          <label className="productivo-field"><span>Fin</span><input type="date" value={comparativoFilters.periodoAFin} onChange={(event) => setComparativoFilters((prev) => ({ ...prev, periodoAFin: event.target.value }))} /></label>
                        </div>
                      </article>
                      <article className="reportes-period-card">
                        <h3>Periodo B</h3>
                        <div className="productivo-field-row">
                          <label className="productivo-field"><span>Inicio</span><input type="date" value={comparativoFilters.periodoBInicio} onChange={(event) => setComparativoFilters((prev) => ({ ...prev, periodoBInicio: event.target.value }))} /></label>
                          <label className="productivo-field"><span>Fin</span><input type="date" value={comparativoFilters.periodoBFin} onChange={(event) => setComparativoFilters((prev) => ({ ...prev, periodoBFin: event.target.value }))} /></label>
                        </div>
                      </article>
                    </div>
                    <div className="reportes-actions">
                      <Button type="button" onClick={onRunComparativo} disabled={busyAction !== null}>{busyAction === 'comparativo-json' ? 'Generando...' : 'Generar'}</Button>
                      <Button type="button" variant="ghost" onClick={() => onDownloadComparativo('csv')} disabled={busyAction !== null}>CSV</Button>
                      <Button type="button" variant="ghost" onClick={() => onDownloadComparativo('pdf')} disabled={busyAction !== null}>PDF</Button>
                    </div>
                  </article>

                  <article className="productivo-card">
                    {comparativoReport ? (
                      <div className="productivo-table-wrap">
                        <table className="productivo-table">
                          <thead><tr><th>Indicador</th><th>Periodo A</th><th>Periodo B</th><th>Delta</th><th>Variacion</th></tr></thead>
                          <tbody>
                            {comparativoRows.length === 0 ? <tr><td colSpan={5} className="productivo-table-empty">Sin indicadores</td></tr> : comparativoRows.map((item) => (
                              <tr key={item.indicador}>
                                <td>{item.indicador}</td>
                                <td>{formatMetricValue(item.periodoA)}</td>
                                <td>{formatMetricValue(item.periodoB)}</td>
                                <td><span className={`reportes-delta ${item.delta > 0 ? 'is-up' : item.delta < 0 ? 'is-down' : 'is-flat'}`}>{item.delta > 0 ? '+' : ''}{formatDecimal(item.delta, 2)}</span></td>
                                <td><span className={`reportes-delta ${item.porcentaje > 0 ? 'is-up' : item.porcentaje < 0 ? 'is-down' : 'is-flat'}`}>{item.porcentaje > 0 ? '+' : ''}{formatDecimal(item.porcentaje, 2)}%</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <p className="reportes-empty">Genera el comparativo para ver resultados.</p>}
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
