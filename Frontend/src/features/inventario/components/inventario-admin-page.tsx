import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { getVisibleNavItemsForRole } from '../../auth/navigation-utils';
import { Button, NAV_ITEMS, LogOut, Package, Tags, ArrowLeftRight, ShoppingCart, Receipt, AlertTriangle, X } from '../../../shared/ui';
import { ApiClientError } from '../../../types/api';
import { inventarioApi } from '../inventario-api';
import type {
  TipoInsumo, Insumo, MovimientoInventario,
  SolicitudCompra, CompraRealizada,
  EstadoSolicitud, TipoMovimiento,
  DetalleSolicitudInput, DetalleCompraInput,
} from '../inventario-types';
import {
  canViewInventario, canManageInsumos, canManageTipos,
  canCreateMovimiento, canCreateSolicitud, canAprobarSolicitud,
  canViewCompras, canCreateCompra,
  getEstadoSolicitudClass, getMovimientoClass, getStockLevel,
  getInventarioErrorMessage, toInputDate, toNum, fmtCurrency,
} from '../inventario-utils';

interface Props { onGoHome: () => void; onGoUsersAdmin?: () => void; onNavigateModule?: (m: string) => void; }
interface Msg { type: 'error' | 'success' | 'warn'; text: string; }
type Tab = 'insumos' | 'tipos' | 'movimientos' | 'solicitudes' | 'compras';



