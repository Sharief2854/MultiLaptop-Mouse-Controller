import React from 'react';
import { DeskflowStatus, AppConfig } from '../../shared/types';

interface MainLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  status: DeskflowStatus;
  config: AppConfig | null;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentTab,
  onTabChange,
  status,
  config,
  onStart,
  onStop,
  onRestart,
  children
}) => {
  const isRunning = status.status === 'running';
  const isStarting = status.status === 'starting';

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="p-3 border-bottom border-secondary d-flex align-items-center gap-2">
          <i className="bi bi-display fs-3 text-primary"></i>
          <div>
            <h6 className="mb-0 fw-bold text-white">MultiLaptop</h6>
            <small className="text-secondary" style={{ fontSize: '0.75rem' }}>Mouse Controller</small>
          </div>
        </div>

        <nav className="nav flex-column my-3">
          <button
            className={`nav-link text-start border-0 ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
          >
            <i className="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-link text-start border-0 ${currentTab === 'layout' ? 'active' : ''}`}
            onClick={() => onTabChange('layout')}
          >
            <i className="bi bi-grid-3x3-gap"></i>
            <span>Screen Layout</span>
          </button>

          <button
            className={`nav-link text-start border-0 ${currentTab === 'computers' ? 'active' : ''}`}
            onClick={() => onTabChange('computers')}
          >
            <i className="bi bi-laptop"></i>
            <span>Laptops ({config?.computers.length || 0})</span>
          </button>

          <button
            className={`nav-link text-start border-0 ${currentTab === 'logs' ? 'active' : ''}`}
            onClick={() => onTabChange('logs')}
          >
            <i className="bi bi-terminal"></i>
            <span>Deskflow Logs</span>
          </button>

          <button
            className={`nav-link text-start border-0 ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => onTabChange('settings')}
          >
            <i className="bi bi-gear"></i>
            <span>Settings</span>
          </button>
        </nav>

        <div className="mt-auto p-3 border-top border-secondary text-secondary" style={{ fontSize: '0.78rem' }}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className={`badge ${config?.role === 'server' ? 'bg-primary' : 'bg-success'}`}>
              {config?.role === 'server' ? 'HOST SERVER' : 'GUEST CLIENT'}
            </span>
            <span className="text-white-50">{config?.localScreenName || 'Local'}</span>
          </div>
          <div>Deskflow Core: <span className="text-white">{status.binaryType}</span></div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header Bar */}
        <header className="header-bar">
          <div className="d-flex align-items-center gap-3">
            <span className="fw-semibold text-dark fs-5 text-capitalize">
              {currentTab === 'layout' ? 'Visual Screen Layout Editor' : currentTab}
            </span>

            {/* Connection Status Pill */}
            <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-light border">
              <span
                className={`rounded-circle d-inline-block`}
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor:
                    status.status === 'running'
                      ? '#10b981'
                      : status.status === 'starting'
                      ? '#f59e0b'
                      : status.status === 'error'
                      ? '#ef4444'
                      : '#94a3b8'
                }}
              ></span>
              <span className="fw-medium text-capitalize" style={{ fontSize: '0.85rem' }}>
                {status.status}
              </span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="d-flex align-items-center gap-2">
            {!isRunning ? (
              <button
                className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1 shadow-sm"
                onClick={onStart}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-fill fs-6"></i>
                    <span>Start Sharing</span>
                  </>
                )}
              </button>
            ) : (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-danger btn-sm px-3 d-flex align-items-center gap-1 shadow-sm"
                  onClick={onStop}
                >
                  <i className="bi bi-stop-fill fs-6"></i>
                  <span>Stop</span>
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={onRestart}
                  title="Restart Deskflow Core"
                >
                  <i className="bi bi-arrow-repeat"></i>
                  <span>Restart</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Container */}
        <div className="page-container">{children}</div>

        {/* Footer Status Bar */}
        <footer className="footer-status-bar">
          <div className="d-flex align-items-center gap-3">
            <span>
              <i className="bi bi-hdd-network me-1"></i>
              Port: <strong>{status.port}</strong>
            </span>
            <span>
              <i className="bi bi-cpu me-1"></i>
              PID: <strong>{status.pid || 'Inactive'}</strong>
            </span>
            {status.status === 'running' && (
              <span>
                <i className="bi bi-clock-history me-1"></i>
                Uptime: <strong>{formatUptime(status.uptimeSeconds)}</strong>
              </span>
            )}
          </div>
          <div>
            <span>MultiLaptop Mouse Controller v1.0 • Windows 10/11</span>
          </div>
        </footer>
      </main>
    </div>
  );
};
