import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow } from 'electron';
import {
  DeskflowStatus,
  DeskflowLogEntry,
  AppConfig,
  DeskflowMode,
  CalculationResult
} from '../../shared/types';
import { LayoutGeometryService } from './LayoutGeometryService';

export class DeskflowService {
  private currentProcess: ChildProcessWithoutNullStreams | null = null;
  private status: DeskflowStatus = {
    status: 'stopped',
    mode: 'idle',
    pid: null,
    uptimeSeconds: 0,
    port: 24800,
    localAddress: '0.0.0.0',
    binaryPath: '',
    binaryType: 'bundled'
  };

  private logs: DeskflowLogEntry[] = [];
  private uptimeTimer: NodeJS.Timeout | null = null;
  private runtimeDir: string;

  constructor() {
    const userData = app?.getPath ? app.getPath('userData') : process.cwd();
    this.runtimeDir = path.join(userData, 'deskflow_runtime');
    if (!fs.existsSync(this.runtimeDir)) {
      fs.mkdirSync(this.runtimeDir, { recursive: true });
    }
  }

  public getStatus(): DeskflowStatus {
    return { ...this.status };
  }

  public getLogs(): DeskflowLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): boolean {
    this.logs = [];
    return true;
  }

  /**
   * Resolve the path to deskflow-core.exe
   */
  public resolveBinaryPath(config: AppConfig): { path: string; type: 'bundled' | 'system' | 'custom' } {
    // 1. Check custom user path if configured
    if (config.deskflowBinaryPath && fs.existsSync(config.deskflowBinaryPath)) {
      return { path: config.deskflowBinaryPath, type: 'custom' };
    }

    // 2. Check bundled binary in resources
    const isPackaged = app?.isPackaged ?? false;
    const bundledPath = isPackaged
      ? path.join(process.resourcesPath, 'bin', 'deskflow', 'deskflow-core.exe')
      : path.join(process.cwd(), 'resources', 'bin', 'deskflow', 'deskflow-core.exe');

    if (fs.existsSync(bundledPath)) {
      return { path: bundledPath, type: 'bundled' };
    }

    // 3. Check system standard install paths
    const systemPaths = [
      'C:\\Program Files\\Deskflow\\deskflow-core.exe',
      'C:\\Program Files (x86)\\Deskflow\\deskflow-core.exe',
      'C:\\Program Files\\Barrier\\barrier.exe',
      'C:\\Program Files\\Synergy\\synergy.exe'
    ];

    for (const sysPath of systemPaths) {
      if (fs.existsSync(sysPath)) {
        return { path: sysPath, type: 'system' };
      }
    }

    // Fallback: bundled path
    return { path: bundledPath, type: 'bundled' };
  }

  /**
   * Start Deskflow in Server or Client mode
   */
  public async start(config: AppConfig, overrideRole?: 'server' | 'client'): Promise<{ success: boolean; message: string }> {
    if (this.currentProcess) {
      await this.stop();
    }

    const binaryInfo = this.resolveBinaryPath(config);
    if (!fs.existsSync(binaryInfo.path)) {
      const err = `Deskflow core binary not found at: ${binaryInfo.path}`;
      this.updateStatus({
        status: 'error',
        mode: 'idle',
        pid: null,
        error: err,
        binaryPath: binaryInfo.path,
        binaryType: binaryInfo.type
      });
      this.addLog('ERROR', err);
      return { success: false, message: err };
    }

    const role = overrideRole || config.role || 'server';
    const port = config.serverPort || 24800;

    this.updateStatus({
      status: 'starting',
      mode: role,
      pid: null,
      port,
      binaryPath: binaryInfo.path,
      binaryType: binaryInfo.type,
      error: undefined
    });

    try {
      let configIniPath: string;
      const args: string[] = [role];

      if (role === 'server') {
        configIniPath = this.generateServerConfig(config);
      } else {
        configIniPath = this.generateClientConfig(config);
      }

      args.push('-s', configIniPath);
      args.push('--new-instance');

      this.addLog('INFO', `Starting Deskflow in ${role.toUpperCase()} mode...`);
      this.addLog('INFO', `Binary: ${binaryInfo.path}`);
      this.addLog('INFO', `Configuration: ${configIniPath}`);

      const child = spawn(binaryInfo.path, args, {
        cwd: path.dirname(binaryInfo.path),
        windowsHide: true
      });

      this.currentProcess = child;
      const pid = child.pid || null;

      this.updateStatus({
        status: 'running',
        mode: role,
        pid,
        uptimeSeconds: 0,
        port,
        binaryPath: binaryInfo.path,
        binaryType: binaryInfo.type
      });

      this.startUptimeCounter();

      child.stdout.on('data', (data: Buffer) => {
        this.handleProcessOutput(data.toString());
      });

      child.stderr.on('data', (data: Buffer) => {
        this.handleProcessOutput(data.toString());
      });

      child.on('error', (err) => {
        this.addLog('ERROR', `Process error: ${err.message}`);
        this.updateStatus({
          status: 'error',
          mode: 'idle',
          pid: null,
          error: err.message
        });
        this.stopUptimeCounter();
        this.currentProcess = null;
      });

      child.on('close', (code, signal) => {
        this.addLog('INFO', `Deskflow process exited with code ${code ?? signal}`);
        this.stopUptimeCounter();
        this.currentProcess = null;
        if (this.status.status !== 'error') {
          this.updateStatus({
            status: 'stopped',
            mode: 'idle',
            pid: null,
            uptimeSeconds: 0
          });
        }
      });

      return { success: true, message: `Deskflow ${role} started successfully (PID: ${pid})` };
    } catch (error: any) {
      const msg = error?.message || String(error);
      this.addLog('FATAL', `Failed to start Deskflow: ${msg}`);
      this.updateStatus({
        status: 'error',
        mode: 'idle',
        pid: null,
        error: msg
      });
      return { success: false, message: msg };
    }
  }

  /**
   * Stop the running Deskflow process
   */
  public async stop(): Promise<{ success: boolean; message: string }> {
    this.stopUptimeCounter();

    if (!this.currentProcess) {
      this.updateStatus({
        status: 'stopped',
        mode: 'idle',
        pid: null,
        uptimeSeconds: 0
      });
      return { success: true, message: 'Deskflow is not running' };
    }

    try {
      this.addLog('INFO', `Stopping Deskflow (PID: ${this.currentProcess.pid})...`);
      const pid = this.currentProcess.pid;
      this.currentProcess.kill('SIGTERM');

      // On Windows, give 1.5 seconds then force kill if still running
      if (pid) {
        setTimeout(() => {
          try {
            process.kill(pid, 0); // check if alive
            spawn('taskkill', ['/pid', pid.toString(), '/f', '/t']);
          } catch {
            // Already dead
          }
        }, 1500);
      }

      this.currentProcess = null;
      this.updateStatus({
        status: 'stopped',
        mode: 'idle',
        pid: null,
        uptimeSeconds: 0
      });
      return { success: true, message: 'Deskflow stopped' };
    } catch (e: any) {
      this.addLog('WARNING', `Error stopping Deskflow: ${e.message}`);
      return { success: false, message: e.message };
    }
  }

  public async restart(config: AppConfig): Promise<{ success: boolean; message: string }> {
    await this.stop();
    await new Promise((resolve) => setTimeout(resolve, 500));
    return this.start(config);
  }

  /**
   * Generates the server INI file and external server.conf layout file
   */
  private generateServerConfig(config: AppConfig): string {
    const serverConfPath = path.join(this.runtimeDir, 'server.conf');
    const iniPath = path.join(this.runtimeDir, 'Deskflow_server.ini');

    // 1. Calculate links
    let calcResult: CalculationResult;
    if (config.autoCalculateLinks) {
      calcResult = LayoutGeometryService.calculateLinks(config.computers);
    } else {
      calcResult = {
        links: config.manualLinks,
        deskflowLinksSection: LayoutGeometryService.generateLinksText(config.computers, config.manualLinks)
      };
    }

    // 2. Build server.conf
    const serverConfLines: string[] = [
      '# Generated by MultiLaptop Mouse Controller',
      calcResult.deskflowLinksSection,
      '',
      'section: options',
      `\trelativeMouseMoves = ${config.relativeMouseMoves ? 'true' : 'false'}`,
      `\twin32KeepForeground = ${config.win32KeepForeground ? 'true' : 'false'}`,
      `\tclipboardSharing = ${config.clipboardSharing ? 'true' : 'false'}`,
      `\tswitchDelay = ${config.switchDelay || 250}`,
      `\tswitchDoubleTap = ${config.switchDoubleTap || 0}`,
      'end',
      ''
    ];
    fs.writeFileSync(serverConfPath, serverConfLines.join('\n'), 'utf-8');

    // 3. Build Deskflow_server.ini
    // Normalize path with forward slashes for Deskflow config parser
    const normalizedServerConfPath = serverConfPath.replace(/\\/g, '/');

    const iniLines: string[] = [
      '[core]',
      'coreMode=2',
      `computerName=${config.localScreenName}`,
      `port=${config.serverPort || 24800}`,
      '',
      '[server]',
      'externalConfig=true',
      `externalConfigFile=${normalizedServerConfPath}`,
      `enableClipboard=${config.clipboardSharing ? 'true' : 'false'}`,
      `switchDelay=${config.switchDelay || 250}`,
      `relativeMouseMoves=${config.relativeMouseMoves ? 'true' : 'false'}`,
      `win32KeepForeground=${config.win32KeepForeground ? 'true' : 'false'}`
    ];

    // Screen declarations in general config
    for (const comp of config.computers) {
      iniLines.push('');
      iniLines.push(`[computer_${comp.name}]`);
      iniLines.push(`name=${comp.name}`);
    }

    fs.writeFileSync(iniPath, iniLines.join('\n'), 'utf-8');
    return iniPath;
  }

  /**
   * Generates client mode INI configuration
   */
  private generateClientConfig(config: AppConfig): string {
    const iniPath = path.join(this.runtimeDir, 'Deskflow_client.ini');

    const iniLines: string[] = [
      '[core]',
      'coreMode=1',
      `computerName=${config.localScreenName}`,
      `port=${config.serverPort || 24800}`,
      '',
      '[client]',
      `remoteHost=${config.serverHost || '127.0.0.1'}`
    ];

    fs.writeFileSync(iniPath, iniLines.join('\n'), 'utf-8');
    return iniPath;
  }

  private handleProcessOutput(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    for (const line of lines) {
      let level: DeskflowLogEntry['level'] = 'INFO';
      if (/FATAL/i.test(line)) level = 'FATAL';
      else if (/ERROR/i.test(line)) level = 'ERROR';
      else if (/WARNING/i.test(line)) level = 'WARNING';
      else if (/DEBUG/i.test(line)) level = 'DEBUG';

      this.addLog(level, line);
    }
  }

  private addLog(level: DeskflowLogEntry['level'], message: string) {
    const entry: DeskflowLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    this.logs.push(entry);
    if (this.logs.length > 500) {
      this.logs.shift();
    }
    this.broadcast('deskflow:log', entry);
  }

  private updateStatus(partial: Partial<DeskflowStatus>) {
    this.status = { ...this.status, ...partial };
    this.broadcast('deskflow:status', this.status);
  }

  private broadcast(channel: string, data: any) {
    if (!BrowserWindow || typeof BrowserWindow.getAllWindows !== 'function') {
      return;
    }
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    }
  }

  private startUptimeCounter() {
    this.stopUptimeCounter();
    this.uptimeTimer = setInterval(() => {
      if (this.status.status === 'running') {
        this.status.uptimeSeconds += 1;
        this.broadcast('deskflow:status', this.status);
      }
    }, 1000);
  }

  private stopUptimeCounter() {
    if (this.uptimeTimer) {
      clearInterval(this.uptimeTimer);
      this.uptimeTimer = null;
    }
  }
}
