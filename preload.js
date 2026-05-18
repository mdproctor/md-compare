'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('compare', {
  selectFile:    ()       => ipcRenderer.invoke('dialog:selectFile'),
  readFile:      (path)   => ipcRenderer.invoke('fs:readFile', path),
  watchFile:     (path)   => ipcRenderer.invoke('fs:watchFile', path),
  unwatchFile:   (path)   => ipcRenderer.invoke('fs:unwatchFile', path),
  onFileChanged: (cb)     => ipcRenderer.on('file:changed', (_event, p) => cb(p)),
  onInitFiles:   (cb)     => ipcRenderer.on('init:files',   (_event, a, b) => cb(a, b)),
});
