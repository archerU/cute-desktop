const { autoUpdater } = require('electron-updater');
const { app, BrowserWindow, ipcMain } = require('electron');

class Updater {
  constructor(startApp) {
    this.startApp = startApp;
  }

  run() {
    this.updateState = {};

    this.bindListeners();

    autoUpdater.checkForUpdates().catch(() => {
      this.startApp();
      this.finished = true;
      if (this.browserWindow) this.browserWindow.close();
    });
  }

  bindListeners() {
    autoUpdater.on('update-available', info => {
      console.log('Updater: Update available', info);
      this.browserWindow = this.initWindow();
      this.updateState.version = info.version;
      this.updateState.percent = 0;
      this.pushState();
    });

    autoUpdater.on('update-not-available', () => {
      console.log('Updater: Update not found');
      this.startApp();
      this.finished = true;
      if (this.browserWindow) this.browserWindow.close();
    });

    autoUpdater.on('download-progress', progress => {
      console.log('Updater: Download progress', progress);
      this.updateState.percent = progress.percent;

      if (progress.percent === 100) {
        this.updateState.installing = true;
      }

      this.pushState();
    });

    autoUpdater.on('update-downloaded', () => {
      console.log('Updater: Update successfully downloaded');
      this.updateState.installing = true;
      this.pushState();
      autoUpdater.quitAndInstall();
    });

    autoUpdater.on('error', error => {
      console.log('Updater: Error', error);
      this.updateState.error = true;
      this.pushState();
    });

    ipcMain.on('autoUpdate-getState', () => {
      this.pushState();
    });
  }

  initWindow() {
    const browserWindow = new BrowserWindow({
      width: 400,
      height: 180,
      frame: false,
      resizable: false,
      show: false,
      webPreferences: { 
        nodeIntegration: true,
        contextIsolation: false
      },
    });

    browserWindow.on('ready-to-show', () => {
      browserWindow.show();
    });

    browserWindow.on('closed', () => {
      if (!this.finished) app.quit();
    });

    browserWindow.loadURL('file://' + __dirname + '/index.html');

    return browserWindow;
  }

  pushState() {
    if (this.browserWindow && !this.browserWindow.isDestroyed()) {
      this.browserWindow.webContents.send('autoUpdate-pushState', this.updateState);
    }
  }
}

exports.Updater = Updater;
