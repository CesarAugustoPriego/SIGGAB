import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { dashboardApi } from '../../dashboard/dashboard-api';
import type { BitacoraEntry } from '../../dashboard/dashboard-types';
import { Button, LogOut, Shield, Search, RefreshCw } from '../../../shared/ui';
import { NAV_ITEMS } from '../../../shared/ui/nav-items';

function fmtDateTime(dStr: string) {
  return new Date(dStr).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getAccionColor(accion: string) {
  const a = accion.toUpperCase();
  if (a.includes('CREATE') || a.includes('CREAR')) return 'is-create';
  if (a.includes('UPDATE') || a.includes('ACTUALIZAR')) return 'is-update';
  if (a.includes('DELETE') || a.includes('ELIMINAR')) return 'is-delete';
  if (a.includes('LOGIN')) return 'is-login';
  return '';
}

interface AuditoriaPageProps {
  onGoHome?: () => void;
  onGoUsersAdmin?: () => void;
  onNavigateModule?: (mod: string) => void;
}

export function AuditoriaPage({ onNavigateModule }: AuditoriaPageProps) {
  const { user, logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>([]);
  const [searchWord, setSearchWord] = useState('');
  const [limit, setLimit] = useState(100);

  const fetchBitacora = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const b = await dashboardApi.getBitacora(limit);
      setBitacora(b);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error al obtener bitácora');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchBitacora();
  }, [fetchBitacora]);

  const filtered = useMemo(() => {
    if (!searchWord) return bitacora;
    const term = searchWord.toLowerCase();
    return bitacora.filter(b => 
      b.usuario.nombreCompleto.toLowerCase().includes(term) ||
      b.usuario.username.toLowerCase().includes(term) ||
      b.accion.toLowerCase().includes(term) ||
      b.tablaAfectada.toLowerCase().includes(term)
    );
  }, [bitacora, searchWord]);

  return (
    <section className="users-admin-shell" data-testid="auditoria-page">
      {/* ── Sidebar ── */}
      <aside className="users-admin-sidebar">
        <div className="users-admin-sidebar__logo">
          <img src="/branding/logo-rancho-los-alpes.png" alt="Logo Rancho Los Alpes" />
        </div>
        <nav className="users-admin-sidebar__nav" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className={`users-admin-sidebar__nav-item ${item.label === 'Auditoria' ? 'is-active' : ''}`}
                onClick={item.label === 'Auditoria' ? undefined : () => onNavigateModule?.(item.label)}
              >
                <Icon size={18} aria-hidden /> {item.label}
              </button>
            );
          })}
        </nav>
        <footer className="users-admin-sidebar__footer">
          <p>{user?.nombreCompleto || 'Usuario'}</p>
          <small>{user?.rol || 'Sin rol'}</small>
          <Button type="button" className="users-admin-sidebar__logout" onClick={logout}>
            <LogOut size={15} aria-hidden /> Cerrar sesión
          </Button>
        </footer>
      </aside>

      {/* ── Main Content ── */}
      <main className="users-admin-main">
        <header className="users-admin-main__header" data-testid="auditoria-header">
          <div>
            <h1><Shield size={22} style={{marginRight: '0.5rem', verticalAlign: 'middle', color: '#10b981'}} /> Auditoría del Sistema</h1>
            <p className="dash-subtitle">Registro de actividad y bitácora de seguridad</p>
          </div>
          <Button type="button" variant="ghost" onClick={fetchBitacora}>
            <RefreshCw size={14} aria-hidden /> Actualizar
          </Button>
        </header>

        {error && <p className="users-message users-message--error">{error}</p>}

        <div className="users-admin-main__body">
          <article className="productivo-card">
            <div className="ganado-toolbar">
              <div className="ganado-search">
                <Search size={18} className="ganado-search__icon" aria-hidden />
                <input
                  type="text"
                  className="ganado-search__input"
                  placeholder="Buscar usuario, acción o tabla..."
                  value={searchWord}
                  onChange={e => setSearchWord(e.target.value)}
                />
              </div>
              
              <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                <label style={{fontSize: '0.85rem', color: '#6b7280'}}>Mostrar:</label>
                <select
                  className="ganado-search__select"
                  value={limit}
                  onChange={e => setLimit(Number(e.target.value))}
                >
                  <option value={50}>50 registros</option>
                  <option value={100}>100 registros</option>
                  <option value={200}>200 registros</option>
                  <option value={500}>500 registros</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="users-admin-empty">
                <h2>Cargando bitácora...</h2>
                <p>Descargando el historial de actividad.</p>
              </div>
            ) : (
              <div className="productivo-table-wrap" style={{marginTop: '1rem'}}>
                <table className="productivo-table">
                  <thead>
                    <tr>
                      <th>Fecha/Hora</th>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Sección/Tabla</th>
                      <th>Acción</th>
                      <th>ID Reg.</th>
                      <th>Detalles Expandidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(b => (
                      <tr key={b.idBitacora}>
                        <td className="dash-date-sm">{fmtDateTime(b.fechaHora)}</td>
                        <td>
                          <strong>{b.usuario.nombreCompleto}</strong>
                          <br />
                          <small className="dash-username">@{b.usuario.username}</small>
                        </td>
                        <td>{/* No viene rol en el dashboard-types pero lo mostramos si estuviera */}
                            <span className="user-role-badge">Admin {/* hardcodeado provisional pero debe venir en back */}</span>
                        </td>
                        <td>{b.tablaAfectada}</td>
                        <td>
                          <span className={`dash-action-badge ${getAccionColor(b.accion)}`}>
                            {b.accion}
                          </span>
                        </td>
                        <td className="productivo-table-id">#{b.idRegistro}</td>
                        <td className="productivo-table-obs">
                          {b.detalles ? JSON.stringify(b.detalles).slice(0, 60) : '—'}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="productivo-empty">Sin registros de auditoría encontrados.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
      </main>
    </section>
  );
}
