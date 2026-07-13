const { app, BrowserWindow, globalShortcut, Menu, shell } = require('electron');
const path = require('node:path');
const { startMediaServer } = require('./media-server.cjs');

let window;
let localOrigin;
const sendTransport = (action) => window?.webContents.send('transport', action);

async function createWindow() {
  const media = await startMediaServer(path.join(__dirname, '..'));
  localOrigin = media.origin;
  window = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#090c11',
    title: 'BlackMamba Music',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.loadURL(`${media.origin}/music`);
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(localOrigin)) { event.preventDefault(); shell.openExternal(url); }
  });
  return window;
}
async function configureUpdates(win){if(!app.isPackaged)return;const report=(status,detail=null)=>win?.webContents.send('update-status',{status,detail});report('checking');try{const response=await fetch('https://updates.blackmambarecords.com/music/latest.json');if(!response.ok)throw new Error(`HTTP ${response.status}`);const manifest=await response.json();report(manifest.version&&manifest.version!==app.getVersion()?'available':'current',manifest.version||app.getVersion());}catch(error){report('offline',error.message);}}

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'BlackMamba Music', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { type: 'separator' }, { role: 'quit' }] },
    { label: 'Playback', submenu: [
      { label: 'Play / Pause', accelerator: 'Space', click: () => sendTransport('toggle') },
      { label: 'Previous', accelerator: 'CmdOrCtrl+Left', click: () => sendTransport('previous') },
      { label: 'Next', accelerator: 'CmdOrCtrl+Right', click: () => sendTransport('next') },
      { label: 'Stop', accelerator: 'CmdOrCtrl+.', click: () => sendTransport('stop') },
    ] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'togglefullscreen' }, { role: 'toggleDevTools' }] },
  ]));
  createWindow().then((win) => {
    if (win) win.webContents.once('did-finish-load', () => configureUpdates(win));
  });
  for (const [key, action] of [['MediaPlayPause','toggle'],['MediaPreviousTrack','previous'],['MediaNextTrack','next'],['MediaStop','stop']]) {
    try { globalShortcut.register(key, () => sendTransport(action)); } catch {}
  }
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
