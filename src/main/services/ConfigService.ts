import fs from 'fs';
import path from 'path';
import os from 'os';
import { app } from 'electron';
import { AppConfig, ComputerNode } from '../../shared/types';
import { NetworkService } from './NetworkService';

export class ConfigService {
  private configPath: string;
  private currentConfig: AppConfig;

  constructor() {
    const userDataPath = app?.getPath ? app.getPath('userData') : path.join(os.homedir(), '.multilaptop-mouse-controller');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    this.configPath = path.join(userDataPath, 'config.json');
    this.currentConfig = this.loadConfig();
  }

  public getConfig(): AppConfig {
    return { ...this.currentConfig };
  }

  public saveConfig(config: AppConfig): boolean {
    try {
      this.currentConfig = { ...config, version: 1 };
      fs.writeFileSync(this.configPath, JSON.stringify(this.currentConfig, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      return false;
    }
  }

  public resetConfig(): AppConfig {
    this.currentConfig = this.getDefaultConfig();
    this.saveConfig(this.currentConfig);
    return this.getConfig();
  }

  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return this.mergeWithDefaults(parsed);
      }
    } catch (e) {
      console.warn('Could not read config file, generating default config:', e);
    }
    const def = this.getDefaultConfig();
    this.saveConfig(def);
    return def;
  }

  private getDefaultConfig(): AppConfig {
    const primaryIp = NetworkService.getPrimaryIp();

    // Default: Host Laptop (Top) and Client Laptop (Bottom)
    // Physical arrangement: Host Laptop positioned above Client Laptop
    const defaultComputers: ComputerNode[] = [
      {
        id: 'comp-host',
        name: 'Host-Laptop',
        ip: primaryIp,
        port: 24800,
        isServer: true,
        x: 200,
        y: 60,
        width: 220,
        height: 130,
        color: '#0d6efd',
        model: 'Host Laptop (Primary)',
        resolution: { width: 1920, height: 1080 }
      },
      {
        id: 'comp-client-1',
        name: 'Client-Laptop',
        ip: '192.168.1.150',
        port: 24800,
        isServer: false,
        x: 200,
        y: 240,
        width: 220,
        height: 130,
        color: '#198754',
        model: 'Client Laptop (Secondary)',
        resolution: { width: 1920, height: 1080 }
      }
    ];

    return {
      version: 1,
      role: 'server',
      localScreenName: 'Host-Laptop',
      serverHost: primaryIp,
      serverPort: 24800,
      computers: defaultComputers,
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
  }

  private mergeWithDefaults(loaded: Partial<AppConfig>): AppConfig {
    const def = this.getDefaultConfig();
    return {
      ...def,
      ...loaded,
      computers: loaded.computers && loaded.computers.length > 0 ? loaded.computers : def.computers
    };
  }
}
