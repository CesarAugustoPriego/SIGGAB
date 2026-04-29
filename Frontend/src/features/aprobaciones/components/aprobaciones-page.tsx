import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { getVisibleNavItemsForRole } from '../../auth/navigation-utils';
import { Button, NAV_ITEMS, LogOut, CheckCircle, HeartPulse, BarChart3, ShoppingCart, Check, X, RefreshCw } from '../../../shared/ui';
import { ApiClientError } from '../../../types/api';
import { sanitarioApi } from '../../sanitario/sanitario-api';
import { productivoApi } from '../../productivo/productivo-api';
import { inventarioApi } from '../../inventario/inventario-api';
import type { EventoSanitario } from '../../sanitario/sanitario-types';
import type { RegistroPeso, ProduccionLeche, EventoReproductivo } from '../../productivo/productivo-types';
import type { SolicitudCompra } from '../../inventario/inventario-types';
import {
  canViewAprobaciones,
  canApproveSanitario,
  canApproveProductivo,
  canApproveSolicitudes,
  getAprobacionesErrorMessage,
  fmtDate,
} from '../aprobaciones-utils';

interface Props {
  onGoHome: () => void;
  onGoUsersAdmin?: () => void;
  onNavigateModule?: (name: string) => void;
}

interface Msg { type: 'error' | 'success'; text: string; }

