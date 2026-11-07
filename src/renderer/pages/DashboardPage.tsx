import React from 'react';
import { DeskflowStatus, AppConfig, SystemInfo, TransitionLink } from '../../shared/types';

interface DashboardPageProps {
  status: DeskflowStatus;
  config: AppConfig;
  systemInfo: SystemInfo | null;
  activeLinks: TransitionLink[];
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  status,
  config,
  systemInfo,
  activeLinks,
  onStart,
  onStop,
  onRestart,
  onNavigate
}) => {
  const isRunning = status.status === 'running';
  const isStarting = status.status === 'starting';

  const hostComputer = config.computers.find((c) => c.isServer) || config.computers[0];
  const clientComputers = config.computers.filter((c) => !c.isServer);

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Status Cards */}
      <div className="row g-3">
        {/* Card 1: Engine Status */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-secondary small fw-bold">DESKFLOW ENGINE</span>
                <span
                  className={`badge ${
                    isRunning ? 'bg-success' : isStarting ? 'bg-warning text-dark' : 'bg-secondary'
                  }`}
                >
                  {status.status.toUpperCase()}
                </span>
              </div>
              <h4 className="fw-bold mb-1 text-dark">
                {isRunning ? (config.role === 'server' ? 'Server Active' : 'Client Connected') : 'Stopped'}
              </h4>
              <p className="text-muted small mb-0">
                {isRunning ? `Port ${status.port} • PID ${status.pid}` : 'Click Start to begin mouse sharing'}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Host Computer */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-secondary small fw-bold">THIS COMPUTER</span>
                <span className="badge bg-primary">
                  {config.role === 'server' ? 'HOST (Server)' : 'GUEST (Client)'}
                </span>
              </div>
              <h4 className="fw-bold mb-1 text-dark text-truncate" title={config.localScreenName}>
                {config.localScreenName}
              </h4>
              <p className="text-muted small mb-0 font-monospace">
                IP: {systemInfo?.networkInterfaces[0]?.address || '127.0.0.1'}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Screens Count */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-secondary small fw-bold">CONFIGURED LAPTOPS</span>
                <i className="bi bi-laptop text-primary fs-5"></i>
              </div>
              <h4 className="fw-bold mb-1 text-dark">{config.computers.length} Laptops</h4>
              <p className="text-muted small mb-0">
                1 Host + {clientComputers.length} Guest{clientComputers.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Cursor Transitions */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-secondary small fw-bold">ACTIVE TRANSITIONS</span>
                <i className="bi bi-bezier2 text-success fs-5"></i>
              </div>
              <h4 className="fw-bold mb-1 text-dark">{activeLinks.length} Directional Paths</h4>
              <p className="text-muted small mb-0">Seamless mouse edges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Controls & Banner */}
      <div className="card shadow-sm border-0 bg-white">
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className={`p-3 rounded-circle text-white d-flex align-items-center justify-content-center ${
                isRunning ? 'bg-success' : 'bg-primary'
              }`}
              style={{ width: '56px', height: '56px' }}
            >
              <i className={`bi ${isRunning ? 'bi-check-lg' : 'bi-mouse'} fs-3`}></i>
            </div>
            <div>
              <h5 className="fw-bold mb-1">
                {isRunning
                  ? 'MultiLaptop Mouse Sharing is Active'
                  : 'Ready to Share Mouse & Keyboard Across Laptops'}
              </h5>
              <p className="text-secondary mb-0 small">
                {isRunning
                  ? `Move your cursor off configured screen edges to seamlessly transition between computers.`
                  : `Ensure all laptops are connected to the same local Wi-Fi or LAN network.`}
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {!isRunning ? (
              <button
                className="btn btn-primary btn-lg px-4 d-flex align-items-center gap-2 shadow"
                onClick={onStart}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Starting Engine...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-circle fs-5"></i>
                    <span>Start Mouse Sharing</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  className="btn btn-danger btn-lg px-4 d-flex align-items-center gap-2 shadow"
                  onClick={onStop}
                >
                  <i className="bi bi-stop-circle fs-5"></i>
                  <span>Stop Sharing</span>
                </button>
                <button className="btn btn-outline-secondary btn-lg" onClick={onRestart} title="Restart Engine">
                  <i className="bi bi-arrow-repeat fs-5"></i>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Layout Mini-Preview & Computers Table */}
      <div className="row g-3">
        {/* Left: Current Screen Layout Preview */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 px-4 d-flex align-items-center justify-content-between border-0">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-diagram-3 text-primary fs-5"></i>
                <h6 className="fw-bold mb-0">Current Physical Layout Preview</h6>
              </div>
              <button className="btn btn-sm btn-outline-primary" onClick={() => onNavigate('layout')}>
                <i className="bi bi-pencil-square me-1"></i>
                Edit Layout
              </button>
            </div>

            <div className="card-body p-3">
              {/* Mini Preview Box */}
              <div
                className="position-relative bg-light rounded border overflow-hidden"
                style={{ height: '320px', width: '100%' }}
              >
                {config.computers.map((screen) => {
                  // Scale coordinates down to fit preview
                  const scale = 0.55;
                  const previewX = screen.x * scale;
                  const previewY = screen.y * scale;
                  const previewW = screen.width * scale;
                  const previewH = screen.height * scale;

                  return (
                    <div
                      key={screen.id}
                      className="position-absolute rounded shadow-sm d-flex flex-column align-items-center justify-content-center p-1 text-center"
                      style={{
                        left: `${previewX}px`,
                        top: `${previewY}px`,
                        width: `${previewW}px`,
                        height: `${previewH}px`,
                        backgroundColor: screen.isServer ? '#1e3a8a' : '#334155',
                        color: '#ffffff',
                        border: '2px solid #3b82f6',
                        fontSize: '0.72rem'
                      }}
                    >
                      <i className={`bi ${screen.isServer ? 'bi-shield-shaded text-warning' : 'bi-laptop'}`}></i>
                      <strong className="text-truncate px-1" style={{ maxWidth: '100%' }}>
                        {screen.name}
                      </strong>
                      <span className="text-white-50 font-monospace" style={{ fontSize: '0.65rem' }}>
                        {screen.ip}
                      </span>
                    </div>
                  );
                })}

                {/* Transition Direction Summaries */}
                <div className="position-absolute bottom-0 start-0 m-2 p-2 bg-white bg-opacity-90 rounded border small">
                  <div className="fw-bold text-dark mb-1">Cursor Paths:</div>
                  {activeLinks.length === 0 ? (
                    <span className="text-muted">No links detected</span>
                  ) : (
                    activeLinks.slice(0, 3).map((l, i) => (
                      <div key={i} className="text-secondary" style={{ fontSize: '0.75rem' }}>
                        {l.fromScreen} ➔ {l.toScreen} ({l.direction})
                      </div>
                    ))
                  )}
                  {activeLinks.length > 3 && (
                    <div className="text-primary" style={{ fontSize: '0.75rem' }}>
                      +{activeLinks.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Connected Computers List */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 px-4 d-flex align-items-center justify-content-between border-0">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-pc-display text-primary fs-5"></i>
                <h6 className="fw-bold mb-0">Computers in Cluster</h6>
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => onNavigate('computers')}>
                Manage
              </button>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Computer</th>
                      <th>IP Address</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.computers.map((comp) => (
                      <tr key={comp.id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2">
                            <i
                              className={`bi ${
                                comp.isServer ? 'bi-display text-primary' : 'bi-laptop text-secondary'
                              } fs-5`}
                            ></i>
                            <div>
                              <div className="fw-bold text-dark">{comp.name}</div>
                              <small className="text-muted">{comp.model || 'Standard Laptop'}</small>
                            </div>
                          </div>
                        </td>
                        <td className="font-monospace text-secondary small">{comp.ip}</td>
                        <td>
                          {comp.isServer ? (
                            <span className="badge bg-primary">HOST (Server)</span>
                          ) : (
                            <span className="badge bg-secondary">GUEST (Client)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
