import React, { useState } from 'react';
import { ComputerNode, AppConfig } from '../../shared/types';

interface ComputersPageProps {
  config: AppConfig;
  onUpdateConfig: (updated: AppConfig) => void;
  onSave: () => void;
}

export const ComputersPage: React.FC<ComputersPageProps> = ({ config, onUpdateConfig, onSave }) => {
  const [computers, setComputers] = useState<ComputerNode[]>(config.computers);
  const [editingComp, setEditingComp] = useState<ComputerNode | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form states
  const [formName, setFormName] = useState<string>('');
  const [formIp, setFormIp] = useState<string>('');
  const [formPort, setFormPort] = useState<number>(24800);
  const [formIsServer, setFormIsServer] = useState<boolean>(false);
  const [formModel, setFormModel] = useState<string>('Laptop');
  const [formColor, setFormColor] = useState<string>('#3b82f6');

  const openAddModal = () => {
    setEditingComp(null);
    setFormName(`Client-Laptop-${computers.length}`);
    setFormIp('192.168.1.');
    setFormPort(24800);
    setFormIsServer(false);
    setFormModel('Client Laptop');
    setFormColor('#3b82f6');
    setShowModal(true);
  };

  const openEditModal = (comp: ComputerNode) => {
    setEditingComp(comp);
    setFormName(comp.name);
    setFormIp(comp.ip);
    setFormPort(comp.port || 24800);
    setFormIsServer(comp.isServer);
    setFormModel(comp.model || 'Windows Laptop');
    setFormColor(comp.color || '#3b82f6');
    setShowModal(true);
  };

  const handleSaveComputer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let updatedList: ComputerNode[];

    if (editingComp) {
      // Edit
      updatedList = computers.map((c) => {
        if (c.id === editingComp.id) {
          return {
            ...c,
            name: formName.trim(),
            ip: formIp.trim(),
            port: formPort,
            isServer: formIsServer,
            model: formModel,
            color: formColor
          };
        }
        // If this one is marked as server, unmark others
        if (formIsServer && c.id !== editingComp.id) {
          return { ...c, isServer: false };
        }
        return c;
      });
    } else {
      // Add new
      const newScreen: ComputerNode = {
        id: `comp-${Date.now()}`,
        name: formName.trim(),
        ip: formIp.trim(),
        port: formPort,
        isServer: formIsServer,
        x: 60 + (computers.length % 3) * 240,
        y: 60 + Math.floor(computers.length / 3) * 160,
        width: 220,
        height: 130,
        color: formColor,
        model: formModel,
        resolution: { width: 1920, height: 1080 }
      };

      updatedList = formIsServer
        ? computers.map((c) => ({ ...c, isServer: false })).concat(newScreen)
        : [...computers, newScreen];
    }

    setComputers(updatedList);
    onUpdateConfig({
      ...config,
      computers: updatedList
    });
    onSave();
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (computers.length <= 1) {
      alert('You must have at least one computer in your cluster.');
      return;
    }
    const updated = computers.filter((c) => c.id !== id);
    setComputers(updated);
    onUpdateConfig({
      ...config,
      computers: updated
    });
    onSave();
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Bar */}
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h5 className="fw-bold mb-1">Connected Laptops & Computers</h5>
          <p className="text-secondary small mb-0">
            Configure hostnames, IP addresses, and roles for each computer in your sharing network.
          </p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" onClick={openAddModal}>
          <i className="bi bi-plus-circle fs-6"></i>
          <span>Add Laptop</span>
        </button>
      </div>

      {/* Network Setup Tip */}
      <div className="alert alert-info border-0 shadow-sm d-flex align-items-start gap-3 py-3 px-4">
        <i className="bi bi-info-circle-fill fs-4 text-info mt-1"></i>
        <div>
          <strong>Important Deskflow Screen Name Matching:</strong>
          <p className="small mb-0 text-dark">
            Deskflow matches computers by their exact computer name (hostname). On each client laptop, run{' '}
            <code className="bg-white px-2 py-1 rounded text-dark border">hostname</code> in PowerShell or CMD to find its exact name and enter it here.
          </p>
        </div>
      </div>

      {/* Computers Grid */}
      <div className="row g-3">
        {computers.map((comp) => (
          <div key={comp.id} className="col-md-6 col-lg-4">
            <div className="card shadow-sm border-0 h-100">
              <div
                className="card-header py-3 px-3 d-flex align-items-center justify-content-between text-white"
                style={{ backgroundColor: comp.isServer ? '#1e3a8a' : '#334155' }}
              >
                <div className="d-flex align-items-center gap-2 text-truncate">
                  <i className={`bi ${comp.isServer ? 'bi-shield-shaded text-warning' : 'bi-laptop'} fs-5`}></i>
                  <span className="fw-bold text-truncate">{comp.name}</span>
                </div>
                {comp.isServer ? (
                  <span className="badge bg-warning text-dark fw-bold">HOST (Server)</span>
                ) : (
                  <span className="badge bg-secondary">GUEST (Client)</span>
                )}
              </div>

              <div className="card-body p-3">
                <div className="mb-2">
                  <span className="text-muted small">IP Address:</span>
                  <div className="font-monospace fw-semibold text-dark">{comp.ip || '127.0.0.1'}</div>
                </div>

                <div className="mb-2">
                  <span className="text-muted small">Port:</span>
                  <div className="font-monospace small text-dark">{comp.port || 24800}</div>
                </div>

                <div className="mb-3">
                  <span className="text-muted small">Model / Note:</span>
                  <div className="small text-secondary">{comp.model || 'Standard Laptop'}</div>
                </div>

                <div className="d-flex justify-content-end gap-2 border-top pt-3">
                  <button
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                    onClick={() => openEditModal(comp)}
                  >
                    <i className="bi bi-pencil"></i>
                    <span>Edit</span>
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                    onClick={() => handleDelete(comp.id)}
                    disabled={comp.isServer}
                    title={comp.isServer ? 'Host computer cannot be deleted' : 'Delete computer'}
                  >
                    <i className="bi bi-trash"></i>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleSaveComputer}>
                <div className="modal-header">
                  <h6 className="modal-title fw-bold">
                    {editingComp ? 'Edit Computer Settings' : 'Add New Computer'}
                  </h6>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Computer Name (Hostname) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Host-Laptop or Client-Laptop"
                      required
                    />
                    <small className="form-text text-muted">
                      Must match the Windows hostname of the computer.
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">IP Address</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      value={formIp}
                      onChange={(e) => setFormIp(e.target.value)}
                      placeholder="e.g. 192.168.1.150"
                    />
                    <small className="form-text text-muted">
                      Local network IP of this computer.
                    </small>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Port</label>
                      <input
                        type="number"
                        className="form-control font-monospace"
                        value={formPort}
                        onChange={(e) => setFormPort(Number(e.target.value))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Laptop Model / Note</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formModel}
                        onChange={(e) => setFormModel(e.target.value)}
                        placeholder="Dell XPS, ThinkPad..."
                      />
                    </div>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isServerCheck"
                      checked={formIsServer}
                      onChange={(e) => setFormIsServer(e.target.checked)}
                    />
                    <label className="form-check-label fw-bold small" htmlFor="isServerCheck">
                      Host Computer (Controls others with its physical mouse & keyboard)
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4">
                    Save Computer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
