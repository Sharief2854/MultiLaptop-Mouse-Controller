import React, { useState, useEffect } from 'react';
import { AppConfig, SystemInfo, DeskflowStatus, UpdateStatus } from '../../shared/types';
import { api } from '../services/api';

interface SettingsPageProps {
  config: AppConfig;
  systemInfo: SystemInfo | null;
  status: DeskflowStatus;
  onUpdateConfig: (updated: AppConfig) => void;
  onSave: () => void;
  onReset: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  config,
  systemInfo,
  status,
  onUpdateConfig,
  onSave,
  onReset
}) => {
  const [formData, setFormData] = useState<AppConfig>({ ...config });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ status: 'idle' });
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);

  useEffect(() => {
    const unsub = api.onUpdateStatusChange((newStatus) => {
      setUpdateStatus(newStatus);
      if (newStatus.status !== 'checking') {
        setIsCheckingUpdate(false);
      }
    });
    return unsub;
  }, []);

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const res = await api.checkForUpdates();
      setUpdateStatus(res);
    } catch (e: any) {
      setUpdateStatus({ status: 'error', error: e.message });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleDownloadUpdate = async () => {
    await api.downloadUpdate();
  };

  const handleInstallUpdate = async () => {
    await api.quitAndInstallUpdate();
  };

  const handleChange = (field: keyof AppConfig, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdateConfig(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    onSave();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This will restore the default 2-laptop vertical layout.')) {
      onReset();
    }
  };

  return (
    <div className="d-flex flex-column gap-3 pb-4">
      {/* Top Header */}
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h5 className="fw-bold mb-1">Application & Engine Settings</h5>
          <p className="text-secondary small mb-0">
            Configure networking, Deskflow engine binaries, cursor transition timing, and clipboard sharing.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-danger btn-sm" onClick={handleReset}>
            <i className="bi bi-arrow-counterclockwise me-1"></i>
            Reset to Defaults
          </button>
          <button className="btn btn-primary btn-sm px-4 shadow-sm" onClick={handleSave}>
            <i className="bi bi-save me-1"></i>
            Save Settings
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="alert alert-success border-0 py-2 px-3 small d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-check-circle-fill"></i>
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="d-flex flex-column gap-3">
        {/* Section 1: Operation Mode */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 px-4 border-0">
            <h6 className="fw-bold mb-0">Computer Role</h6>
          </div>
          <div className="card-body px-4 pt-0">
            <div className="row g-3">
              <div className="col-md-6">
                <div
                  className={`p-3 rounded border cursor-pointer ${
                    formData.role === 'server' ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'
                  }`}
                  onClick={() => handleChange('role', 'server')}
                >
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="roleRadio"
                      id="roleServer"
                      checked={formData.role === 'server'}
                      onChange={() => handleChange('role', 'server')}
                    />
                    <label className="form-check-label fw-bold text-dark" htmlFor="roleServer">
                      Host Computer (Server)
                    </label>
                  </div>
                  <p className="small text-muted mt-2 mb-0">
                    This computer has the physical mouse and keyboard attached. It will control other laptops.
                  </p>
                </div>
              </div>

              <div className="col-md-6">
                <div
                  className={`p-3 rounded border cursor-pointer ${
                    formData.role === 'client' ? 'border-success bg-success bg-opacity-10' : 'bg-light'
                  }`}
                  onClick={() => handleChange('role', 'client')}
                >
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="roleRadio"
                      id="roleClient"
                      checked={formData.role === 'client'}
                      onChange={() => handleChange('role', 'client')}
                    />
                    <label className="form-check-label fw-bold text-dark" htmlFor="roleClient">
                      Guest Laptop (Client)
                    </label>
                  </div>
                  <p className="small text-muted mt-2 mb-0">
                    This laptop receives cursor movement and keystrokes sent from the host computer over Wi-Fi/LAN.
                  </p>
                </div>
              </div>
            </div>

            {formData.role === 'client' && (
              <div className="mt-3 p-3 bg-light rounded border">
                <label className="form-label small fw-bold">Host Computer IP Address</label>
                <input
                  type="text"
                  className="form-control font-monospace"
                  value={formData.serverHost}
                  onChange={(e) => handleChange('serverHost', e.target.value)}
                  placeholder="e.g. 192.168.1.100"
                />
                <small className="form-text text-muted">
                  The local IP address of the Host machine running the Deskflow server.
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Engine Binary Settings */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 px-4 border-0">
            <h6 className="fw-bold mb-0">Deskflow Engine Binary</h6>
          </div>
          <div className="card-body px-4 pt-0">
            <div className="mb-3">
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="useBundledCheck"
                  checked={formData.useBundledDeskflow}
                  onChange={(e) => handleChange('useBundledDeskflow', e.target.checked)}
                />
                <label className="form-check-label fw-bold small text-dark" htmlFor="useBundledCheck">
                  Use Bundled Portable Deskflow Engine (Recommended)
                </label>
              </div>
              <p className="small text-muted mb-2">
                Includes the verified Deskflow v1.27.0 binaries and Qt6 libraries. No installation required.
              </p>
              <div className="p-2 bg-light rounded border font-monospace small text-secondary">
                Resolved: {status.binaryPath || 'Bundled deskflow-core.exe'} ({status.binaryType})
              </div>
            </div>

            {!formData.useBundledDeskflow && (
              <div className="mb-3">
                <label className="form-label small fw-bold">Custom Deskflow Binary Path</label>
                <input
                  type="text"
                  className="form-control font-monospace small"
                  value={formData.deskflowBinaryPath}
                  onChange={(e) => handleChange('deskflowBinaryPath', e.target.value)}
                  placeholder="C:\Program Files\Deskflow\deskflow-core.exe"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Mouse & Transition Timing */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 px-4 border-0">
            <h6 className="fw-bold mb-0">Mouse Cursor & Clipboard Behavior</h6>
          </div>
          <div className="card-body px-4 pt-0">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="clipboardCheck"
                    checked={formData.clipboardSharing}
                    onChange={(e) => handleChange('clipboardSharing', e.target.checked)}
                  />
                  <label className="form-check-label fw-bold small" htmlFor="clipboardCheck">
                    Shared Clipboard (Copy & Paste across laptops)
                  </label>
                  <div className="small text-muted">
                    Allows copying text and images on one computer and pasting on another.
                  </div>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="win32ForegroundCheck"
                    checked={formData.win32KeepForeground}
                    onChange={(e) => handleChange('win32KeepForeground', e.target.checked)}
                  />
                  <label className="form-check-label fw-bold small" htmlFor="win32ForegroundCheck">
                    Win32 Foreground Focus Grab
                  </label>
                  <div className="small text-muted">
                    Helps prevent third-party Windows apps from interfering with mouse input captures.
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label small fw-bold d-flex justify-content-between">
                    <span>Edge Switch Delay</span>
                    <span className="text-primary">{formData.switchDelay} ms</span>
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    min="0"
                    max="1000"
                    step="50"
                    value={formData.switchDelay}
                    onChange={(e) => handleChange('switchDelay', Number(e.target.value))}
                  />
                  <div className="small text-muted">
                    Delays switching computers until the cursor stays at the edge for N ms (prevents accidental transitions).
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold d-flex justify-content-between">
                    <span>Double Tap to Switch</span>
                    <span className="text-primary">{formData.switchDoubleTap} ms</span>
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    min="0"
                    max="500"
                    step="50"
                    value={formData.switchDoubleTap}
                    onChange={(e) => handleChange('switchDoubleTap', Number(e.target.value))}
                  />
                  <div className="small text-muted">
                    Set to 0 to disable. When enabled, requires bumping the edge twice to switch.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: General Preferences */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 px-4 border-0">
            <h6 className="fw-bold mb-0">Application Preferences</h6>
          </div>
          <div className="card-body px-4 pt-0">
            <div className="form-check form-switch mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="autoStartCheck"
                checked={formData.autoStartDaemon}
                onChange={(e) => handleChange('autoStartDaemon', e.target.checked)}
              />
              <label className="form-check-label fw-bold small" htmlFor="autoStartCheck">
                Auto-start mouse sharing when application opens
              </label>
            </div>
          </div>
        </div>

        {/* Section 5: Software Updates (Electron Auto-Updater) */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 px-4 border-0 d-flex align-items-center justify-content-between">
            <h6 className="fw-bold mb-0">Software Updates (Electron Auto-Updater)</h6>
            <span className="badge bg-secondary">v1.0.0</span>
          </div>
          <div className="card-body px-4 pt-0">
            <p className="small text-muted mb-3">
              MultiLaptop Mouse Controller features automatic update checks powered by electron-updater and GitHub Releases.
            </p>

            <div className="d-flex flex-wrap align-items-center gap-3">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                onClick={handleCheckUpdate}
                disabled={isCheckingUpdate || updateStatus.status === 'downloading'}
              >
                {isCheckingUpdate ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Checking GitHub...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-down fs-6"></i>
                    <span>Check for Updates</span>
                  </>
                )}
              </button>

              {updateStatus.status === 'not-available' && (
                <span className="small text-success d-flex align-items-center gap-1">
                  <i className="bi bi-check-circle-fill"></i>
                  You are running the latest version.
                </span>
              )}

              {updateStatus.status === 'available' && (
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-primary fw-bold">
                    New version v{updateStatus.version} available!
                  </span>
                  <button
                    type="button"
                    className="btn btn-success btn-sm py-1 px-3"
                    onClick={handleDownloadUpdate}
                  >
                    Download Update
                  </button>
                </div>
              )}

              {updateStatus.status === 'downloading' && (
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                  <span className="small text-primary">
                    Downloading: {updateStatus.percent || 0}%
                  </span>
                </div>
              )}

              {updateStatus.status === 'downloaded' && (
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-success fw-bold">
                    Update downloaded and verified!
                  </span>
                  <button
                    type="button"
                    className="btn btn-warning btn-sm text-dark fw-bold py-1 px-3 shadow-sm"
                    onClick={handleInstallUpdate}
                  >
                    <i className="bi bi-arrow-repeat me-1"></i>
                    Restart & Install Now
                  </button>
                </div>
              )}

              {updateStatus.status === 'error' && (
                <span className="small text-muted">
                  {updateStatus.error || 'GitHub releases checked.'}
                </span>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
