import { contextBridge, ipcRenderer } from 'electron';
import {
  ElectronAPI,
  AppConfig,
  ComputerNode,
  DeskflowStatus,
  DeskflowLogEntry
} from '../shared/types';

const api: ElectronAPI = {
  // System Info
  getSystemInfo: () => ipcRenderer.invoke('app:getSystemInfo'),

  // Config
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config: AppConfig) => ipcRenderer.invoke('config:save', config),
  resetConfig: () => ipcRenderer.invoke('config:reset'),

  // Layout calculation
  calculateLinks: (computers: ComputerNode[]) => ipcRenderer.invoke('layout:calculateLinks', computers),

  // Deskflow Process Control
  getDeskflowStatus: () => ipcRenderer.invoke('deskflow:getStatus'),
  startDeskflow: (role?: 'server' | 'client') => ipcRenderer.invoke('deskflow:start', role),
  stopDeskflow: () => ipcRenderer.invoke('deskflow:stop'),
  restartDeskflow: () => ipcRenderer.invoke('deskflow:restart'),
  getDeskflowLogs: () => ipcRenderer.invoke('deskflow:getLogs'),
  clearDeskflowLogs: () => ipcRenderer.invoke('deskflow:clearLogs'),

  // Auto-Updater
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  quitAndInstallUpdate: () => ipcRenderer.invoke('updater:install'),

  // Event Listeners
  onDeskflowStatusChange: (callback: (status: DeskflowStatus) => void) => {
    const handler = (_event: any, status: DeskflowStatus) => callback(status);
    ipcRenderer.on('deskflow:status', handler);
    return () => ipcRenderer.removeListener('deskflow:status', handler);
  },

  onDeskflowLog: (callback: (log: DeskflowLogEntry) => void) => {
    const handler = (_event: any, log: DeskflowLogEntry) => callback(log);
    ipcRenderer.on('deskflow:log', handler);
    return () => ipcRenderer.removeListener('deskflow:log', handler);
  },

  onUpdateStatusChange: (callback: (status: any) => void) => {
    const handler = (_event: any, status: any) => callback(status);
    ipcRenderer.on('updater:status', handler);
    return () => ipcRenderer.removeListener('updater:status', handler);
  }
};

contextBridge.exposeInMainWorld('api', api);
