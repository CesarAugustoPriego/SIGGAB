import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { getVisibleNavItemsForRole } from '../../auth/navigation-utils';
import { Button, NAV_ITEMS, LogOut, Beef, Syringe, Scale, Bell, ShoppingCart, AlertTriangle, Package, BarChart3, HeartPulse, ScrollText, RefreshCw } from '../../../shared/ui';
import type { LucideIcon } from '../../../shared/ui';
import { dashboardApi } from '../dashboard-api';
import {
  canViewResumen, canViewProduccion, canViewSanitario,
  canViewInventarioDash, canViewBitacora,
  fmtDate, fmtDateTime, fmtNum, fmtPct, timeAgo, daysUntil,
  getAccionColor, getEstadoColor, getReproColor,
  getDashboardErrorMessage,
} from '../dashboard-utils';
import type {
  DashboardResumen, DashboardGanado, DashboardProduccion,
  DashboardSanitario, DashboardInventario, BitacoraEntry,
} from '../dashboard-types';

interface Props {
  onGoHome?: () => void;
  onGoUsersAdmin?: () => void;
  onNavigateModule?: (name: string) => void;
}

export function DashboardPage({ onGoHome, onGoUsersAdmin, onNavigateModule }: Props) {
  const { user, logout } = useAuth();
  const rol = user?.rol;
  const visibleNavItems = useMemo(() => getVisibleNavItemsForRole(rol, NAV_ITEMS), [rol]);

  const showResumen = useMemo(() => canViewResumen(rol), [rol]);
  const showProduccion = useMemo(() => canViewProduccion(rol), [rol]);
  const showSanitario = useMemo(() => canViewSanitario(rol), [rol]);
  const showInventario = useMemo(() => canViewInventarioDash(rol), [rol]);
  const showBitacora = useMemo(() => canViewBitacora(rol), [rol]);

  // ─── State ────────────────────────────────────────────────────────────────────
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [ganado, setGanado] = useState<DashboardGanado | null>(null);
  const [produccion, setProduccion] = useState<DashboardProduccion | null>(null);
  const [sanitario, setSanitario] = useState<DashboardSanitario | null>(null);
  const [inventario, setInventario] = useState<DashboardInventario | null>(null);
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>([]);
  const [bitacoraLimit, setBitacoraLimit] = useState(100);
  const [bitacoraSearch, setBitacoraSearch] = useState('');

  const [sseConnected, setSseConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const esRef = useRef<EventSource | null>(null);

  // ─── Initial fetch ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const promises: Promise<void>[] = [];

      if (showResumen) {
        promises.push(
          dashboardApi.getResumen().then(r => setResumen(r)),
          dashboardApi.getGanado().then(r => setGanado(r)),
        );
      }
      if (showProduccion) {
        promises.push(dashboardApi.getProduccion().then(r => setProduccion(r)));
      }
      if (showSanitario) {
        promises.push(dashboardApi.getSanitario().then(r => setSanitario(r)));
      }
      if (showInventario) {
        promises.push(dashboardApi.getInventario().then(r => setInventario(r)));
      }
      if (showBitacora) {
        promises.push(dashboardApi.getBitacora(bitacoraLimit).then(r => setBitacora(r)));
      }

      await Promise.all(promises);
    } catch (err) {
      setError(getDashboardErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showResumen, showProduccion, showSanitario, showInventario, showBitacora, bitacoraLimit]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── SSE Stream ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showResumen) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const url = `${import.meta.env.VITE_API_BASE_URL || '/api'}/dashboard/stream`;
    const es = new EventSource(`${url}?token=${token}`);
    esRef.current = es;

    es.addEventListener('dashboard-resumen', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as DashboardResumen;
        setResumen(data);
      } catch { /* skip */ }
    });

    es.onopen = () => setSseConnected(true);
    es.onerror = () => {
      setSseConnected(false);
      es.close();
      // Retry after 10s
      setTimeout(() => {
        if (esRef.current === es) {
          esRef.current = null;
        }
      }, 10_000);
    };

    return () => { es.close(); esRef.current = null; setSseConnected(false); };
  }, [showResumen]);

  // ─── Sidebar navigation ───────────────────────────────────────────────────────


  const nav = (m: string) => {
    if (m === 'Usuarios' && onGoUsersAdmin) return onGoUsersAdmin();
    if (onNavigateModule) return onNavigateModule(m);
    return onGoHome?.();
  };

  // ─── KPI card data ────────────────────────────────────────────────────────────
  const kpiCards = useMemo(() => {
    if (!resumen) return [];
    return [
      { label: 'Animales activos', value: resumen.totalAnimalesActivos, icon: Beef, color: '#22c55e', mod: 'Ganado' },
      { label: 'Vacunaciones del mes', value: resumen.vacunacionesMes, icon: Syringe, color: '#3b82f6', mod: 'Sanitario' },
      { label: 'Pesos por validar', value: resumen.pesosPendientesValidar, icon: Scale, color: resumen.pesosPendientesValidar > 0 ? '#f59e0b' : '#22c55e', mod: 'Produccion' },
      { label: 'Alertas próximas (7d)', value: resumen.alertasProximas7Dias, icon: Bell, color: resumen.alertasProximas7Dias > 0 ? '#ef4444' : '#22c55e', mod: 'Sanitario' },
      { label: 'Solicitudes pendientes', value: resumen.solicitudesCompraPendientes, icon: ShoppingCart, color: resumen.solicitudesCompraPendientes > 0 ? '#f59e0b' : '#22c55e', mod: 'Inventario' },
      { label: 'Insumos agotados', value: resumen.insumosStockAgotado, icon: AlertTriangle, color: resumen.insumosStockAgotado > 0 ? '#ef4444' : '#22c55e', mod: 'Inventario' },
      { label: 'Tipos de insumo', value: resumen.inventarioTotalItems, icon: Package, color: '#64748b', mod: 'Inventario' },
      { label: 'Stock total (unidades)', value: resumen.inventarioTotalUnidades, icon: BarChart3, color: '#22c55e', mod: 'Inventario' },
    ];
  }, [resumen]);

  // ─── Bitácora filtering ───────────────────────────────────────────────────────
  const filteredBitacora = useMemo(() => {
    if (!bitacoraSearch.trim()) return bitacora;
    const term = bitacoraSearch.toLowerCase();
    return bitacora.filter(b =>
      b.usuario.nombreCompleto.toLowerCase().includes(term) ||
      b.usuario.username.toLowerCase().includes(term) ||
      b.accion.toLowerCase().includes(term) ||
      b.tablaAfectada.toLowerCase().includes(term)
    );
  }, [bitacora, bitacoraSearch]);

  // ─── Ganado chart helpers ─────────────────────────────────────────────────────
  const maxRaza = useMemo(() => {
    if (!ganado?.porRaza?.length) return 1;
    return Math.max(...ganado.porRaza.map(r => r._count.idAnimal), 1);
  }, [ganado]);

  const totalAnimales = useMemo(() => {
    if (!ganado?.porEstado?.length) return 0;
    return ganado.porEstado.reduce((s, g) => s + g._count.idAnimal, 0);
  }, [ganado]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <section className="users-admin-shell" data-testid="dashboard-page">
      {/* ── Sidebar ── */}
      <aside className="users-admin-sidebar">
        <div className="users-admin-sidebar__logo"><img src="/branding/logo-rancho-los-alpes.png" alt="Logo Rancho Los Alpes" /></div>
        <nav className="users-admin-sidebar__nav" aria-label="Navegacion de modulos">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
            <button key={item.label} type="button" data-testid={`dash-nav-${item.label.toLowerCase()}`}
              className={`users-admin-sidebar__nav-item ${item.label === 'Dashboard' ? 'is-active' : ''}`}
              onClick={item.label === 'Dashboard' ? undefined : () => nav(item.label)}>
              <Icon size={18} aria-hidden /> {item.label}
            </button>
            );
          })}
        </nav>
        <footer className="users-admin-sidebar__footer">
          <p>{user?.nombreCompleto || 'Usuario'}</p>
          <small>{user?.rol || 'Sin rol'}</small>
          <Button type="button" className="users-admin-sidebar__logout" onClick={logout} data-testid="dash-sidebar-logout"><LogOut size={15} aria-hidden /> Cerrar sesión</Button>
        </footer>
      </aside>

      {/* ── Main content ── */}
      <main className="users-admin-main">
        <header className="users-admin-main__header" data-testid="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <div className="dash-subtitle">
              {sseConnected ? (
                <span className="dash-live-badge is-connected">● En vivo</span>
              ) : (
                <span className="dash-live-badge is-disconnected">● Desconectado</span>
              )}
              {resumen && <span className="dash-updated">{timeAgo(resumen.generadoEn)}</span>}
            </div>
          </div>
          <Button type="button" variant="ghost" onClick={fetchAll}><RefreshCw size={14} aria-hidden /> Actualizar</Button>
        </header>

        {error && <p className="users-message users-message--error" data-testid="dashboard-error">{error}</p>}

        <div className="users-admin-main__body">
        {loading ? (
          <article className="users-admin-empty"><h2>Cargando dashboard...</h2><p>Preparando indicadores.</p></article>
        ) : (
          <div className="dash-content">
            {/* ════════════════════════════════════════════════════════════════════
                SECCIÓN 1: KPIs
                ════════════════════════════════════════════════════════════════════ */}
            {showResumen && resumen && (
              <section className="dash-section" data-testid="dash-kpis">
                <div className="dash-kpi-grid">
                  {kpiCards.map((card, i) => (
                    <button
                      key={i}
                      className="dash-kpi-card"
                      onClick={() => nav(card.mod)}
                      style={{ '--kpi-accent': card.color } as React.CSSProperties}
                      data-testid={`kpi-card-${i}`}
                    >
                      <span className="dash-kpi-icon">{(() => { const KpiIcon = card.icon as LucideIcon; return <KpiIcon size={24} />; })()}</span>
                      <span className="dash-kpi-value">{fmtNum(card.value)}</span>
                      <span className="dash-kpi-label">{card.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                SECCIÓN 2 + 3: Ganado + Producción (side by side)
                ════════════════════════════════════════════════════════════════════ */}
            <div className="dash-row">
              {/* ── Ganado ── */}
              {showResumen && ganado && (
                <section className="dash-section dash-half" data-testid="dash-ganado">
                  <h2 className="dash-section-title"><Beef size={20} aria-hidden /> Ganado</h2>

                  {/* Por estado — dona CSS */}
                  <h3 className="dash-label">Distribución por estado</h3>
                  <div className="dash-donut-wrap">
                    {ganado.porEstado.map((g, i) => {
                      const pct = totalAnimales > 0
                        ? Math.round((g._count.idAnimal / totalAnimales) * 100)
                        : 0;
                      return (
                        <div key={i} className="dash-donut-item">
                          <span className="dash-donut-dot" style={{ background: getEstadoColor(g.estadoActual) }} />
                          <span className="dash-donut-label">{g.estadoActual}</span>
                          <strong>{g._count.idAnimal}</strong>
                          <span className="dash-donut-pct">({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Por raza — barras */}
                  <h3 className="dash-label">Animales activos por raza</h3>
                  <div className="dash-bars">
                    {ganado.porRaza.map((r, i) => (
                      <div key={i} className="dash-bar-row">
                        <span className="dash-bar-label">{r.nombreRaza}</span>
                        <div className="dash-bar-track">
                          <div
                            className="dash-bar-fill"
                            style={{ width: `${(r._count.idAnimal / maxRaza) * 100}%` }}
                          />
                        </div>
                        <span className="dash-bar-count">{r._count.idAnimal}</span>
                      </div>
                    ))}
                    {ganado.porRaza.length === 0 && <p className="dash-empty">Sin datos de razas</p>}
                  </div>

                  {/* Recientes */}
                  <h3 className="dash-label">Últimos ingresos</h3>
                  <table className="productivo-table">
                    <thead><tr><th>Arete</th><th>Nombre</th><th>Raza</th><th>Ingreso</th></tr></thead>
                    <tbody>
                      {ganado.recienIngresados.map(a => (
                        <tr key={a.idAnimal}>
                          <td><strong>{a.numeroArete}</strong></td>
                          <td>{a.nombre || '—'}</td>
                          <td>{a.raza?.nombreRaza || '—'}</td>
                          <td>{fmtDate(a.fechaIngreso)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Button type="button" variant="ghost" onClick={() => nav('Ganado')}>Ver todos →</Button>
                </section>
              )}

              {/* ── Producción ── */}
              {showProduccion && produccion && (
                <section className="dash-section dash-half" data-testid="dash-produccion">
                  <h2 className="dash-section-title"><BarChart3 size={20} aria-hidden /> Producción <small>(últimos 30 días)</small></h2>

                  <div className="dash-stat-grid">
                    <div className="dash-stat-card">
                      <span className="dash-stat-value">+{produccion.peso.gananciaPromedioKg} kg</span>
                      <span className="dash-stat-label">Ganancia peso prom.</span>
                      <span className="dash-stat-sub">{produccion.peso.totalRegistros} registros</span>
                    </div>
                    <div className="dash-stat-card">
                      <span className="dash-stat-value">{fmtNum(produccion.leche.totalLitros)} L</span>
                      <span className="dash-stat-label">Leche total</span>
                      <span className="dash-stat-sub">Promedio: {produccion.leche.promedioLitros.toFixed(1)} L</span>
                    </div>
                    <div className="dash-stat-card" style={{ '--kpi-accent': '#22c55e' } as React.CSSProperties}>
                      <span className="dash-stat-value">{fmtPct(produccion.tasas.natalidadPorcentaje)}</span>
                      <span className="dash-stat-label">Tasa natalidad</span>
                      <span className="dash-stat-sub">{produccion.tasas.partosPeriodo} partos</span>
                    </div>
                    <div className="dash-stat-card" style={{ '--kpi-accent': produccion.tasas.mortalidadPorcentaje > 2 ? '#ef4444' : '#22c55e' } as React.CSSProperties}>
                      <span className="dash-stat-value">{fmtPct(produccion.tasas.mortalidadPorcentaje)}</span>
                      <span className="dash-stat-label">Tasa mortalidad</span>
                      <span className="dash-stat-sub">{produccion.tasas.muertesPeriodo} muertes</span>
                    </div>
                  </div>

                  {/* Eventos reproductivos */}
                  <h3 className="dash-label">Eventos reproductivos</h3>
                  <div className="dash-repro-badges">
                    {produccion.eventosReproductivos.map((ev, i) => (
                      <span
                        key={i}
                        className="dash-repro-badge"
                        style={{ '--repro-color': getReproColor(ev.tipoEvento) } as React.CSSProperties}
                      >
                        {ev.tipoEvento} <strong>{ev._count.idEventoReproductivo}</strong>
                      </span>
                    ))}
                    {produccion.eventosReproductivos.length === 0 && <p className="dash-empty">Sin eventos</p>}
                  </div>

                  <Button type="button" variant="ghost" onClick={() => nav('Produccion')}>Ir a Productivo →</Button>
                </section>
              )}
            </div>

            {/* ════════════════════════════════════════════════════════════════════
                SECCIÓN 4 + 5: Sanitario + Inventario (side by side)
                ════════════════════════════════════════════════════════════════════ */}
            <div className="dash-row">
              {/* ── Sanitario ── */}
              {showSanitario && sanitario && (
                <section className="dash-section dash-half" data-testid="dash-sanitario">
                  <h2 className="dash-section-title"><HeartPulse size={20} aria-hidden /> Sanitario</h2>

                  <h3 className="dash-label">Próximos eventos (15 días)</h3>
                  {sanitario.proximosEventos.length > 0 ? (
                    <table className="productivo-table">
                      <thead><tr><th>Fecha</th><th>Arete</th><th>Tipo</th><th>Urgencia</th></tr></thead>
                      <tbody>
                        {sanitario.proximosEventos.map(ev => {
                          const days = daysUntil(ev.fechaProgramada);
                          return (
                            <tr key={ev.idCalendario}>
                              <td>{fmtDate(ev.fechaProgramada)}</td>
                              <td><strong>{ev.animal.numeroArete}</strong></td>
                              <td>{ev.tipoEvento.nombreTipo}</td>
                              <td>
                                <span className={`dash-urgency ${days <= 3 ? 'is-urgent' : days <= 7 ? 'is-soon' : ''}`}>
                                  {days}d
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="dash-ok">Sin eventos próximos ✓</p>
                  )}

                  <h3 className="dash-label" style={{ marginTop: '1rem' }}>Pendientes de aprobación</h3>
                  {sanitario.pendientesAprobacion.length > 0 ? (
                    <div className="dash-pending-list">
                      {sanitario.pendientesAprobacion.map(ev => (
                        <div key={ev.idEventoSanitario} className="dash-pending-item">
                          <span className="productivo-status is-pending">PENDIENTE</span>
                          <span>{ev.animal.numeroArete} — {ev.tipoEvento.nombreTipo}</span>
                          <span className="dash-date-sm">{fmtDate(ev.fechaEvento)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="dash-ok">Sin pendientes ✓</p>
                  )}

                  <Button type="button" variant="ghost" onClick={() => nav('Sanitario')}>Ir a Sanitario →</Button>
                </section>
              )}

              {/* ── Inventario ── */}
              {showInventario && inventario && (
                <section className="dash-section dash-half" data-testid="dash-inventario">
                  <h2 className="dash-section-title"><Package size={20} aria-hidden /> Inventario</h2>

                  <h3 className="dash-label">Insumos agotados</h3>
                  {inventario.agotados.length > 0 ? (
                    <div className="dash-alert-list">
                      {inventario.agotados.map(ins => (
                        <div key={ins.idInsumo} className="dash-alert-item is-danger">
                          <span className="inventario-stock is-stock-empty">AGOTADO</span>
                          <span>{ins.nombreInsumo}</span>
                          <span className="dash-date-sm">{ins.tipoInsumo.nombreTipo}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="dash-ok">Todo en stock ✓</p>
                  )}

                  <h3 className="dash-label" style={{ marginTop: '0.75rem' }}>Bajo stock (≤ 10)</h3>
                  {inventario.bajoStock.length > 0 ? (
                    <div className="dash-stock-bars">
                      {inventario.bajoStock.map(ins => (
                        <div key={ins.idInsumo} className="dash-stock-row">
                          <span className="dash-stock-name">{ins.nombreInsumo}</span>
                          <div className="dash-stock-track">
                            <div
                              className="dash-stock-fill"
                              style={{ width: `${Math.min(Number(ins.stockActual) * 10, 100)}%` }}
                            />
                          </div>
                          <span className="dash-stock-val">{ins.stockActual} {ins.unidadMedida}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="dash-ok">Todo por encima de 10 ✓</p>
                  )}

                  <h3 className="dash-label" style={{ marginTop: '0.75rem' }}>Últimos movimientos</h3>
                  <table className="productivo-table">
                    <thead><tr><th>Fecha</th><th>Insumo</th><th>Tipo</th><th>Cant.</th></tr></thead>
                    <tbody>
                      {inventario.movimientosRecientes.map(m => (
                        <tr key={m.idMovimiento}>
                          <td>{fmtDate(m.fechaMovimiento)}</td>
                          <td>{m.insumo.nombreInsumo}</td>
                          <td>
                            <span className={`inventario-mov-badge ${m.tipoMovimiento === 'ENTRADA' ? 'is-entrada' : 'is-salida'}`}>
                              {m.tipoMovimiento === 'ENTRADA' ? '↑' : '↓'} {m.tipoMovimiento}
                            </span>
                          </td>
                          <td>{m.cantidad} {m.insumo.unidadMedida}</td>
                        </tr>
                      ))}
                      {inventario.movimientosRecientes.length === 0 && (
                        <tr><td colSpan={4} className="dash-empty">Sin movimientos recientes</td></tr>
                      )}
                    </tbody>
                  </table>
                  <Button type="button" variant="ghost" onClick={() => nav('Inventario')}>Ir a Inventario →</Button>
                </section>
              )}
            </div>

            {/* ════════════════════════════════════════════════════════════════════
                SECCIÓN 6: Bitácora
                ════════════════════════════════════════════════════════════════════ */}
            {showBitacora && (
              <section className="dash-section" data-testid="dash-bitacora">
                <h2 className="dash-section-title"><ScrollText size={20} aria-hidden /> Bitácora de Auditoría</h2>

                <div className="dash-bitacora-controls">
                  <input
                    type="text"
                    className="ganado-search__input"
                    placeholder="Buscar por usuario, acción o tabla..."
                    value={bitacoraSearch}
                    onChange={e => setBitacoraSearch(e.target.value)}
                    data-testid="bitacora-search"
                  />
                  <select
                    className="ganado-search__select"
                    value={bitacoraLimit}
                    onChange={e => setBitacoraLimit(Number(e.target.value))}
                    data-testid="bitacora-limit"
                  >
                    <option value={50}>50 registros</option>
                    <option value={100}>100 registros</option>
                    <option value={200}>200 registros</option>
                    <option value={500}>500 registros</option>
                  </select>
                </div>

                <div className="productivo-table-wrap">
                  <table className="productivo-table">
                    <thead>
                      <tr>
                        <th>Fecha/Hora</th>
                        <th>Usuario</th>
                        <th>Acción</th>
                        <th>Tabla</th>
                        <th>Reg. #</th>
                        <th>Detalles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBitacora.map(b => (
                        <tr key={b.idBitacora}>
                          <td className="dash-date-sm">{fmtDateTime(b.fechaHora)}</td>
                          <td>
                            {b.usuario.nombreCompleto}
                            <br />
                            <span className="dash-username">@{b.usuario.username}</span>
                          </td>
                          <td>
                            <span className={`dash-action-badge ${getAccionColor(b.accion)}`}>
                              {b.accion}
                            </span>
                          </td>
                          <td>{b.tablaAfectada}</td>
                          <td>#{b.idRegistro}</td>
                          <td className="productivo-table-obs">
                            {b.detalles ? JSON.stringify(b.detalles).slice(0, 60) : '—'}
                          </td>
                        </tr>
                      ))}
                      {filteredBitacora.length === 0 && (
                        <tr><td colSpan={6} className="dash-empty">Sin registros</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
        </div>
      </main>
    </section>
  );
}
