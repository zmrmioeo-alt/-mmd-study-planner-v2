const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('node:path');
let portalWindow = null;
const PORTAL_URL = 'https://hemmatsch.ir/';

function createPortalWindow(){
  if(portalWindow && !portalWindow.isDestroyed()){
    portalWindow.show();
    portalWindow.focus();
    return portalWindow;
  }
  portalWindow = new BrowserWindow({
    width: 1120,
    height: 820,
    minWidth: 760,
    minHeight: 600,
    title: 'هم‌کلاسی | ورود امن',
    autoHideMenuBar: true,
    webPreferences: {
      partition: 'persist:mmd-hamkelasi',
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  portalWindow.webContents.setWindowOpenHandler(({url}) => {
    if(/^https:\/\//i.test(url)) portalWindow.loadURL(url);
    return { action: 'deny' };
  });
  portalWindow.on('closed',()=>{ portalWindow=null; });
  portalWindow.loadURL(PORTAL_URL);
  return portalWindow;
}

ipcMain.handle('mmd:hamkelasi:open',()=>{
  createPortalWindow();
  return {opened:true};
});

ipcMain.handle('mmd:hamkelasi:analyze',async()=>{
  if(!portalWindow || portalWindow.isDestroyed()) throw new Error('ابتدا پنجرهٔ هم‌کلاسی را باز کن و وارد حساب شو.');
  const snapshot = await portalWindow.webContents.executeJavaScript(`(() => {
    const collect = (root) => {
      const trs = Array.from(root.querySelectorAll('tr'));
      if (trs.length) {
        const matrix = trs.map(tr => Array.from(tr.querySelectorAll(':scope > th, :scope > td')).map(c => (c.innerText || c.textContent || '').trim()));
        if (!matrix.length) return [];
        const headers = matrix[0] || [];
        return matrix.slice(1).map(cells => Object.fromEntries(cells.map((v,i) => [headers[i] || ('ستون ' + (i+1)), v]).filter(([,v]) => v)));
      }
      const roleRows = Array.from(root.querySelectorAll('[role="row"]'));
      if (!roleRows.length) return [];
      const matrix = roleRows.map(row => Array.from(row.querySelectorAll('[role="columnheader"],[role="gridcell"],[role="cell"]')).map(c => (c.innerText || c.textContent || '').trim()));
      const headers = matrix[0] || [];
      return matrix.slice(1).map(cells => Object.fromEntries(cells.map((v,i) => [headers[i] || ('ستون ' + (i+1)), v])).filter(([,v]) => v));
    };
    const roots = Array.from(document.querySelectorAll('table,[role="table"],[role="grid"]'));
    const tables = roots.map(root => ({ rows: collect(root) })).filter(t => t.rows.length);
    return { url: location.href, title: document.title, tables };
  })()`);
  if(!snapshot.tables.length) throw new Error('در صفحهٔ فعلی جدول تکلیف یا آزمون پیدا نشد. وارد حساب شو و صفحهٔ فهرست تکالیف یا آزمون‌ها را باز کن.');
  return snapshot;
});

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
      preload: path.join(__dirname,'preload.cjs'),
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
