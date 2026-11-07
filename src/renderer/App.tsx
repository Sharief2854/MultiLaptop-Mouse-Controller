import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LayoutEditorPage } from './pages/LayoutEditorPage';
import { ComputersPage } from './pages/ComputersPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';
import {
  AppConfig,
  DeskflowStatus,
  DeskflowLogEntry,
  SystemInfo,
  TransitionLink,
  CalculationResult
} from '../shared/types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [status, setStatus] = useState<DeskflowStatus>({
    status: 'stopped',
    mode: 'idle',
    pid: null,
    uptimeSeconds: 0,
    port: 24800,
    localAddress: '127.0.0.1',
    binaryPath: '',
    binaryType: 'bundled'
  });
  const [logs, setLogs] = useState<DeskflowLogEntry[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [activeLinks, setActiveLinks] = useState<TransitionLink[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'danger' | 'info'; text: string } | null>(null);

  const showAlert = (type: 'success' | 'danger' | 'info', text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  // 1. Initial Load
  useEffect(() => {
    async function loadData() {
      try {
        const [loadedConfig, loadedStatus, loadedLogs, loadedSysInfo] = await Promise.all([
          api.getConfig(),
          api.getDeskflowStatus(),
          api.getDeskflowLogs(),
          api.getSystemInfo()
        ]);

        setConfig(loadedConfig);
        setStatus(loadedStatus);
        setLogs(loadedLogs);
        setSystemInfo(loadedSysInfo);

        if (loadedConfig.computers && loadedConfig.computers.length > 0) {
          const calc: CalculationResult = await api.calculateLinks(loadedConfig.computers);
          setActiveLinks(calc.links);
        }
      } catch (e) {
        console.error('Failed to initialize application state:', e);
      }
    }

    loadData();

    // Event listeners
    const unsubscribeStatus = api.onDeskflowStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    const unsubscribeLog = api.onDeskflowLog((newLog) => {
      setLogs((prev) => [...prev.slice(-499), newLog]);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeLog();
    };
  }, []);

  // Recalculate links on computer changes
  const updateLinks = useCallback(async (comps: AppConfig['computers']) => {
    try {
      const calc: CalculationResult = await api.calculateLinks(comps);
      setActiveLinks(calc.links);
    } catch (e) {
      console.error('Link calculation failed:', e);
    }
  }, []);

  const handleUpdateConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    updateLinks(newConfig.computers);
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      const success = await api.saveConfig(config);
      if (success) {
        showAlert('success', 'Configuration saved.');
        // If Deskflow is currently running, automatically restart it so the new layout applies immediately!
        if (status.status === 'running') {
          showAlert('info', 'Restarting Deskflow engine with new layout...');
          await api.restartDeskflow();
        }
      } else {
        showAlert('danger', 'Failed to save configuration file.');
      }
    } catch (e: any) {
      showAlert('danger', `Save error: ${e.message}`);
    }
  };

  const handleResetConfig = async () => {
    try {
      const reset = await api.resetConfig();
      setConfig(reset);
      updateLinks(reset.computers);
      showAlert('success', 'Reset to default configuration.');
    } catch (e: any) {
      showAlert('danger', `Reset error: ${e.message}`);
    }
  };

  const handleStart = async () => {
    if (!config) return;
    try {
      const res = await api.startDeskflow(config.role);
      if (res.success) {
        showAlert('success', res.message);
      } else {
        showAlert('danger', `Error starting Deskflow: ${res.message}`);
      }
    } catch (e: any) {
      showAlert('danger', `Start failed: ${e.message}`);
    }
  };

  const handleStop = async () => {
    try {
      const res = await api.stopDeskflow();
      showAlert('info', res.message);
    } catch (e: any) {
      showAlert('danger', `Stop failed: ${e.message}`);
    }
  };

  const handleRestart = async () => {
    try {
      showAlert('info', 'Restarting Deskflow...');
      const res = await api.restartDeskflow();
      if (res.success) {
        showAlert('success', res.message);
      } else {
        showAlert('danger', `Restart failed: ${res.message}`);
      }
    } catch (e: any) {
      showAlert('danger', `Restart failed: ${e.message}`);
    }
  };

  const handleClearLogs = async () => {
    await api.clearDeskflowLogs();
    setLogs([]);
  };

  if (!config) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span className="fw-semibold">Loading MultiLaptop Mouse Controller...</span>
      </div>
    );
  }

  return (
    <MainLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      status={status}
      config={config}
      onStart={handleStart}
      onStop={handleStop}
      onRestart={handleRestart}
    >
      {alertMessage && (
        <div
          className={`alert alert-${alertMessage.type} alert-dismissible fade show mb-3 shadow-sm py-2 px-3 small`}
          role="alert"
        >
          {alertMessage.text}
          <button
            type="button"
            className="btn-close py-2"
            onClick={() => setAlertMessage(null)}
          ></button>
        </div>
      )}

      {currentTab === 'dashboard' && (
        <DashboardPage
          status={status}
          config={config}
          systemInfo={systemInfo}
          activeLinks={activeLinks}
          onStart={handleStart}
          onStop={handleStop}
          onRestart={handleRestart}
          onNavigate={setCurrentTab}
        />
      )}

      {currentTab === 'layout' && (
        <LayoutEditorPage
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onSave={handleSaveConfig}
        />
      )}

      {currentTab === 'computers' && (
        <ComputersPage
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onSave={handleSaveConfig}
        />
      )}

      {currentTab === 'logs' && (
        <LogsPage
          logs={logs}
          status={status}
          onClearLogs={handleClearLogs}
        />
      )}

      {currentTab === 'settings' && (
        <SettingsPage
          config={config}
          systemInfo={systemInfo}
          status={status}
          onUpdateConfig={handleUpdateConfig}
          onSave={handleSaveConfig}
          onReset={handleResetConfig}
        />
      )}
    </MainLayout>
  );
};
