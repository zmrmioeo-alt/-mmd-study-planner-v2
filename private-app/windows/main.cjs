const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
function createWindow(){
  const win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 760,
    minHeight: 620,
    backgroundColor: '#081321',
    title: 'MMD Personal',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.webContents.setWindowOpenHandler(({url}) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.loadFile(path.join(__dirname,'app','index.html'));
}
app.whenReady().then(()=>{
  createWindow();
  app.on('activate',()=>{ if(BrowserWindow.getAllWindows().length===0) createWindow(); });
});
app.on('window-all-closed',()=>{ if(process.platform!=='darwin') app.quit(); });
