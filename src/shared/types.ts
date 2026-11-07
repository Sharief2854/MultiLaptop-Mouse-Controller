/**
 * MultiLaptop Mouse Controller - Shared TypeScript Definitions
 */

export type ScreenDirection = 'left' | 'right' | 'up' | 'down';

export type DeskflowMode = 'server' | 'client' | 'idle';

export type DaemonStatus = 'stopped' | 'starting' | 'running' | 'error';

export interface ComputerNode {
  id: string;
  name: string; // Deskflow screen name / hostname (case-sensitive)
  ip: string;
  port: number;
  isServer: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  model?: string;
  resolution?: {
    width: number;
    height: number;
  };
}

export interface TransitionLink {
  fromScreen: string;
  direction: ScreenDirection;
  fromRange: [number, number]; // Percentage (0-100)
  toScreen: string;
  toRange: [number, number];   // Percentage (0-100)
  isAutoCalculated: boolean;
}

export interface LayoutPresetConfig {
  preset: 'horizontal' | 'vertical' | 'grid' | 'custom';
}

export interface DeskflowLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL' | 'DEBUG';
  message: string;
}

export interface DeskflowStatus {
  status: DaemonStatus;
  mode: DeskflowMode;
  pid: number | null;
  uptimeSeconds: number;
  port: number;
  localAddress: string;
  binaryPath: string;
  binaryType: 'bundled' | 'system' | 'custom';
  error?: string;
}

export interface AppConfig {
  version: number;
  role: 'server' | 'client';
  localScreenName: string;
  serverHost: string; // Client mode: IP of the server
  serverPort: number;
  computers: ComputerNode[];
  manualLinks: TransitionLink[];
  autoCalculateLinks: boolean;
  deskflowBinaryPath: string;
  useBundledDeskflow: boolean;
  clipboardSharing: boolean;
  relativeMouseMoves: boolean;
  win32KeepForeground: boolean;
  switchDelay: number;
  switchDoubleTap: number;
  autoStartDaemon: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface NetworkInterfaceInfo {
  name: string;
  address: string;
  family: string;
  internal: boolean;
}

export interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  release: string;
  networkInterfaces: NetworkInterfaceInfo[];
}

export interface CalculationResult {
  links: TransitionLink[];
  deskflowLinksSection: string;
}

export interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  percent?: number;
  error?: string;
}

export interface ElectronAPI {
  // System Info
  getSystemInfo: () => Promise<SystemInfo>;

  // Configuration
  getConfig: () => Promise<AppConfig>;
  saveConfig: (config: AppConfig) => Promise<boolean>;
  resetConfig: () => Promise<AppConfig>;

  // Layout calculation
  calculateLinks: (computers: ComputerNode[]) => Promise<CalculationResult>;

  // Deskflow Process Control
  getDeskflowStatus: () => Promise<DeskflowStatus>;
  startDeskflow: (role?: 'server' | 'client') => Promise<{ success: boolean; message: string }>;
  stopDeskflow: () => Promise<{ success: boolean; message: string }>;
  restartDeskflow: () => Promise<{ success: boolean; message: string }>;
  getDeskflowLogs: () => Promise<DeskflowLogEntry[]>;
  clearDeskflowLogs: () => Promise<boolean>;

  // Auto Updater
  checkForUpdates: () => Promise<UpdateStatus>;
  downloadUpdate: () => Promise<boolean>;
  quitAndInstallUpdate: () => Promise<void>;

  // Event Listeners
  onDeskflowStatusChange: (callback: (status: DeskflowStatus) => void) => () => void;
  onDeskflowLog: (callback: (log: DeskflowLogEntry) => void) => () => void;
  onUpdateStatusChange: (callback: (status: UpdateStatus) => void) => () => void;
}