export function AprobacionesPage({ onGoHome, onGoUsersAdmin, onNavigateModule }: Props) {
  const { user, logout } = useAuth();
  const rol = user?.rol;
  const visibleNavItems = useMemo(() => getVisibleNavItemsForRole(rol, NAV_ITEMS), [rol]);

  const canView = useMemo(() => canViewAprobaciones(rol), [rol]);
  const canSan = useMemo(() => canApproveSanitario(rol), [rol]);
  const canProd = useMemo(() => canApproveProductivo(rol), [rol]);
  const canSol = useMemo(() => canApproveSolicitudes(rol), [rol]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Msg | null>(null);

  // ── Pending data ──
  const [sanitarios, setSanitarios] = useState<EventoSanitario[]>([]);
  const [pesos, setPesos] = useState<RegistroPeso[]>([]);
  const [leches, setLeches] = useState<ProduccionLeche[]>([]);
  const [reproductivos, setReproductivos] = useState<EventoReproductivo[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudCompra[]>([]);

  const [busyId, setBusyId] = useState<string | null>(null);

  // ── Fetch all pending ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const promises: Promise<void>[] = [];

      if (canSan) {
        promises.push(
          sanitarioApi.getEventos({ estadoAprobacion: 'PENDIENTE' }).then(r => setSanitarios(r)),
        );
      }
      if (canProd) {
        promises.push(
          productivoApi.getRegistrosPeso({ estado: 'PENDIENTE' }).then(r => setPesos(r)),
          productivoApi.getProduccionLeche({ estado: 'PENDIENTE' }).then(r => setLeches(r)),
          productivoApi.getEventosReproductivos({ estado: 'PENDIENTE' }).then(r => setReproductivos(r)),
        );
      }
      if (canSol) {
        promises.push(
          inventarioApi.getSolicitudes({ estado: 'PENDIENTE' }).then(r => setSolicitudes(r)),
        );
      }

      await Promise.all(promises);
    } catch (err) {
      setMsg({ type: 'error', text: getAprobacionesErrorMessage(err) });
      if (err instanceof ApiClientError && err.status === 401) await logout();
    } finally {
      setLoading(false);
    }
  }, [canSan, canProd, canSol, logout]);

  useEffect(() => { if (canView) void fetchAll(); else setLoading(false); }, [canView, fetchAll]);

  // ── Approve/reject handlers ──
  const approveSanitario = async (id: number, estado: 'APROBADO' | 'RECHAZADO') => {
    const key = `san-${id}`;
    try {
      setBusyId(key);
      await sanitarioApi.aprobarEvento(id, { estadoAprobacion: estado });
      setSanitarios(prev => prev.filter(e => e.idEvento !== id));
      setMsg({ type: 'success', text: `Evento sanitario #${id} ${estado === 'APROBADO' ? 'aprobado' : 'rechazado'}.` });
    } catch (err) {
      setMsg({ type: 'error', text: getAprobacionesErrorMessage(err) });
    } finally { setBusyId(null); }
  };

  const approvePeso = async (id: number, estado: 'APROBADO' | 'RECHAZADO') => {
    const key = `peso-${id}`;
    try {
      setBusyId(key);
      await productivoApi.validarRegistroPeso(id, { estadoValidacion: estado });
      setPesos(prev => prev.filter(r => r.idRegistroPeso !== id));
      setMsg({ type: 'success', text: `Registro de peso #${id} ${estado === 'APROBADO' ? 'aprobado' : 'rechazado'}.` });
    } catch (err) {
      setMsg({ type: 'error', text: getAprobacionesErrorMessage(err) });
    } finally { setBusyId(null); }
  };

  const approveLeche = async (id: number, estado: 'APROBADO' | 'RECHAZADO') => {
    const key = `leche-${id}`;
    try {
      setBusyId(key);
      await productivoApi.validarProduccionLeche(id, { estadoValidacion: estado });
      setLeches(prev => prev.filter(r => r.idProduccion !== id));
      setMsg({ type: 'success', text: `Producción de leche #${id} ${estado === 'APROBADO' ? 'aprobada' : 'rechazada'}.` });
    } catch (err) {
      setMsg({ type: 'error', text: getAprobacionesErrorMessage(err) });
    } finally { setBusyId(null); }
  };

  const approveRepro = async (id: number, estado: 'APROBADO' | 'RECHAZADO') => {
    const key = `repro-${id}`;
    try {
      setBusyId(key);
      await productivoApi.validarEventoReproductivo(id, { estadoValidacion: estado });
      setReproductivos(prev => prev.filter(r => r.idEventoReproductivo !== id));
      setMsg({ type: 'success', text: `Evento reproductivo #${id} ${estado === 'APROBADO' ? 'aprobado' : 'rechazado'}.` });
    } catch (err) {
      setMsg({ type: 'error', text: getAprobacionesErrorMessage(err) });
    } finally { setBusyId(null); }
  };

  const approveSolicitud = async (id: number, estado: 'APROBADA' | 'RECHAZADA') => {
    const key = `sol-${id}`;
    try {
      setBusyId(key);
      await inventarioApi.aprobarSolicitud(id, { estadoSolicitud: estado });
      setSolicitudes(prev => prev.filter(s => s.idSolicitud !== id));
      setMsg({ type: 'success', text: `Solicitud #${id} ${estado === 'APROBADA' ? 'aprobada' : 'rechazada'}.` });
    } catch (err) {
      setMsg({ type: 'error', text: getAprobacionesErrorMessage(err) });
    } finally { setBusyId(null); }
  };

  // ── Counts ──
  const totalSanitarios = sanitarios.length;
  const totalProductivos = pesos.length + leches.length + reproductivos.length;
  const totalSolicitudes = solicitudes.length;
  const totalPendientes = totalSanitarios + totalProductivos + totalSolicitudes;

  // ── Nav ──
  const nav = (m: string) => {
    if (m === 'Usuarios' && onGoUsersAdmin) return onGoUsersAdmin();
    if (onNavigateModule) return onNavigateModule(m);
    return onGoHome();
  };

  // ── Render ──
  return (
    <section className="users-admin-shell" data-testid="aprobaciones-page">
      {/* ── Sidebar ── */}
      <aside className="users-admin-sidebar">
        <div className="users-admin-sidebar__logo"><img src="/branding/logo-rancho-los-alpes.png" alt="Logo" /></div>
        <nav className="users-admin-sidebar__nav" aria-label="Navegacion de modulos">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            return (
            <button key={item.label} type="button" data-testid={`aprob-nav-${item.label.toLowerCase()}`}
              className={`users-admin-sidebar__nav-item ${item.label === 'Aprobaciones' ? 'is-active' : ''}`}
              onClick={item.label === 'Aprobaciones' ? undefined : () => nav(item.label)}><Icon size={18} aria-hidden /> {item.label}</button>
            );
          })}
        </nav>
        <footer className="users-admin-sidebar__footer">
          <p>{user?.nombreCompleto || 'Usuario'}</p><small>{user?.rol || 'Sin rol'}</small>
          <Button type="button" className="users-admin-sidebar__logout" onClick={logout} data-testid="aprob-sidebar-logout"><LogOut size={15} aria-hidden /> Cerrar sesión</Button>
        </footer>
      </aside>

      {/* ── Main content ── */}
      <main className="users-admin-main">
        <header className="users-admin-main__header" data-testid="aprobaciones-header">
          <div>
            <h1>Aprobaciones</h1>
            <p>Flujo oficial por rol</p>
          </div>
          <Button type="button" variant="ghost" onClick={fetchAll} disabled={loading}><RefreshCw size={14} aria-hidden /> Actualizar</Button>
        </header>

        <div className="users-admin-main__body">
          {!canView ? (
            <article className="users-admin-empty">
              <h2>Acceso restringido</h2>
              <p>Tu rol no tiene permisos para gestionar aprobaciones.</p>
              <Button type="button" variant="ghost" onClick={onGoHome}>Volver</Button>
            </article>
          ) : loading ? (
            <article className="users-admin-empty"><h2>Cargando pendientes...</h2><p>Consultando registros por aprobar.</p></article>
          ) : (
            <div className="productivo-content">
              {msg ? <p className={`users-message users-message--${msg.type}`}>{msg.text}</p> : null}

              {/* ── Tabs ── */}
              <div className="productivo-tabs">
                {canSan && (
                  <button type="button" className={`productivo-tab ${canSan && totalSanitarios > 0 ? 'is-active' : ''}`}>
                    <HeartPulse size={16} aria-hidden /> Sanitarios ({totalSanitarios})
                  </button>
                )}
                {canProd && (
                  <button type="button" className={`productivo-tab ${!canSan && canProd ? 'is-active' : ''}`}>
                    <BarChart3 size={16} aria-hidden /> Productivos ({totalProductivos})
                  </button>
                )}
                {canSol && (
                  <button type="button" className={`productivo-tab ${!canSan && !canProd && canSol ? 'is-active' : ''}`}>
                    <ShoppingCart size={16} aria-hidden /> Compras ({totalSolicitudes})
                  </button>
                )}
              </div>

              {/* Sanitarios Table (visible if active or if we show all vertically... let's just show them vertically like Productivo if no state is used, 
                  but Productivo uses state. Let's just render all sections sequentially for the hub!) */}
              <div className="productivo-tab-content">
                
                {canSan && totalSanitarios > 0 && (
                  <article className="productivo-card">
                    <div className="users-admin-card__title">
                      <h2>Pendientes Sanitarios</h2><small>{totalSanitarios} registros</small>
                    </div>
                    <div className="productivo-table-wrap">
                      <table className="productivo-table">
                        <thead>
                          <tr><th>Arete</th><th>Tipo</th><th>Diagnostico / Evento</th><th>Fecha</th><th>Acciones</th></tr>
                        </thead>
                        <tbody>
                          {sanitarios.map(ev => (
                            <tr key={ev.idEvento}>
                              <td className="productivo-table-id">{ev.animal?.numeroArete || 'N/A'}</td>
                              <td><span className="productivo-status" style={{background:'#fef08a',color:'#854d0e'}}>{ev.tipoEvento?.nombreTipo}</span></td>
                              <td>{ev.diagnostico || 'Sin diagnóstico'}<br/><small>{ev.medicamento ? `💊 ${ev.medicamento} ${ev.dosis || ''}` : ''}</small></td>
                              <td>{fmtDate(ev.fechaEvento)}</td>
                              <td>
                                <div className="productivo-table-actions">
                                  <Button type="button" className="users-btn-success" disabled={busyId === `san-${ev.idEvento}`} onClick={() => void approveSanitario(ev.idEvento, 'APROBADO')}><Check size={14}/> Aprobar</Button>
                                  <Button type="button" className="users-btn-danger" disabled={busyId === `san-${ev.idEvento}`} onClick={() => void approveSanitario(ev.idEvento, 'RECHAZADO')}><X size={14}/> Rechazar</Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                )}

                {canProd && (pesos.length > 0 || leches.length > 0 || reproductivos.length > 0) && (
                  <>
                    {pesos.length > 0 && (
                      <article className="productivo-card">
                        <div className="users-admin-card__title">
                          <h2>Pendientes Productivos: Pesos</h2><small>{pesos.length} registros</small>
                        </div>
                        <div className="productivo-table-wrap">
                          <table className="productivo-table">
                            <thead>
                              <tr><th>Arete</th><th>Peso (kg)</th><th>Fecha</th><th>Acciones</th></tr>
                            </thead>
                            <tbody>
                              {pesos.map(r => (
                                <tr key={r.idRegistroPeso}>
                                  <td className="productivo-table-id">{r.animal?.numeroArete || 'N/A'}</td>
                                  <td className="productivo-table-value">{Number(r.peso).toFixed(1)} kg</td>
                                  <td>{fmtDate(r.fechaRegistro)}</td>
                                  <td>
                                    <div className="productivo-table-actions">
                                      <Button type="button" className="users-btn-success" disabled={busyId === `peso-${r.idRegistroPeso}`} onClick={() => void approvePeso(r.idRegistroPeso, 'APROBADO')}><Check size={14}/> Aprobar</Button>
                                      <Button type="button" className="users-btn-danger" disabled={busyId === `peso-${r.idRegistroPeso}`} onClick={() => void approvePeso(r.idRegistroPeso, 'RECHAZADO')}><X size={14}/> Rechazar</Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </article>
                    )}

                    {leches.length > 0 && (
                      <article className="productivo-card">
                        <div className="users-admin-card__title">
                          <h2>Pendientes Productivos: Leche</h2><small>{leches.length} registros</small>
                        </div>
                        <div className="productivo-table-wrap">
                          <table className="productivo-table">
                            <thead>
                              <tr><th>Arete</th><th>Litros</th><th>Fecha</th><th>Acciones</th></tr>
                            </thead>
                            <tbody>
                              {leches.map(r => (
                                <tr key={r.idProduccion}>
                                  <td className="productivo-table-id">{r.animal?.numeroArete || 'N/A'}</td>
                                  <td className="productivo-table-value">{Number(r.litrosProducidos).toFixed(1)} L</td>
                                  <td>{fmtDate(r.fechaRegistro)}</td>
                                  <td>
                                    <div className="productivo-table-actions">
                                      <Button type="button" className="users-btn-success" disabled={busyId === `leche-${r.idProduccion}`} onClick={() => void approveLeche(r.idProduccion, 'APROBADO')}><Check size={14}/> Aprobar</Button>
                                      <Button type="button" className="users-btn-danger" disabled={busyId === `leche-${r.idProduccion}`} onClick={() => void approveLeche(r.idProduccion, 'RECHAZADO')}><X size={14}/> Rechazar</Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </article>
                    )}

                    {reproductivos.length > 0 && (
                      <article className="productivo-card">
                        <div className="users-admin-card__title">
                          <h2>Pendientes Productivos: Reproductivos</h2><small>{reproductivos.length} registros</small>
                        </div>
                        <div className="productivo-table-wrap">
                          <table className="productivo-table">
                            <thead>
                              <tr><th>Arete</th><th>Tipo</th><th>Observaciones</th><th>Fecha</th><th>Acciones</th></tr>
                            </thead>
                            <tbody>
                              {reproductivos.map(r => (
                                <tr key={r.idEventoReproductivo}>
                                  <td className="productivo-table-id">{r.animal?.numeroArete || 'N/A'}</td>
                                  <td><span className="productivo-tipo">{r.tipoEvento}</span></td>
                                  <td>{r.observaciones || '-'}</td>
                                  <td>{fmtDate(r.fechaEvento)}</td>
                                  <td>
                                    <div className="productivo-table-actions">
                                      <Button type="button" className="users-btn-success" disabled={busyId === `repro-${r.idEventoReproductivo}`} onClick={() => void approveRepro(r.idEventoReproductivo, 'APROBADO')}><Check size={14}/> Aprobar</Button>
                                      <Button type="button" className="users-btn-danger" disabled={busyId === `repro-${r.idEventoReproductivo}`} onClick={() => void approveRepro(r.idEventoReproductivo, 'RECHAZADO')}><X size={14}/> Rechazar</Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </article>
                    )}
                  </>
                )}

                {canSol && totalSolicitudes > 0 && (
                  <article className="productivo-card">
                    <div className="users-admin-card__title">
                      <h2>Pendientes Inventario: Compras</h2><small>{solicitudes.length} registros</small>
                    </div>
                    <div className="productivo-table-wrap">
                      <table className="productivo-table">
                        <thead>
                          <tr><th>ID Solicitud</th><th>Solicitante</th><th>Observaciones</th><th>Items</th><th>Fecha</th><th>Acciones</th></tr>
                        </thead>
                        <tbody>
                          {solicitudes.map(s => (
                            <tr key={s.idSolicitud}>
                              <td className="productivo-table-id">#{s.idSolicitud}</td>
                              <td>{s.solicitante?.nombreCompleto || 'N/A'}</td>
                              <td>{s.observaciones || '-'}</td>
                              <td>{s.detalles?.length || 0}</td>
                              <td>{fmtDate(s.fechaSolicitud)}</td>
                              <td>
                                <div className="productivo-table-actions">
                                  <Button type="button" className="users-btn-success" disabled={busyId === `sol-${s.idSolicitud}`} onClick={() => void approveSolicitud(s.idSolicitud, 'APROBADA')}><Check size={14}/> Aprobar</Button>
                                  <Button type="button" className="users-btn-danger" disabled={busyId === `sol-${s.idSolicitud}`} onClick={() => void approveSolicitud(s.idSolicitud, 'RECHAZADA')}><X size={14}/> Rechazar</Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                )}

                {totalPendientes === 0 && (
                  <article className="productivo-card">
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 10px' }} />
                      <h2>Todo al día</h2>
                      <p>No hay registros pendientes de aprobación.</p>
                    </div>
                  </article>
                )}

              </div>
            </div>
          )}
        </div>
      </main>
    </section>
  );
}
