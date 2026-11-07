import React, { useState, useRef, useEffect } from 'react';
import { DeskflowLogEntry, DeskflowStatus } from '../../shared/types';
import { api } from '../services/api';

interface LogsPageProps {
  logs: DeskflowLogEntry[];
  status: DeskflowStatus;
  onClearLogs: () => void;
}

export const LogsPage: React.FC<LogsPageProps> = ({ logs, status, onClearLogs }) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === 'ALL') return true;
    return log.level === filterLevel;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="d-flex flex-column gap-3 h-100">
      {/* Top Diagnostics Card */}
      <div className="card shadow-sm border-0">
        <div className="card-body py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-3 small">
            <div>
              Status: <span className="badge bg-secondary">{status.status.toUpperCase()}</span>
            </div>
            <div>
              Binary: <span className="font-monospace text-dark">{status.binaryPath}</span>
            </div>
            <div>
              Mode: <strong>{status.mode}</strong>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              style={{ width: '130px' }}
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="ALL">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="FATAL">FATAL</option>
            </select>

            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={handleCopyLogs}
              title="Copy visible logs"
            >
              <i className={`bi ${copied ? 'bi-check-lg text-success' : 'bi-clipboard'}`}></i>
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button className="btn btn-outline-danger btn-sm" onClick={onClearLogs} title="Clear terminal">
              <i className="bi bi-trash me-1"></i>
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal View */}
      <div className="card shadow-sm border-0 flex-1 overflow-hidden bg-dark">
        <div className="card-header bg-black text-light py-2 px-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 small">
            <i className="bi bi-terminal-fill text-info"></i>
            <span className="fw-bold">Deskflow Process Terminal</span>
            <span className="badge bg-secondary">{filteredLogs.length} entries</span>
          </div>

          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="autoScrollSwitch"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <label className="form-check-label text-white-50 small" htmlFor="autoScrollSwitch">
              Auto-Scroll
            </label>
          </div>
        </div>

        <div className="card-body p-3 log-terminal">
          {filteredLogs.length === 0 ? (
            <div className="text-secondary text-center py-5">
              <i className="bi bi-terminal fs-1 d-block mb-2"></i>
              No logs recorded yet. Start Deskflow to view live diagnostic messages.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="log-entry">
                <span className="log-time">[{log.timestamp}]</span>
                <span className={`log-level log-level-${log.level}`}>[{log.level}]</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
