const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mmdDesktop', {
  openHamkelasi: () => ipcRenderer.invoke('mmd:hamkelasi:open'),
  analyzeHamkelasi: () => ipcRenderer.invoke('mmd:hamkelasi:analyze')
});
