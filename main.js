'use strict';
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');

let mainWindow = null;
const watchers  = new Map();
const debouncers = new Map();

// Extra CLI args: electron <app> [fileA] [fileB]
// argv[0]=electron, argv[1]=app-path, argv[2..]=user args
const initFiles = process.argv.slice(2).filter(a => !a.startsWith('--'));

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile('index.html');
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (initFiles.length > 0) {
      mainWindow.webContents.send('init:files', initFiles[0] || null, initFiles[1] || null);
    }
  });

  // Prevent accidental file-drop navigation at the window level
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://') || !url.includes('index.html')) {
      event.preventDefault();
    }
  });
}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  for (const w of watchers.values()) { try { w.close(); } catch(_) {} }
});

ipcMain.handle('dialog:selectFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown / Text', extensions: ['md', 'markdown', 'txt'] }],
  });
  return canceled ? null : filePaths[0];
});

ipcMain.handle('fs:readFile', async (_event, filePath) => {
  return fs.readFileSync(filePath, 'utf8');
});

ipcMain.handle('fs:watchFile', (_event, filePath) => {
  if (watchers.has(filePath)) {
    try { watchers.get(filePath).close(); } catch(_) {}
  }
  const watcher = fs.watch(filePath, () => {
    // Debounce rapid successive events (common on macOS)
    clearTimeout(debouncers.get(filePath));
    debouncers.set(filePath, setTimeout(() => {
      mainWindow?.webContents.send('file:changed', filePath);
    }, 120));
  });
  watchers.set(filePath, watcher);
});

ipcMain.handle('fs:unwatchFile', (_event, filePath) => {
  if (watchers.has(filePath)) {
    try { watchers.get(filePath).close(); } catch(_) {}
    watchers.delete(filePath);
    clearTimeout(debouncers.get(filePath));
    debouncers.delete(filePath);
  }
});