export function InventarioAdminPage({ onGoHome, onGoUsersAdmin, onNavigateModule }: Props) {
  const { user, logout } = useAuth();
  const visibleNavItems = useMemo(() => getVisibleNavItemsForRole(user?.rol, NAV_ITEMS), [user?.rol]);
  const [tab, setTab] = useState<Tab>('insumos');
  const [initLoading, setInitLoading] = useState(true);
  const [msg, setMsg] = useState<Msg | null>(null);

  // ── shared data ──
  const [tipos, setTipos] = useState<TipoInsumo[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);

  // ── perms ──
  const canView = useMemo(() => canViewInventario(user?.rol), [user?.rol]);
  const canIns = useMemo(() => canManageInsumos(user?.rol), [user?.rol]);
  const canTip = useMemo(() => canManageTipos(user?.rol), [user?.rol]);
  const canMov = useMemo(() => canCreateMovimiento(user?.rol), [user?.rol]);
  const canSol = useMemo(() => canCreateSolicitud(user?.rol), [user?.rol]);
  const canApr = useMemo(() => canAprobarSolicitud(user?.rol), [user?.rol]);
  const canCom = useMemo(() => canViewCompras(user?.rol), [user?.rol]);
  const canComCreate = useMemo(() => canCreateCompra(user?.rol), [user?.rol]);

  // ── tipos state ──
  const [tipoForm, setTipoForm] = useState({ nombreTipo: '', descripcion: '' });
  const [savingTipo, setSavingTipo] = useState(false);
  const [editingTipoId, setEditingTipoId] = useState<number | null>(null);

  // ── insumos state ──
  const [insumoForm, setInsumoForm] = useState({ nombreInsumo: '', idTipoInsumo: '', unidadMedida: '', descripcion: '', stockActual: '' });
  const [savingInsumo, setSavingInsumo] = useState(false);
  const [editingInsumoId, setEditingInsumoId] = useState<number | null>(null);
  const [insumoTipoFilter, setInsumoTipoFilter] = useState('');

  // ── movimientos state ──
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);
  const [movForm, setMovForm] = useState({ idInsumo: '', tipoMovimiento: 'SALIDA' as TipoMovimiento, cantidad: '', fechaMovimiento: '' });
  const [savingMov, setSavingMov] = useState(false);
  const [movFilter, setMovFilter] = useState({ idInsumo: '', tipo: 'TODOS' as TipoMovimiento | 'TODOS' });

  // ── solicitudes state ──
  const [solicitudes, setSolicitudes] = useState<SolicitudCompra[]>([]);
  const [loadingSol, setLoadingSol] = useState(false);
  const [solForm, setSolForm] = useState({ fechaSolicitud: '', observaciones: '' });
  const [solDetalles, setSolDetalles] = useState<{ idInsumo: string; cantidad: string; precioEstimado: string }[]>([]);
  const [savingSol, setSavingSol] = useState(false);
  const [solFilter, setSolFilter] = useState<EstadoSolicitud | 'TODOS'>('TODOS');

  // ── compras state ──
  const [compras, setCompras] = useState<CompraRealizada[]>([]);
  const [loadingCom, setLoadingCom] = useState(false);
  const [compraForm, setCompraForm] = useState({ idSolicitud: '', fechaCompra: '' });
  const [compraDetalles, setCompraDetalles] = useState<{ idInsumo: string; cantidadReal: string; precioUnitario: string }[]>([]);
  const [savingCompra, setSavingCompra] = useState(false);

  // ── error handler ──
  const handleErr = useCallback(async (e: unknown) => {
    setMsg({ type: 'error', text: getInventarioErrorMessage(e) });
    if (e instanceof ApiClientError && e.status === 401) await logout();
  }, [logout]);

  // ── loaders ──
  const loadTipos = useCallback(async () => {
    try { setTipos(await inventarioApi.getTipos()); } catch (e) { await handleErr(e); }
  }, [handleErr]);

  const loadInsumos = useCallback(async () => {
    try {
      const f = insumoTipoFilter ? { idTipoInsumo: Number(insumoTipoFilter) } : {};
      setInsumos(await inventarioApi.getInsumos(f));
    } catch (e) { await handleErr(e); }
  }, [insumoTipoFilter, handleErr]);

  const loadMovimientos = useCallback(async () => {
    try {
      setLoadingMov(true);
      const f = {
        idInsumo: movFilter.idInsumo ? Number(movFilter.idInsumo) : undefined,
        tipo: movFilter.tipo !== 'TODOS' ? movFilter.tipo : undefined,
      };
      setMovimientos(await inventarioApi.getMovimientos(f));
    } catch (e) { await handleErr(e); }
    finally { setLoadingMov(false); }
  }, [movFilter, handleErr]);

  const loadSolicitudes = useCallback(async () => {
    try {
      setLoadingSol(true);
      const f = solFilter !== 'TODOS' ? { estado: solFilter } : {};
      setSolicitudes(await inventarioApi.getSolicitudes(f));
    } catch (e) { await handleErr(e); }
    finally { setLoadingSol(false); }
  }, [solFilter, handleErr]);

  const loadCompras = useCallback(async () => {
    try { setLoadingCom(true); setCompras(await inventarioApi.getCompras()); }
    catch (e) { await handleErr(e); }
    finally { setLoadingCom(false); }
  }, [handleErr]);

  // ── init ──
  useEffect(() => {
    if (!canView) { setInitLoading(false); return; }
    void Promise.all([loadTipos(), loadInsumos()]).finally(() => setInitLoading(false));
  }, [canView, loadTipos, loadInsumos]);

  useEffect(() => {
    if (!canView || initLoading) return;
    if (tab === 'insumos') void loadInsumos();
    if (tab === 'tipos') void loadTipos();
    if (tab === 'movimientos') void loadMovimientos();
    if (tab === 'solicitudes') void loadSolicitudes();
    if (tab === 'compras' && canCom) void loadCompras();
  }, [tab, canView, canCom, initLoading, loadInsumos, loadTipos, loadMovimientos, loadSolicitudes, loadCompras]);

  // ── nav ──
  const onNav = (m: string) => { if (m === 'Usuarios' && onGoUsersAdmin) return onGoUsersAdmin(); if (onNavigateModule) return onNavigateModule(m); return onGoHome(); };

  // ══════════════════ TIPOS HANDLERS ══════════════════
  const resetTipoForm = () => { setTipoForm({ nombreTipo: '', descripcion: '' }); setEditingTipoId(null); };

  const onSaveTipo = async () => {
    if (!tipoForm.nombreTipo.trim()) { setMsg({ type: 'error', text: 'El nombre del tipo es obligatorio.' }); return; }
    try {
      setSavingTipo(true); setMsg(null);
      if (editingTipoId) {
        const u = await inventarioApi.updateTipo(editingTipoId, { nombreTipo: tipoForm.nombreTipo, descripcion: tipoForm.descripcion || undefined });
        setTipos(prev => prev.map(t => t.idTipoInsumo === u.idTipoInsumo ? u : t));
        setMsg({ type: 'success', text: 'Tipo actualizado.' });
      } else {
        const c = await inventarioApi.createTipo({ nombreTipo: tipoForm.nombreTipo, descripcion: tipoForm.descripcion || undefined });
        setTipos(prev => [c, ...prev]);
        setMsg({ type: 'success', text: 'Tipo de insumo creado.' });
      }
      resetTipoForm();
    } catch (e) { await handleErr(e); } finally { setSavingTipo(false); }
  };

  const onToggleTipo = async (id: number, activo: boolean) => {
    try { setMsg(null); const u = await inventarioApi.updateTipo(id, { activo }); setTipos(prev => prev.map(t => t.idTipoInsumo === u.idTipoInsumo ? u : t)); setMsg({ type: 'success', text: activo ? 'Tipo activado.' : 'Tipo desactivado.' }); }
    catch (e) { await handleErr(e); }
  };

  // ══════════════════ INSUMOS HANDLERS ══════════════════
  const resetInsumoForm = () => { setInsumoForm({ nombreInsumo: '', idTipoInsumo: '', unidadMedida: '', descripcion: '', stockActual: '' }); setEditingInsumoId(null); };

  const onSaveInsumo = async () => {
    if (!insumoForm.nombreInsumo.trim() || !insumoForm.idTipoInsumo || !insumoForm.unidadMedida.trim()) { setMsg({ type: 'error', text: 'Nombre, tipo y unidad de medida son obligatorios.' }); return; }
    try {
      setSavingInsumo(true); setMsg(null);
      if (editingInsumoId) {
        const payload: Record<string, unknown> = {};
        if (insumoForm.nombreInsumo) payload.nombreInsumo = insumoForm.nombreInsumo;
        if (insumoForm.idTipoInsumo) payload.idTipoInsumo = Number(insumoForm.idTipoInsumo);
        if (insumoForm.unidadMedida) payload.unidadMedida = insumoForm.unidadMedida;
        if (insumoForm.descripcion) payload.descripcion = insumoForm.descripcion;
        const u = await inventarioApi.updateInsumo(editingInsumoId, payload as any);
        setInsumos(prev => prev.map(i => i.idInsumo === u.idInsumo ? u : i));
        setMsg({ type: 'success', text: 'Insumo actualizado.' });
      } else {
        const c = await inventarioApi.createInsumo({ nombreInsumo: insumoForm.nombreInsumo, idTipoInsumo: Number(insumoForm.idTipoInsumo), unidadMedida: insumoForm.unidadMedida, descripcion: insumoForm.descripcion || undefined, stockActual: insumoForm.stockActual ? Number(insumoForm.stockActual) : 0 });
        setInsumos(prev => [c, ...prev]);
        setMsg({ type: 'success', text: 'Insumo registrado.' });
      }
      resetInsumoForm();
    } catch (e) { await handleErr(e); } finally { setSavingInsumo(false); }
  };

  const onToggleInsumo = async (id: number, activo: boolean) => {
    try { setMsg(null); const u = await inventarioApi.updateInsumo(id, { activo }); setInsumos(prev => prev.map(i => i.idInsumo === u.idInsumo ? u : i)); setMsg({ type: 'success', text: activo ? 'Insumo activado.' : 'Insumo desactivado.' }); }
    catch (e) { await handleErr(e); }
  };

  // ══════════════════ MOVIMIENTOS HANDLERS ══════════════════
  const selectedInsumoStock = useMemo(() => {
    if (!movForm.idInsumo) return null;
    const ins = insumos.find(i => i.idInsumo === Number(movForm.idInsumo));
    return ins ? { stock: toNum(ins.stockActual), unidad: ins.unidadMedida } : null;
  }, [movForm.idInsumo, insumos]);

  const onSaveMov = async () => {
    if (!movForm.idInsumo || !movForm.cantidad || !movForm.fechaMovimiento) { setMsg({ type: 'error', text: 'Todos los campos son obligatorios.' }); return; }
    const cant = Number(movForm.cantidad);
    if (cant <= 0) { setMsg({ type: 'error', text: 'La cantidad debe ser mayor a 0.' }); return; }
    if (movForm.tipoMovimiento === 'SALIDA' && selectedInsumoStock && cant > selectedInsumoStock.stock) { setMsg({ type: 'error', text: `Stock insuficiente. Disponible: ${selectedInsumoStock.stock} ${selectedInsumoStock.unidad}` }); return; }
    try {
      setSavingMov(true); setMsg(null);
      await inventarioApi.createMovimiento({ idInsumo: Number(movForm.idInsumo), tipoMovimiento: movForm.tipoMovimiento, cantidad: cant, fechaMovimiento: movForm.fechaMovimiento });
      setMovForm({ idInsumo: '', tipoMovimiento: 'SALIDA', cantidad: '', fechaMovimiento: '' });
      setMsg({ type: 'success', text: 'Movimiento registrado. Stock actualizado.' });
      void loadMovimientos(); void loadInsumos();
    } catch (e) { await handleErr(e); } finally { setSavingMov(false); }
  };

  // ══════════════════ SOLICITUDES HANDLERS ══════════════════
  const addSolDetalle = () => setSolDetalles(p => [...p, { idInsumo: '', cantidad: '', precioEstimado: '' }]);
  const removeSolDetalle = (i: number) => setSolDetalles(p => p.filter((_, idx) => idx !== i));
  const updateSolDetalle = (i: number, field: string, val: string) => setSolDetalles(p => p.map((d, idx) => idx === i ? { ...d, [field]: val } : d));

  const solTotal = useMemo(() => solDetalles.reduce((s, d) => s + (Number(d.cantidad) || 0) * (Number(d.precioEstimado) || 0), 0), [solDetalles]);

  const onCreateSolicitud = async () => {
    if (!solForm.fechaSolicitud) { setMsg({ type: 'error', text: 'La fecha es obligatoria.' }); return; }
    if (solDetalles.length === 0) { setMsg({ type: 'error', text: 'Agrega al menos un detalle.' }); return; }
    const detalles: DetalleSolicitudInput[] = [];
    for (const d of solDetalles) {
      if (!d.idInsumo || !d.cantidad || !d.precioEstimado) { setMsg({ type: 'error', text: 'Completa todos los campos de cada detalle.' }); return; }
      detalles.push({ idInsumo: Number(d.idInsumo), cantidad: Number(d.cantidad), precioEstimado: Number(d.precioEstimado) });
    }
    try {
      setSavingSol(true); setMsg(null);
      const c = await inventarioApi.createSolicitud({ fechaSolicitud: solForm.fechaSolicitud, observaciones: solForm.observaciones || undefined, detalles });
      setSolicitudes(prev => [c, ...prev]);
      setSolForm({ fechaSolicitud: '', observaciones: '' }); setSolDetalles([]);
      setMsg({ type: 'success', text: 'Solicitud de compra creada — pendiente de aprobacion.' });
    } catch (e) { await handleErr(e); } finally { setSavingSol(false); }
  };

  const onAprobarSolicitud = async (id: number, estado: 'APROBADA' | 'RECHAZADA') => {
    try { setMsg(null); const u = await inventarioApi.aprobarSolicitud(id, { estadoSolicitud: estado }); setSolicitudes(p => p.map(s => s.idSolicitud === u.idSolicitud ? u : s)); setMsg({ type: 'success', text: `Solicitud ${estado === 'APROBADA' ? 'aprobada' : 'rechazada'}.` }); }
    catch (e) { await handleErr(e); }
  };

  // ══════════════════ COMPRAS HANDLERS ══════════════════
  const solicitudesAprobadas = useMemo(() => solicitudes.filter(s => s.estadoSolicitud === 'APROBADA' && (!s.comprasRealizadas || s.comprasRealizadas.length === 0)), [solicitudes]);

  const onSelectSolicitudForCompra = (idSol: string) => {
    setCompraForm(p => ({ ...p, idSolicitud: idSol }));
    const sol = solicitudes.find(s => s.idSolicitud === Number(idSol));
    if (sol?.detalles) {
      setCompraDetalles(sol.detalles.map(d => ({ idInsumo: String(d.idInsumo), cantidadReal: String(toNum(d.cantidad)), precioUnitario: String(toNum(d.precioEstimado)) })));
    } else { setCompraDetalles([]); }
  };

  const updateCompraDetalle = (i: number, field: string, val: string) => setCompraDetalles(p => p.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  const compraTotal = useMemo(() => compraDetalles.reduce((s, d) => s + (Number(d.cantidadReal) || 0) * (Number(d.precioUnitario) || 0), 0), [compraDetalles]);

  const onCreateCompra = async () => {
    if (!compraForm.idSolicitud || !compraForm.fechaCompra) { setMsg({ type: 'error', text: 'Selecciona solicitud y fecha.' }); return; }
    if (compraDetalles.length === 0) { setMsg({ type: 'error', text: 'Debe tener al menos un detalle.' }); return; }
    const detalles: DetalleCompraInput[] = [];
    for (const d of compraDetalles) {
      if (!d.idInsumo || !d.cantidadReal || !d.precioUnitario) { setMsg({ type: 'error', text: 'Completa todos los campos.' }); return; }
      detalles.push({ idInsumo: Number(d.idInsumo), cantidadReal: Number(d.cantidadReal), precioUnitario: Number(d.precioUnitario) });
    }
    try {
      setSavingCompra(true); setMsg(null);
      await inventarioApi.createCompra({ idSolicitud: Number(compraForm.idSolicitud), fechaCompra: compraForm.fechaCompra, detalles });
      setCompraForm({ idSolicitud: '', fechaCompra: '' }); setCompraDetalles([]);
      setMsg({ type: 'success', text: 'Compra registrada. Stock actualizado automaticamente.' });
      void loadCompras(); void loadInsumos(); void loadSolicitudes();
    } catch (e) { await handleErr(e); } finally { setSavingCompra(false); }
  };

  // ══════════════════ RENDER ══════════════════
  return (
    <section className="users-admin-shell">
      <aside className="users-admin-sidebar">
        <div className="users-admin-sidebar__logo"><img src="/branding/logo-rancho-los-alpes.png" alt="Logo" /></div>
        <nav className="users-admin-sidebar__nav" aria-label="Modulos">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            return (
            <button key={item.label} type="button" data-testid={`inventario-nav-${item.label.toLowerCase()}`}
              className={`users-admin-sidebar__nav-item ${item.label === 'Inventario' ? 'is-active' : ''}`}
              onClick={item.label === 'Inventario' ? undefined : () => onNav(item.label)}><Icon size={18} aria-hidden /> {item.label}</button>
            );
          })}
        </nav>
        <footer className="users-admin-sidebar__footer">
          <p>{user?.nombreCompleto || 'Usuario'}</p><small>{user?.rol || 'Sin rol'}</small>
          <Button type="button" className="users-admin-sidebar__logout" onClick={logout} data-testid="inventario-sidebar-logout-button"><LogOut size={15} aria-hidden /> Cerrar sesion</Button>
        </footer>
      </aside>

      <main className="users-admin-main">
        <header className="users-admin-main__header" data-testid="inventario-admin-header">
          <h1>Inventario y Compras</h1><p>Insumos, movimientos, solicitudes y compras</p>
        </header>

        <div className="users-admin-main__body">
          {!canView ? (
            <article className="users-admin-empty"><h2>Acceso restringido</h2><p>Tu rol no tiene permisos para inventario.</p><Button type="button" variant="ghost" onClick={onGoHome}>Volver</Button></article>
          ) : initLoading ? (
            <article className="users-admin-empty"><h2>Cargando inventario...</h2></article>
          ) : (
            <div className="productivo-content">
              {/* ── TABS ── */}
              <div className="productivo-tabs" data-testid="inventario-tabs">
                <button type="button" className={`productivo-tab ${tab === 'insumos' ? 'is-active' : ''}`} onClick={() => setTab('insumos')} data-testid="tab-insumos"><Package size={16} aria-hidden /> Insumos</button>
                <button type="button" className={`productivo-tab ${tab === 'tipos' ? 'is-active' : ''}`} onClick={() => setTab('tipos')} data-testid="tab-tipos"><Tags size={16} aria-hidden /> Tipos</button>
                <button type="button" className={`productivo-tab ${tab === 'movimientos' ? 'is-active' : ''}`} onClick={() => setTab('movimientos')} data-testid="tab-movimientos"><ArrowLeftRight size={16} aria-hidden /> Movimientos</button>
                <button type="button" className={`productivo-tab ${tab === 'solicitudes' ? 'is-active' : ''}`} onClick={() => setTab('solicitudes')} data-testid="tab-solicitudes"><ShoppingCart size={16} aria-hidden /> Solicitudes</button>
                {canCom ? <button type="button" className={`productivo-tab ${tab === 'compras' ? 'is-active' : ''}`} onClick={() => setTab('compras')} data-testid="tab-compras"><Receipt size={16} aria-hidden /> Compras</button> : null}
              </div>

              {msg ? <p className={`users-message users-message--${msg.type}`} data-testid="inventario-message">{msg.text}</p> : null}

              {/* ════════════ TAB: INSUMOS ════════════ */}
              {tab === 'insumos' ? (
                <div className="productivo-tab-content">
                  {canIns ? (
                    <article className="productivo-card">
                      <div className="users-admin-card__title"><h2>{editingInsumoId ? 'Editar insumo' : 'Nuevo insumo'}</h2>{editingInsumoId ? <Button type="button" variant="ghost" onClick={resetInsumoForm}>Cancelar</Button> : null}</div>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Nombre</span><input type="text" maxLength={100} placeholder="ej. Ivermectina 1%" value={insumoForm.nombreInsumo} onChange={e => setInsumoForm(p => ({ ...p, nombreInsumo: e.target.value }))} data-testid="insumo-nombre" /></label>
                        <label className="productivo-field"><span>Tipo de insumo</span>
                          <select value={insumoForm.idTipoInsumo} onChange={e => setInsumoForm(p => ({ ...p, idTipoInsumo: e.target.value }))} data-testid="insumo-tipo">
                            <option value="">Selecciona tipo</option>
                            {tipos.filter(t => t.activo).map(t => <option key={t.idTipoInsumo} value={t.idTipoInsumo}>{t.nombreTipo}</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Unidad de medida</span><input type="text" maxLength={20} placeholder="ej. ml, kg, litros" value={insumoForm.unidadMedida} onChange={e => setInsumoForm(p => ({ ...p, unidadMedida: e.target.value }))} data-testid="insumo-unidad" /></label>
                        <label className="productivo-field"><span>Stock inicial</span><input type="number" min="0" step="0.1" placeholder="0" value={insumoForm.stockActual} onChange={e => setInsumoForm(p => ({ ...p, stockActual: e.target.value }))} disabled={!!editingInsumoId} data-testid="insumo-stock" /></label>
                      </div>
                      <label className="productivo-field"><span>Descripcion</span><textarea rows={2} maxLength={500} placeholder="Descripcion opcional" value={insumoForm.descripcion} onChange={e => setInsumoForm(p => ({ ...p, descripcion: e.target.value }))} data-testid="insumo-desc" /></label>
                      <Button type="button" onClick={onSaveInsumo} disabled={savingInsumo} data-testid="btn-guardar-insumo">{savingInsumo ? 'Guardando...' : editingInsumoId ? 'Guardar cambios' : 'Registrar insumo'}</Button>
                    </article>
                  ) : null}

                  <div className="productivo-filters">
                    <label className="productivo-field"><span>Filtrar por tipo</span>
                      <select value={insumoTipoFilter} onChange={e => setInsumoTipoFilter(e.target.value)} data-testid="filter-insumo-tipo"><option value="">Todos</option>{tipos.map(t => <option key={t.idTipoInsumo} value={t.idTipoInsumo}>{t.nombreTipo}</option>)}</select>
                    </label>
                  </div>

                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Catalogo de insumos</h2><small>{insumos.length} registros</small></div>
                    <div className="productivo-table-wrap">
                      <table className="productivo-table">
                        <thead><tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Unidad</th><th>Stock</th><th>Estado</th>{canIns ? <th>Acciones</th> : null}</tr></thead>
                        <tbody>
                          {insumos.length === 0 ? <tr><td colSpan={canIns ? 7 : 6} className="productivo-table-empty">No hay insumos.</td></tr> : insumos.map(i => (
                            <tr key={i.idInsumo}>
                              <td className="productivo-table-id">#{i.idInsumo}</td>
                              <td><strong>{i.nombreInsumo}</strong>{i.descripcion ? <><br /><small style={{ color: '#6b7280' }}>{i.descripcion}</small></> : null}</td>
                              <td>{i.tipoInsumo?.nombreTipo || 'N/A'}</td>
                              <td>{i.unidadMedida}</td>
                              <td><span className={`inventario-stock ${getStockLevel(toNum(i.stockActual))}`}>{toNum(i.stockActual)} {i.unidadMedida}</span></td>
                              <td><span className={`productivo-status ${i.activo ? 'is-approved' : 'is-rejected'}`}>{i.activo ? 'ACTIVO' : 'INACTIVO'}</span></td>
                              {canIns ? (
                                <td>
                                  <div className="productivo-table-actions">
                                    <Button type="button" variant="ghost" onClick={() => { setEditingInsumoId(i.idInsumo); setInsumoForm({ nombreInsumo: i.nombreInsumo, idTipoInsumo: String(i.idTipoInsumo), unidadMedida: i.unidadMedida, descripcion: i.descripcion || '', stockActual: '' }); }}>Editar</Button>
                                    <Button type="button" className={i.activo ? 'users-btn-danger' : 'users-btn-success'} onClick={() => void onToggleInsumo(i.idInsumo, !i.activo)}>{i.activo ? 'Desactivar' : 'Activar'}</Button>
                                  </div>
                                </td>
                              ) : null}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
              ) : null}

              {/* ════════════ TAB: TIPOS ════════════ */}
              {tab === 'tipos' ? (
                <div className="productivo-tab-content">
                  {canTip ? (
                    <article className="productivo-card">
                      <div className="users-admin-card__title"><h2>{editingTipoId ? 'Editar tipo' : 'Nuevo tipo de insumo'}</h2>{editingTipoId ? <Button type="button" variant="ghost" onClick={resetTipoForm}>Cancelar</Button> : null}</div>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Nombre</span><input type="text" maxLength={50} placeholder="ej. Medicamentos" value={tipoForm.nombreTipo} onChange={e => setTipoForm(p => ({ ...p, nombreTipo: e.target.value }))} data-testid="tipo-nombre" /></label>
                        <label className="productivo-field"><span>Descripcion</span><input type="text" maxLength={500} placeholder="Descripcion opcional" value={tipoForm.descripcion} onChange={e => setTipoForm(p => ({ ...p, descripcion: e.target.value }))} data-testid="tipo-desc" /></label>
                      </div>
                      <Button type="button" onClick={onSaveTipo} disabled={savingTipo} data-testid="btn-guardar-tipo">{savingTipo ? 'Guardando...' : editingTipoId ? 'Guardar cambios' : 'Crear tipo'}</Button>
                    </article>
                  ) : null}

                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Tipos de insumo</h2><small>{tipos.length} registros</small></div>
                    <div className="productivo-table-wrap">
                      <table className="productivo-table">
                        <thead><tr><th>ID</th><th>Nombre</th><th>Descripcion</th><th>Activo</th>{canTip ? <th>Acciones</th> : null}</tr></thead>
                        <tbody>
                          {tipos.length === 0 ? <tr><td colSpan={canTip ? 5 : 4} className="productivo-table-empty">No hay tipos.</td></tr> : tipos.map(t => (
                            <tr key={t.idTipoInsumo}>
                              <td className="productivo-table-id">#{t.idTipoInsumo}</td>
                              <td><strong>{t.nombreTipo}</strong></td>
                              <td style={{ color: '#6b7280' }}>{t.descripcion || '—'}</td>
                              <td><span className={`productivo-status ${t.activo ? 'is-approved' : 'is-rejected'}`}>{t.activo ? 'SI' : 'NO'}</span></td>
                              {canTip ? (
                                <td>
                                  <div className="productivo-table-actions">
                                    <Button type="button" variant="ghost" onClick={() => { setEditingTipoId(t.idTipoInsumo); setTipoForm({ nombreTipo: t.nombreTipo, descripcion: t.descripcion || '' }); }}>Editar</Button>
                                    <Button type="button" className={t.activo ? 'users-btn-danger' : 'users-btn-success'} onClick={() => void onToggleTipo(t.idTipoInsumo, !t.activo)}>{t.activo ? 'Desactivar' : 'Activar'}</Button>
                                  </div>
                                </td>
                              ) : null}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
              ) : null}

              {/* ════════════ TAB: MOVIMIENTOS ════════════ */}
              {tab === 'movimientos' ? (
                <div className="productivo-tab-content">
                  {canMov ? (
                    <article className="productivo-card">
                      <div className="users-admin-card__title"><h2>Registrar movimiento</h2></div>
                      <p className="productivo-subtitle">Registra entradas o salidas manuales de inventario</p>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Insumo</span>
                          <select value={movForm.idInsumo} onChange={e => setMovForm(p => ({ ...p, idInsumo: e.target.value }))} data-testid="mov-insumo">
                            <option value="">Selecciona insumo</option>
                            {insumos.filter(i => i.activo).map(i => <option key={i.idInsumo} value={i.idInsumo}>{i.nombreInsumo} ({toNum(i.stockActual)} {i.unidadMedida})</option>)}
                          </select>
                        </label>
                        <label className="productivo-field"><span>Tipo</span>
                          <select value={movForm.tipoMovimiento} onChange={e => setMovForm(p => ({ ...p, tipoMovimiento: e.target.value as TipoMovimiento }))} data-testid="mov-tipo">
                            <option value="ENTRADA">ENTRADA</option><option value="SALIDA">SALIDA</option>
                          </select>
                        </label>
                      </div>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Cantidad</span><input type="number" min="0.1" step="0.1" placeholder="ej. 25" value={movForm.cantidad} onChange={e => setMovForm(p => ({ ...p, cantidad: e.target.value }))} data-testid="mov-cantidad" /></label>
                        <label className="productivo-field"><span>Fecha</span><input type="date" value={movForm.fechaMovimiento} onChange={e => setMovForm(p => ({ ...p, fechaMovimiento: e.target.value }))} data-testid="mov-fecha" /></label>
                      </div>
                      {selectedInsumoStock && movForm.tipoMovimiento === 'SALIDA' ? <p className="inventario-stock-hint">Stock disponible: <strong>{selectedInsumoStock.stock} {selectedInsumoStock.unidad}</strong></p> : null}
                      <Button type="button" onClick={onSaveMov} disabled={savingMov} data-testid="btn-guardar-mov">{savingMov ? 'Guardando...' : 'Registrar movimiento'}</Button>
                    </article>
                  ) : null}

                  <div className="productivo-filters">
                    <label className="productivo-field"><span>Insumo</span><select value={movFilter.idInsumo} onChange={e => setMovFilter(p => ({ ...p, idInsumo: e.target.value }))}><option value="">Todos</option>{insumos.map(i => <option key={i.idInsumo} value={i.idInsumo}>{i.nombreInsumo}</option>)}</select></label>
                    <label className="productivo-field"><span>Tipo</span><select value={movFilter.tipo} onChange={e => setMovFilter(p => ({ ...p, tipo: e.target.value as TipoMovimiento | 'TODOS' }))}><option value="TODOS">Todos</option><option value="ENTRADA">Entrada</option><option value="SALIDA">Salida</option></select></label>
                  </div>

                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Historial de movimientos</h2><small>{movimientos.length} registros</small></div>
                    {loadingMov ? <p className="productivo-helper">Cargando...</p> : (
                      <div className="productivo-table-wrap">
                        <table className="productivo-table">
                          <thead><tr><th>ID</th><th>Insumo</th><th>Tipo</th><th>Cantidad</th><th>Fecha</th><th>Ref.</th><th>Registrado por</th></tr></thead>
                          <tbody>
                            {movimientos.length === 0 ? <tr><td colSpan={7} className="productivo-table-empty">No hay movimientos.</td></tr> : movimientos.map(m => (
                              <tr key={m.idMovimiento}>
                                <td className="productivo-table-id">#{m.idMovimiento}</td>
                                <td>{m.insumo?.nombreInsumo || 'N/A'}</td>
                                <td><span className={`inventario-mov-badge ${getMovimientoClass(m.tipoMovimiento)}`}>{m.tipoMovimiento}</span></td>
                                <td className="productivo-table-value">{toNum(m.cantidad)} <small>{m.insumo?.unidadMedida || ''}</small></td>
                                <td>{toInputDate(m.fechaMovimiento)}</td>
                                <td>{m.referenciaCompra ? <span className="inventario-ref">C#{m.referenciaCompra}</span> : '—'}</td>
                                <td>{m.registrador?.nombreCompleto || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                </div>
              ) : null}

              {/* ════════════ TAB: SOLICITUDES ════════════ */}
              {tab === 'solicitudes' ? (
                <div className="productivo-tab-content">
                  {canSol ? (
                    <article className="productivo-card">
                      <div className="users-admin-card__title"><h2>Nueva solicitud de compra</h2></div>
                      <p className="productivo-subtitle">Define los insumos, cantidades y precios estimados</p>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Fecha de solicitud</span><input type="date" value={solForm.fechaSolicitud} onChange={e => setSolForm(p => ({ ...p, fechaSolicitud: e.target.value }))} data-testid="sol-fecha" /></label>
                        <label className="productivo-field"><span>Observaciones</span><input type="text" maxLength={500} placeholder="Opcional" value={solForm.observaciones} onChange={e => setSolForm(p => ({ ...p, observaciones: e.target.value }))} data-testid="sol-obs" /></label>
                      </div>

                      <div className="inventario-detalles-section">
                        <div className="inventario-detalles-header"><strong>Detalles de la solicitud</strong><Button type="button" variant="ghost" onClick={addSolDetalle} data-testid="btn-add-sol-detalle">+ Agregar</Button></div>
                        {solDetalles.map((d, i) => (
                          <div key={i} className="inventario-detalle-row">
                            <select value={d.idInsumo} onChange={e => updateSolDetalle(i, 'idInsumo', e.target.value)} data-testid={`sol-det-insumo-${i}`}>
                              <option value="">Insumo</option>{insumos.filter(ins => ins.activo).map(ins => <option key={ins.idInsumo} value={ins.idInsumo}>{ins.nombreInsumo} ({ins.unidadMedida})</option>)}
                            </select>
                            <input type="number" min="0.1" step="0.1" placeholder="Cant." value={d.cantidad} onChange={e => updateSolDetalle(i, 'cantidad', e.target.value)} data-testid={`sol-det-cant-${i}`} />
                            <input type="number" min="0.01" step="0.01" placeholder="Precio est." value={d.precioEstimado} onChange={e => updateSolDetalle(i, 'precioEstimado', e.target.value)} data-testid={`sol-det-precio-${i}`} />
                            <span className="inventario-detalle-subtotal">{fmtCurrency((Number(d.cantidad) || 0) * (Number(d.precioEstimado) || 0))}</span>
                            <Button type="button" className="users-btn-danger" onClick={() => removeSolDetalle(i)}><X size={14} aria-hidden /></Button>
                          </div>
                        ))}
                        {solDetalles.length > 0 ? <div className="inventario-detalles-total">Total estimado: <strong>{fmtCurrency(solTotal)}</strong></div> : null}
                      </div>
                      <Button type="button" onClick={onCreateSolicitud} disabled={savingSol || solDetalles.length === 0} data-testid="btn-crear-solicitud">{savingSol ? 'Guardando...' : 'Crear solicitud'}</Button>
                    </article>
                  ) : null}

                  <div className="productivo-filters">
                    <label className="productivo-field"><span>Estado</span>
                      <select value={solFilter} onChange={e => setSolFilter(e.target.value as EstadoSolicitud | 'TODOS')} data-testid="filter-sol-estado"><option value="TODOS">Todos</option><option value="PENDIENTE">Pendiente</option><option value="APROBADA">Aprobada</option><option value="RECHAZADA">Rechazada</option></select>
                    </label>
                  </div>

                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Solicitudes de compra</h2><small>{solicitudes.length} registros</small></div>
                    {loadingSol ? <p className="productivo-helper">Cargando...</p> : (
                      <div className="productivo-table-wrap">
                        <table className="productivo-table">
                          <thead><tr><th>ID</th><th>Fecha</th><th>Solicitante</th><th>Items</th><th>Observaciones</th><th>Estado</th><th>Acciones</th></tr></thead>
                          <tbody>
                            {solicitudes.length === 0 ? <tr><td colSpan={7} className="productivo-table-empty">No hay solicitudes.</td></tr> : solicitudes.map(s => (
                              <tr key={s.idSolicitud}>
                                <td className="productivo-table-id">S#{s.idSolicitud}</td>
                                <td>{toInputDate(s.fechaSolicitud)}</td>
                                <td>{s.solicitante?.nombreCompleto || 'N/A'}</td>
                                <td>{s.detalles?.length || 0}</td>
                                <td className="productivo-table-obs">{s.observaciones || '—'}</td>
                                <td><span className={`productivo-status ${getEstadoSolicitudClass(s.estadoSolicitud)}`}>{s.estadoSolicitud}</span></td>
                                <td>
                                  {s.estadoSolicitud === 'PENDIENTE' && canApr ? (
                                    <div className="productivo-table-actions">
                                      <Button type="button" className="users-btn-success" onClick={() => void onAprobarSolicitud(s.idSolicitud, 'APROBADA')} data-testid={`btn-aprobar-sol-${s.idSolicitud}`}>Aprobar</Button>
                                      <Button type="button" className="users-btn-danger" onClick={() => void onAprobarSolicitud(s.idSolicitud, 'RECHAZADA')} data-testid={`btn-rechazar-sol-${s.idSolicitud}`}>Rechazar</Button>
                                    </div>
                                  ) : <span className="productivo-immutable">{s.estadoSolicitud !== 'PENDIENTE' ? 'Procesada' : 'Sin acciones'}</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                </div>
              ) : null}

              {/* ════════════ TAB: COMPRAS ════════════ */}
              {tab === 'compras' && canCom ? (
                <div className="productivo-tab-content">
                  {canComCreate ? (
                    <article className="productivo-card">
                      <div className="users-admin-card__title"><h2>Registrar compra realizada</h2></div>
                      <p className="productivo-subtitle"><AlertTriangle size={14} aria-hidden /> Al confirmar, el stock se actualizara automaticamente (RN-16)</p>
                      <div className="productivo-field-row">
                        <label className="productivo-field"><span>Solicitud aprobada</span>
                          <select value={compraForm.idSolicitud} onChange={e => onSelectSolicitudForCompra(e.target.value)} data-testid="compra-solicitud">
                            <option value="">Selecciona solicitud</option>
                            {solicitudesAprobadas.map(s => <option key={s.idSolicitud} value={s.idSolicitud}>S#{s.idSolicitud} — {toInputDate(s.fechaSolicitud)}</option>)}
                          </select>
                        </label>
                        <label className="productivo-field"><span>Fecha de compra</span><input type="date" value={compraForm.fechaCompra} onChange={e => setCompraForm(p => ({ ...p, fechaCompra: e.target.value }))} data-testid="compra-fecha" /></label>
                      </div>

                      {compraDetalles.length > 0 ? (
                        <div className="inventario-detalles-section">
                          <div className="inventario-detalles-header"><strong>Detalles reales de la compra</strong></div>
                          {compraDetalles.map((d, i) => {
                            const ins = insumos.find(x => x.idInsumo === Number(d.idInsumo));
                            return (
                              <div key={i} className="inventario-detalle-row">
                                <span className="inventario-detalle-label">{ins?.nombreInsumo || `Insumo #${d.idInsumo}`}</span>
                                <input type="number" min="0.1" step="0.1" placeholder="Cant. real" value={d.cantidadReal} onChange={e => updateCompraDetalle(i, 'cantidadReal', e.target.value)} data-testid={`compra-det-cant-${i}`} />
                                <input type="number" min="0.01" step="0.01" placeholder="Precio unit." value={d.precioUnitario} onChange={e => updateCompraDetalle(i, 'precioUnitario', e.target.value)} data-testid={`compra-det-precio-${i}`} />
                                <span className="inventario-detalle-subtotal">{fmtCurrency((Number(d.cantidadReal) || 0) * (Number(d.precioUnitario) || 0))}</span>
                              </div>
                            );
                          })}
                          <div className="inventario-detalles-total">Total real: <strong>{fmtCurrency(compraTotal)}</strong></div>
                        </div>
                      ) : null}
                      <Button type="button" onClick={onCreateCompra} disabled={savingCompra || !compraForm.idSolicitud} data-testid="btn-confirmar-compra">{savingCompra ? 'Procesando...' : 'Confirmar compra'}</Button>
                    </article>
                  ) : null}

                  <article className="productivo-card">
                    <div className="users-admin-card__title"><h2>Compras realizadas</h2><small>{compras.length} registros</small></div>
                    {loadingCom ? <p className="productivo-helper">Cargando...</p> : (
                      <div className="productivo-table-wrap">
                        <table className="productivo-table">
                          <thead><tr><th>ID</th><th>Solicitud</th><th>Fecha</th><th>Total</th><th>Realizada por</th></tr></thead>
                          <tbody>
                            {compras.length === 0 ? <tr><td colSpan={5} className="productivo-table-empty">No hay compras.</td></tr> : compras.map(c => (
                              <tr key={c.idCompra}>
                                <td className="productivo-table-id">C#{c.idCompra}</td>
                                <td>S#{c.idSolicitud}</td>
                                <td>{toInputDate(c.fechaCompra)}</td>
                                <td className="productivo-table-value">{fmtCurrency(c.totalReal)}</td>
                                <td>{c.realizador?.nombreCompleto || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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
