import { app, BrowserWindow, ipcMain, screen, Menu, shell, dialog } from 'electron';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { WebRTCReceiver } from './webrtc-receiver';

const __dirname = join(fileURLToPath(import.meta.url), '..');

let mainWindow: BrowserWindow | null = null;
let webrtcReceiver: WebRTCReceiver | null = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: Math.min(1280, width),
    height: Math.min(720, height),
    minWidth: 800,
    minHeight: 600,
    title: 'PhoneCam - Desktop Receiver',
    icon: join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
    backgroundColor: '#000000',
  });

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    webrtcReceiver?.stop();
  });

  // Create menu
  createMenu();
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'PhoneCam',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'GitHub Repository',
          click: () => shell.openExternal('https://github.com/yourusername/phone-cam'),
        },
        {
          label: 'Signaling Server Setup',
          click: () => shell.openExternal('https://github.com/yourusername/phone-cam/tree/main/packages/signaling-server'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

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

// IPC Handlers
ipcMain.handle('webrtc:start', async (_event, config: { roomId: string; signalingHost?: string }) => {
  if (webrtcReceiver) {
    await webrtcReceiver.stop();
  }
  
  webrtcReceiver = new WebRTCReceiver(config);
  
  webrtcReceiver.onConnectionStateChange = (state) => {
    mainWindow?.webContents.send('webrtc:state-change', state);
  };
  
  webrtcReceiver.onRemoteStream = (stream) => {
    // Stream is handled via video element in renderer
    mainWindow?.webContents.send('webrtc:stream', stream.id);
  };
  
  webrtcReceiver.onError = (error) => {
    mainWindow?.webContents.send('webrtc:error', error.message);
  };

  try {
    await webrtcReceiver.start();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('webrtc:stop', async () => {
  await webrtcReceiver?.stop();
  webrtcReceiver = null;
  return { success: true };
});

ipcMain.handle('webrtc:get-state', () => {
  return webrtcReceiver?.getState() || 'disconnected';
});

ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('app:open-external', (_event, url: string) => {
  shell.openExternal(url);
});

ipcMain.handle('dialog:show-error', (_event, title: string, message: string) => {
  dialog.showErrorBox(title, message);
});