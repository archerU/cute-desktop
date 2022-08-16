

////////////////////////////////////////////////////////////////////////////////
// Set Up Environment Variables
////////////////////////////////////////////////////////////////////////////////
const pjson = require('./package.json');
if (pjson.env === 'production') {
  process.env.NODE_ENV = 'production';
}

process.env.VERSION = pjson.version;

////////////////////////////////////////////////////////////////////////////////
//  Modules and other Requires
////////////////////////////////////////////////////////////////////////////////
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu
} = require('electron');
const electron = require('electron');
const path = require('path');
const semver = require('semver');

// app.setPath('userData', path.join(app.getPath('appData'), 'wmsn-client'));

// This ensures that only one copy of our app can run at once.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  return;
}

// electron.app.setAsDefaultProtocolClient('ali://');

const bootstrap = require('./updater/build/bootstrap.js');
// const { Updater } = require('./updater/mac/Updater.js');

const releaseChannel = (() => {
  const components = semver.prerelease(pjson.version);

  if (components) return components[0];
  return 'latest';
})();


app.on('ready', ()=> {
  if (process.platform === 'darwin') {
    try {
      fs.accessSync(app.getPath('exe'), fs.constants.W_OK);
    } catch (e) {
      if (e.code === 'EROFS') {
        dialog.showErrorBox(
          '视频龙 程序',
          '请从应用程序文件夹运行视频龙 程序。视频龙 程序无法直接从此磁盘映像运行',
        );
        app.exit();
      }
    }
  }
  if (!process.argv.includes('--network-logging')) return;
});

////////////////////////////////////////////////////////////////////////////////
// Main Program
////////////////////////////////////////////////////////////////////////////////

// windows
let mainWindow;
let shutdownStarted = false;

const os = require('os');
const cpus = os.cpus();

function humanFileSize(bytes, si) {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
}

app.setPath('userData', path.join(app.getPath('appData'), 'cute-desktop'));
const fs = require('fs');
const util = require('util');
const logFile = path.join(app.getPath('userData'), 'app.log');
const maxLogBytes = 131072;
if (fs.existsSync(logFile) && fs.statSync(logFile).size > maxLogBytes) {
  const content = fs.readFileSync(logFile);
  fs.writeFileSync(logFile, '[LOG TRUNCATED]\n');
  fs.writeFileSync(logFile, content.slice(content.length - maxLogBytes), { flag: 'a' });
}

ipcMain.on('logmsg', (e, msg) => {
  if (msg.level === 'error' && mainWindow && process.env.NODE_ENV !== 'production') {
    mainWindow.send('unhandledErrorState');
  }

  logFromRemote(msg.level, msg.sender, msg.message);
});

const lineBuffer = [];

function writeLogLine(line) {
  // Also print to stdout
  consoleLog(line);

  lineBuffer.push(`${line}\n`);
  flushNextLine();
}

let writeInProgress = false;
function flushNextLine() {
  if (lineBuffer.length === 0) return;
  if (writeInProgress) return;

  const nextLine = lineBuffer.shift();

  writeInProgress = true;

  fs.writeFile(logFile, nextLine, { flag: 'a' }, e => {
    writeInProgress = false;

    if (e) {
      consoleLog('Error writing to log file', e);
      return;
    }

    flushNextLine();
  });
}

function logFromRemote(level, sender, msg) {
  msg.split('\n').forEach(line => {
    writeLogLine(`[${new Date().toISOString()}] [${level}] [${sender}] - ${line}`);
  });
}

const consoleLog = console.log;
console.log = (...args) => {
  // if (!process.env.SLOBS_DISABLE_MAIN_LOGGING) {
    const serialized = args
      .map(arg => {
        if (typeof arg === 'string') return arg;

        return util.inspect(arg);
      })
      .join(' ');

    logFromRemote('info', 'electron-main', serialized);
  // }
};

console.log('=================================');
console.log('应用程序：');
console.log(`Version: ${process.env.VERSION}`);
console.log(`OS: ${os.platform()} ${os.release()}`);
console.log(`Arch: ${process.arch}`);
console.log(`CPU: ${cpus[0].model}`);
console.log(`Cores: ${cpus.length}`);
console.log(`Memory: ${humanFileSize(os.totalmem(), false)}`);
console.log(`Free: ${humanFileSize(os.freemem(), false)}`);
console.log('=================================');

const template = [
  {
    "label": '程序',
    "submenu": [
      { "label": `当前版本 ${pjson.version}` },
      { "label": "退出", "accelerator": "Command+Q", "id": 'quit', "role": "quit" }
    ]
  },
  {
    "label": "编辑",
    "submenu": [
      { "label": "剪切", "accelerator": "CmdOrCtrl+X", "role": "cut" },
      { "label": "复制", "accelerator": "CmdOrCtrl+C", "role": "copy" },
      { "label": "粘贴", "accelerator": "CmdOrCtrl+V", "role": "paste" },
      { "label": "选择所有", "accelerator": "CmdOrCtrl+A", "role": "selectall" }]
  },
  {
    label: '窗口',
    role: 'window',
    submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: '隐藏', accelerator: 'CmdOrCtrl+H', role: 'hide' },
    ],
  },
];

