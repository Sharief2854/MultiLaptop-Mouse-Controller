import { ElectronAPI, AppConfig, DeskflowStatus, ComputerNode, DeskflowLogEntry, SystemInfo, CalculationResult } from '../../shared/types';

// Declare global window.api
declare global {
  interface Window {
    api?: ElectronAPI;
  }
}

// Fallback mock API if rendered in a regular browser during dev
const mockConfig: AppConfig = {
  version: 1,
  role: 'server',
  localScreenName: 'Host-Laptop',
  serverHost: '192.168.1.100',
  serverPort: 24800,
  computers: [
    {
      id: 'comp-1',
      name: 'Host-Laptop',
      ip: '192.168.1.100',
      port: 24800,
      isServer: true,
      x: 220,
      y: 60,
      width: 220,
      height: 130,
      color: '#0d6efd',
      model: 'Host Laptop',
      resolution: { width: 1920, height: 1080 }
    },
    {
      id: 'comp-2',
      name: 'Client-Laptop',
      ip: '192.168.1.150',
      port: 24800,
      isServer: false,
      x: 220,
      y: 250,
      width: 220,
      height: 130,
      color: '#198754',
      model: 'Client Laptop',
      resolution: { width: 1920, height: 1080 }
    }
  ],
  manualLinks: [],
  autoCalculateLinks: true,
  deskflowBinaryPath: '',
  useBundledDeskflow: true,
  clipboardSharing: true,
  relativeMouseMoves: false,
  win32KeepForeground: false,
  switchDelay: 250,
  switchDoubleTap: 0,
  autoStartDaemon: false,
  tlsEnabled: false,
  theme: 'light'
};

const mockStatus: DeskflowStatus = {
  status: 'stopped',
  mode: 'idle',
  pid: null,
  uptimeSeconds: 0,
  port: 24800,
  localAddress: '192.168.1.100',
  binaryPath: 'resources/bin/deskflow/deskflow-core.exe',
  binaryType: 'bundled'
};

export const api: ElectronAPI = window.api || {
  getSystemInfo: async () => ({
    hostname: 'DESKTOP-TEST',
    platform: 'win32',
    arch: 'x64',
    release: '10.0.22631',
    networkInterfaces: [{ name: 'Wi-Fi', address: '192.168.1.100', family: 'IPv4', internal: false }]
  }),
  getConfig: async () => mockConfig,
  saveConfig: async (cfg) => {
    Object.assign(mockConfig, cfg);
    return true;
  },
  resetConfig: async () => mockConfig,
  calculateLinks: async (computers: ComputerNode[]) => {
    // Basic calculation for fallback
    return {
      links: [
        {
          fromScreen: computers[0]?.name || 'Host-Laptop',
          direction: 'down',
          fromRange: [0, 100],
          toScreen: computers[1]?.name || 'Client-Laptop',
          toRange: [0, 100],
          isAutoCalculated: true
        },
        {
          fromScreen: computers[1]?.name || 'Client-Laptop',
          direction: 'up',
          fromRange: [0, 100],
          toScreen: computers[0]?.name || 'Host-Laptop',
          toRange: [0, 100],
          isAutoCalculated: true
        }
      ],
      deskflowLinksSection: 'section: links\n\tHost-Laptop:\n\t\tdown = Client-Laptop\n\tClient-Laptop:\n\t\tup = Host-Laptop\nend'
    };
  },
  getDeskflowStatus: async () => mockStatus,
  startDeskflow: async () => ({ success: true, message: 'Deskflow started (mock mode)' }),
  stopDeskflow: async () => ({ success: true, message: 'Deskflow stopped' }),
  restartDeskflow: async () => ({ success: true, message: 'Deskflow restarted' }),
  getDeskflowLogs: async () => [],
  clearDeskflowLogs: async () => true,
  checkForUpdates: async () => ({ status: 'not-available', version: '1.0.0' }),
  downloadUpdate: async () => true,
  quitAndInstallUpdate: async () => {},
  onDeskflowStatusChange: () => () => {},
  onDeskflowLog: () => () => {},
  onUpdateStatusChange: () => () => {}
};
