import { ipcMain } from 'electron';
import { ConfigService } from '../services/ConfigService';
import { DeskflowService } from '../services/DeskflowService';
import { NetworkService } from '../services/NetworkService';
import { LayoutGeometryService } from '../services/LayoutGeometryService';
import { UpdateService } from '../services/UpdateService';
import { AppConfig, ComputerNode } from '../../shared/types';

export function registerIpcHandlers(
  configService: ConfigService,
  deskflowService: DeskflowService,
  updateService: UpdateService
) {
  // 1. System Info
  ipcMain.handle('app:getSystemInfo', async () => {
    return NetworkService.getSystemInfo();
  });

  // 2. Configuration Persistence
  ipcMain.handle('config:get', async () => {
    return configService.getConfig();
  });

  ipcMain.handle('config:save', async (_, newConfig: AppConfig) => {
    return configService.saveConfig(newConfig);
  });

  ipcMain.handle('config:reset', async () => {
    return configService.resetConfig();
  });

  // 3. Layout Geometry Calculation
  ipcMain.handle('layout:calculateLinks', async (_, computers: ComputerNode[]) => {
    return LayoutGeometryService.calculateLinks(computers);
  });

  // 4. Deskflow Process Management
  ipcMain.handle('deskflow:getStatus', async () => {
    return deskflowService.getStatus();
  });

  ipcMain.handle('deskflow:start', async (_, overrideRole?: 'server' | 'client') => {
    const config = configService.getConfig();
    return deskflowService.start(config, overrideRole);
  });

  ipcMain.handle('deskflow:stop', async () => {
    return deskflowService.stop();
  });

  ipcMain.handle('deskflow:restart', async () => {
    const config = configService.getConfig();
    return deskflowService.restart(config);
  });

  ipcMain.handle('deskflow:getLogs', async () => {
    return deskflowService.getLogs();
  });

  ipcMain.handle('deskflow:clearLogs', async () => {
    return deskflowService.clearLogs();
  });

  // 5. Electron Auto-Updater
  ipcMain.handle('updater:check', async () => {
    return updateService.checkForUpdates();
  });

  ipcMain.handle('updater:download', async () => {
    return updateService.downloadUpdate();
  });

  ipcMain.handle('updater:install', async () => {
    updateService.quitAndInstall();
  });
}
