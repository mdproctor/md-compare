// preload.js
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('compare', {
  selectFile:   () => ipcRenderer.invoke('dialog:selectFile'),
  onInitConfig: (cb) => ipcRenderer.on('init:config', (_event, cfg) => cb(cfg)),
  onInitFiles:  (cb) => ipcRenderer.on('init:files',  (_event, a, b) => cb(a, b)),
});
