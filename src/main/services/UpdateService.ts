import { autoUpdater } from 'electron-updater';
import { BrowserWindow, app } from 'electron';
import { UpdateStatus } from '../../shared/types';

export class UpdateService {
  private status: UpdateStatus = {
    status: 'idle'
  };

  constructor() {
    // Configure autoUpdater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // Attach updater events
    autoUpdater.on('checking-for-update', () => {
      this.updateStatus({ status: 'checking', error: undefined });
    });

    autoUpdater.on('update-available', (info) => {
      this.updateStatus({
        status: 'available',
        version: info.version,
        error: undefined
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      this.updateStatus({
        status: 'not-available',
        version: info?.version,
        error: undefined
      });
    });

    autoUpdater.on('error', (err) => {
      // In dev mode or when repo has no releases yet, provide clean message
      const msg = err == null ? 'Unknown error' : (err.message || String(err));
      this.updateStatus({
        status: 'error',
        error: msg.includes('dev-app-update.yml')
          ? 'Auto-update is available in packaged builds with GitHub Releases.'
          : msg
      });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.updateStatus({
        status: 'downloading',
        percent: Math.round(progressObj.percent)
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.updateStatus({
        status: 'downloaded',
        version: info.version
      });
    });
  }

  public getStatus(): UpdateStatus {
    return { ...this.status };
  }

  public async checkForUpdates(): Promise<UpdateStatus> {
    try {
      this.updateStatus({ status: 'checking' });
      if (!app.isPackaged) {
        // In local development, simulate or check gracefully
        await new Promise((r) => setTimeout(r, 800));
        this.updateStatus({
          status: 'not-available',
          error: undefined
        });
        return this.status;
      }
      await autoUpdater.checkForUpdates();
      return this.status;
    } catch (e: any) {
      this.updateStatus({
        status: 'error',
        error: e.message || 'Failed to check for updates'
      });
      return this.status;
    }
  }

  public async downloadUpdate(): Promise<boolean> {
    try {
      this.updateStatus({ status: 'downloading', percent: 0 });
      await autoUpdater.downloadUpdate();
      return true;
    } catch (e: any) {
      this.updateStatus({
        status: 'error',
        error: e.message || 'Failed to download update'
      });
      return false;
    }
  }

  public quitAndInstall() {
    autoUpdater.quitAndInstall();
  }

  private updateStatus(partial: Partial<UpdateStatus>) {
    this.status = { ...this.status, ...partial };
    this.broadcast('updater:status', this.status);
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
}
