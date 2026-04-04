import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { getVisibleNavItemsForRole } from '../../auth/navigation-utils';
import type { BackupExecutionResult, BackupListItem } from '../respaldos-types';
import { respaldosApi } from '../respaldos-api';
import {
  canViewRespaldos,
  formatBackupDateTime,
  formatBackupSource,
  formatBytes,
  getRespaldosErrorMessage,
  saveBackupBlob,
} from '../respaldos-utils';
import { ApiClientError } from '../../../types/api';
import { Button, NAV_ITEMS, Database, RefreshCw, LogOut, Shield, CheckCircle, Download } from '../../../shared/ui';

interface RespaldosPageProps {
  onGoHome: () => void;
  onNavigateModule?: (moduleName: string) => void;
}

interface UiMessage {
  type: 'error' | 'success' | 'warn';
  text: string;
}

export function RespaldosPage({ onGoHome, onNavigateModule }: RespaldosPageProps) {
  const { user, logout } = useAuth();
  const visibleNavItems = useMemo(() => getVisibleNavItemsForRole(user?.rol, NAV_ITEMS), [user?.rol]);
  const [loading, setLoading] = useState(true);
  const [runningManual, setRunningManual] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupListItem[]>([]);
  const [lastExecution, setLastExecution] = useState<BackupExecutionResult | null>(null);
  const [message, setMessage] = useState<UiMessage | null>(null);

  const canView = useMemo(() => canViewRespaldos(user?.rol), [user?.rol]);

  const handleApiError = useCallback(async (error: unknown) => {
    setMessage({ type: 'error', text: getRespaldosErrorMessage(error) });
    if (error instanceof ApiClientError && error.status === 401) {
      await logout();
    }
  }, [logout]);

  const loadBackups = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await respaldosApi.getRespaldos();
      setBackups(data);
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [canView, handleApiError]);

  useEffect(() => {
    void loadBackups();
  }, [loadBackups]);

  const onRunManual = async () => {
    try {
      setRunningManual(true);
      setMessage(null);
      const result = await respaldosApi.ejecutarRespaldoManual();
      setLastExecution(result);
      setMessage({ type: 'success', text: `Respaldo manual generado: ${result.fileName}` });
      await loadBackups();
    } catch (error) {
      await handleApiError(error);
    } finally {
      setRunningManual(false);
    }
  };

  const onDownloadBackup = async (backup: BackupListItem) => {
    try {
      setDownloadingFile(backup.fileName);
      setMessage(null);
      const downloaded = await respaldosApi.descargarRespaldo(backup.fileName);
      saveBackupBlob(downloaded.blob, downloaded.fileName);
      setMessage({ type: 'success', text: `Descarga iniciada: ${downloaded.fileName}` });
    } catch (error) {
      await handleApiError(error);
    } finally {
      setDownloadingFile(null);
    }
  };

  const onNavigate = (moduleName: string) => {
    if (onNavigateModule) {
      onNavigateModule(moduleName);
      return;
    }
    onGoHome();
  };

  return (
    <section className="users-admin-shell" data-testid="respaldos-page">
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
                className={`users-admin-sidebar__nav-item ${item.label === 'Respaldos' ? 'is-active' : ''}`}
                onClick={item.label === 'Respaldos' ? undefined : () => onNavigate(item.label)}
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
            <LogOut size={15} aria-hidden /> Cerrar sesion
          </Button>
        </footer>
      </aside>

      <main className="users-admin-main">
        <header className="users-admin-main__header" data-testid="respaldos-header">
          <div>
            <h1>Respaldos</h1>
            <p>Backups automaticos y recuperacion segura para Administrador</p>
          </div>
        </header>

        <div className="users-admin-main__body">
          {!canView ? (
            <article className="users-admin-empty">
              <h2>Acceso restringido</h2>
              <p>Solo Administrador puede consultar y ejecutar respaldos.</p>
              <Button type="button" variant="ghost" onClick={onGoHome}>
                Volver
              </Button>
            </article>
          ) : (
            <div className="respaldos-content">
              {message ? <p className={`users-message users-message--${message.type}`}>{message.text}</p> : null}

              <article className="respaldos-card respaldos-card--hero">
                <div className="respaldos-card__title">
                  <h2>
                    <Shield size={18} aria-hidden /> Respaldo y recuperacion
                  </h2>
                  <small>RF11 - respaldo automatico y ejecucion manual</small>
                </div>

                <div className="respaldos-policy">
                  <p>
                    <strong>Politica activa:</strong> se conserva historial de respaldos y solo el rol Administrador
                    puede ejecutar respaldos manuales.
                  </p>
                  <p>
                    <strong>Alcance:</strong> incluye modulos administrativos, ganado, sanitario, productivo, inventario y compras.
                  </p>
                  <p>
                    <strong>Recuperacion:</strong> la restauracion se ejecuta de forma controlada mediante script CLI de soporte.
                  </p>
                </div>

                <div className="respaldos-actions">
                  <Button
                    type="button"
                    onClick={onRunManual}
                    disabled={runningManual}
                    data-testid="respaldos-run-manual"
                  >
                    <Database size={16} aria-hidden />
                    {runningManual ? 'Generando respaldo...' : 'Generar respaldo manual'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void loadBackups()}
                    disabled={loading || runningManual || downloadingFile !== null}
                    data-testid="respaldos-refresh-list"
                  >
                    <RefreshCw size={14} aria-hidden /> Actualizar historial
                  </Button>
                </div>

                {lastExecution ? (
                  <div className="respaldos-last-run">
                    <p>
                      <strong>Ultimo respaldo manual:</strong> {lastExecution.fileName}
                    </p>
                    <p>
                      Fecha: {formatBackupDateTime(lastExecution.generatedAt)} | Fuente: {formatBackupSource(lastExecution.source)}
                    </p>
                    {lastExecution.cloud ? (
                      <p>
                        Nube: subida exitosa ({lastExecution.cloud.status}) - {formatBackupDateTime(lastExecution.cloud.uploadedAt)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>

              <article className="respaldos-card">
                <div className="respaldos-card__title">
                  <h2>Historial de respaldos</h2>
                  <small>{backups.length} archivo(s)</small>
                </div>

                {loading ? (
                  <div className="users-admin-empty">
                    <h2>Cargando historial...</h2>
                    <p>Consultando respaldos disponibles en el backend.</p>
                  </div>
                ) : backups.length === 0 ? (
                  <p className="reportes-empty">No hay respaldos generados todavia.</p>
                ) : (
                  <div className="respaldos-history-list" data-testid="respaldos-history-list">
                    {backups.map((backup) => {
                      const recentExecution = lastExecution && lastExecution.fileName === backup.fileName
                        ? lastExecution
                        : null;

                      return (
                        <article key={backup.fileName} className="respaldos-item">
                          <div className="respaldos-item__file">
                            <strong>{backup.fileName}</strong>
                            <small>Creado: {formatBackupDateTime(backup.createdAt)}</small>
                          </div>

                          <div className="respaldos-item__meta">
                            <span>{formatBytes(backup.sizeBytes)}</span>
                            <small>Modificado: {formatBackupDateTime(backup.modifiedAt)}</small>
                          </div>

                          <span className="respaldos-badge is-source">
                            {formatBackupSource(recentExecution?.source || null)}
                          </span>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => void onDownloadBackup(backup)}
                            disabled={runningManual || downloadingFile === backup.fileName}
                            data-testid={`respaldos-download-${backup.fileName}`}
                          >
                            <Download size={14} aria-hidden />
                            {downloadingFile === backup.fileName ? 'Descargando...' : 'Descargar'}
                          </Button>

                          <span className="respaldos-badge is-ok">
                            <CheckCircle size={14} aria-hidden /> COMPLETADO
                          </span>
                        </article>
                      );
                    })}
                  </div>
                )}
              </article>
            </div>
          )}
        </div>
      </main>
    </section>
  );
}