global.indexUrl = `file://${__dirname}/index.html`;

// 记住应用打开的状态
const windowStateKeeper = require('electron-window-state');

async function startApp() {
  const isDevMode = process.env.NODE_ENV !== 'production';

  const mainWindowState = windowStateKeeper({
    defaultWidth: 720,
    defaultHeight: 480,
  });
  
  // 自定义窗口 + 窗口导航条
  mainWindow = new BrowserWindow({
    minWidth: 720,
    minHeight: 480,
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: mainWindowState.x,
    y: mainWindowState.y,
    show: true,
    movable: true,
    frame: true,
    titleBarStyle: 'show',
    title: '', // 窗口名称，显示在窗口正中间
    backgroundColor: '#80FFFFFF',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      enableRemoteModule: true,
    }
  });

  // 这里修改你需要加载的地址
  mainWindow.loadURL(global.indexUrl);

  mainWindowState.manage(mainWindow);
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  mainWindow.removeMenu(null);

  mainWindow.on('close', e => {
    if (!shutdownStarted) {
      shutdownStarted = true;
      if (!mainWindow.isDestroyed()) mainWindow.close();
    }
  });

  if (isDevMode) {
    mainWindow.webContents.openDevTools({ mode: 'undocked' });
  }  
}

app.on('ready', ()=> {
  startApp();
  // if(process.env.NODE_ENV === 'production') {
  //   if (process.platform === 'win32') { 
  //     const updateInfo = {
  //       baseUrl: '',
  //       versionFileName: `${releaseChannel}.json`,
  //       version: pjson.version,
  //       exec: process.argv,
  //       cwd: process.cwd(),
  //       waitPids: [process.pid],
  //       appDir: path.dirname(app.getPath('exe')),
  //       tempDir: path.join(app.getPath('temp'), 'cute-updater'),
  //       cacheDir: app.getPath('userData')
  //     };
  //     bootstrap(updateInfo, startApp, app.exit);
  //   } else {
  //     startApp();
  //   }
  // } else {
  //   startApp();
  // }
});

////////////////////////////////////////////////////////////////////////////////
// EventEmitter 
////////////////////////////////////////////////////////////////////////////////

ipcMain.on('getAppStartTime', e => {
  e.returnValue = appStartTime;
});

ipcMain.on('restartApp', () => {
  app.relaunch();
  // 关闭主窗口
  mainWindow.close();
});

ipcMain.on('measure-time', (e, msg, time) => {
  measure(msg, time);
});

ipcMain.on('open-folder', () => {
  const userData = path.join(app.getPath('appData'), 'cute-desktop');
  electron.shell.openPath(userData);
}) 

// 测量事件之间的时间
function measure(msg, time) {
  if (!time) time = Date.now();
  const delta = lastEventTime ? time - lastEventTime : 0;
  lastEventTime = time;
  if (delta > 2000) console.log('------------------');
  console.log(msg, delta + 'ms');
}

// ffmpeg 初始化
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
const ffprobePath = require('@ffprobe-installer/ffprobe')
const FfmpegCommand = require('fluent-ffmpeg');

// asar打包后路径有所变化
if (process.env.NODE_ENV === 'production') {
  FfmpegCommand.setFfmpegPath(ffmpegPath.path.replace('app.asar', 'app.asar.unpacked'))
  FfmpegCommand.setFfprobePath(ffprobePath.path.replace('app.asar', 'app.asar.unpacked'))
} else {
  FfmpegCommand.setFfmpegPath(ffmpegPath.path)
  FfmpegCommand.setFfprobePath(ffprobePath.path)
}

let command;
// ffmpeg 视频处理
ipcMain.on('download', (e, data) => {

  downloadM3u8(data);
})

ipcMain.on('cancel-download', (e, data) => {
  if (command) {
    command.kill();
    mainWindow.webContents.send('cancle-download-success', {});
  }
})

function downloadM3u8(data) {
  if (command) {
    command.kill();
  }
  const ffmpeg = new FfmpegCommand();
  const inputPath = data.inputPath;
  const outputPath = path.join(app.getPath('appData'), 'cute-desktop',`${data.outputPath}.mp4`);
  command = ffmpeg.input(inputPath)
    .inputOptions('-re')
    .on('start', function (commandLine) {
      console.log('Spawned Ffmpeg with command: ' + commandLine);
    })
    .videoCodec('copy')
    .on('codecData', function (data) {
      console.log('Input is ' + data.audio + ' audio ' + 'with ' + data.video + ' video');
    })
    .on('progress', function (progress) {
      // console.log('Processing: ' + progress.percent + '% done');
      mainWindow.webContents.send('download-process', progress.percent);
    })
    .on('stderr', function (stderrLine) {
      console.log('Stderr output: ' + stderrLine);
    })
    .on('error', function(err, stdout, stderr) {
      console.log('Cannot process video: ' + err.message);
    })
    .on('end', function(){
      console.log('exchanged end ffmpeg')
    })
    .saveToFile(outputPath, function(retcode, error) {
      console.log('file has been converted succesfully');
    })
}

