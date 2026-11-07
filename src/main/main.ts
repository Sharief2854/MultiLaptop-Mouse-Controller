import { app, BrowserWindow } from 'electron';
import path from 'path';
import { ConfigService } from './services/ConfigService';
import { DeskflowService } from './services/DeskflowService';
import { UpdateService } from './services/UpdateService';
import { registerIpcHandlers } from './ipc/registerIpc';

let mainWindow: BrowserWindow | null = null;
let deskflowService: DeskflowService | null = null;
let configService: ConfigService | null = null;
let updateService: UpdateService | null = null;

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, '../../resources/icon.ico');

  mainWindow = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'MultiLaptop Mouse Controller',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    autoHideMenuBar: true
  });

  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open devtools in development if needed
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  configService = new ConfigService();
  deskflowService = new DeskflowService();
  updateService = new UpdateService();

  registerIpcHandlers(configService, deskflowService, updateService);
  createWindow();

  // If auto-start is configured
  const config = configService.getConfig();
  if (config.autoStartDaemon) {
    setTimeout(() => {
      if (deskflowService) {
        deskflowService.start(config);
      }
    }, 1500);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (deskflowService) {
    await deskflowService.stop();
  }
});
