 import * as util from 'util';
 import * as path from 'path';
 import * as tasklist from 'tasklist';
 import * as fs from 'fs';
 import fetch from 'node-fetch';
 import * as cp from 'child_process';
 import * as semver from 'semver';
 import * as electron from 'electron';

 const mkdir = util.promisify(fs.mkdir);
 
 interface IUpdateInfo {
   baseUrl: string;
   version: string;
   exec: string[];
   cwd: string;
   waitPids: number[];
   appDir: string;
   tempDir: string;
   cacheDir: string;
   versionFileName: string;
 }
 
 interface ILatestVersionInfo {
   version: string;
   seed: string;
   rollout: {
     default: number;
     [version: string]: number;
   };
   restricted?: boolean;
 }
 
 
 async function isUpdaterRunning(updaterPath: string, updaterName: string) {
   let updaterRunning = false;
 
   if (!fs.existsSync(updaterPath)) {
     return updaterRunning;
   }

   const processes = await tasklist();
  
   for (const processItem in processes) {
     if (processes[processItem].imageName === updaterName) {
       console.log(
         `Detected running updater process ${processes[processItem].imageName} - PID: ${processes[processItem].pid}`,
       );
 
       try {
         fs.unlinkSync(updaterPath);
       } catch (e) {
         updaterRunning = true;
       }
     }
   }
 
   return updaterRunning;
 }
 
 async function fetchUpdater(info: IUpdateInfo): Promise<string | null> {
   let updaterName = 'latest-updater.exe';
 
   const updaterPath = path.resolve(info.tempDir, updaterName);
   if (await isUpdaterRunning(updaterPath, updaterName)) {
     console.log('Updater is already running, aborting fetch.');
     return null;
   }

   const outStream = fs.createWriteStream(updaterPath);
   return new Promise((resolve, reject) => {
     fetch(`${info.baseUrl}/${updaterName}`)
       .then((response:any) => {
         if (response.status !== 200) {
           reject(`Failed to fetch updater: status ${response.status}`);
         }
         const outPipe = response.body.pipe(outStream);
         outPipe.on('close', () => {
           resolve(updaterPath);
         });
 
         outPipe.on('error', (error:any) => {
           reject(error);
         });
       })
       .catch((e) => {
         reject(e);
       });
   });
 }
 
 async function getLatestVersionInfo(info: IUpdateInfo): Promise<ILatestVersionInfo | null> {
   const response:any = await fetch(`${info.baseUrl}/${info.versionFileName}`);
   if (response.status !== 200) {
     console.log(`Failed to fetch version information - ${response.status}`);
     return null;
   }
 
   return response.json();
 }
 
 async function shouldUpdate(latestVersion: ILatestVersionInfo, info: IUpdateInfo) {
   if (!latestVersion) {
     console.log('Failed to fetch latest version.');
     return false;
   }
 
   if (semver.eq(info.version, latestVersion.version)) {
     console.log('Already latest version.');
     return false;
   }
 
   if (semver.gt(info.version, latestVersion.version)) {
     console.log('Latest version is less than current version. Update will not be applied.');
     return false;
   }
 
   return true;
 }
 
 let updaterWindow: electron.BrowserWindow;
 let updaterWindowSuccessfulClose = false;
 let updateState = {
   version:'',
   percent:0,
   installing:false,
   error:false
 };
 
 function pushState() {
   if (updaterWindow && !updaterWindow.isDestroyed()) {
     updaterWindow.webContents.send('WinUpdater-pushState', updateState);
   }
 }
 
 function spawnUpdaterWindow() {
   updaterWindow = new electron.BrowserWindow({
     width: 400,
     height: 120,
     frame: false,
     resizable: false,
     show: false,
     alwaysOnTop: true,
     movable: true,
     title: '视频龙',
     webPreferences: { 
       nodeIntegration: true,
       contextIsolation: false
    }
   });
 
   updaterWindow.on('ready-to-show', () => {
     updaterWindow.show();
   });
 
   updaterWindow.on('close', () => {
     if (!updaterWindowSuccessfulClose) electron.app.quit();
   });
 
   var curPath = 'file://' + path.resolve(__dirname, '..') + '/win/index.html';

   updaterWindow.loadURL(curPath);
 
   //updaterWindow.webContents.openDevTools({ mode: 'undocked' });
 
   electron.ipcMain.on('WinUpdater-getState', () => {
     pushState();
   });
 }
 
 function closeUpdaterWindow() {
   updaterWindowSuccessfulClose = true;
   if (updaterWindow) {
     electron.app.once('will-quit', (e) => e.preventDefault());
     updaterWindow.close();
   }
 }
 
 
 async function entry(info: IUpdateInfo) {
   console.log('Starting update check:', info);
 
   const latestVersion = await getLatestVersionInfo(info);
 
   if (!latestVersion) {
     console.log('Aborting update to due failure fetching latest version information.');
     return false;
   }

   if (!(await shouldUpdate(latestVersion, info))) return false;

   spawnUpdaterWindow();
 
   await mkdir(info.tempDir, { recursive: true });
 
   updateState.version = latestVersion.version;
   updateState.percent = 0;

   const updaterPath = await fetchUpdater(info);

   if (!updaterPath) {
     console.log('Aborting update due to updater already running.');
     return true;
   }
 
   const updaterArgs = [
     '--base-url',
     `"${info.baseUrl}"`,
     '--version',
     `"${latestVersion.version}"`,
     '--exec',
     `"${info.exec.join(' ')}"`,
     '--cwd',
     `"${info.cwd}"`,
     '--app-dir',
     `"${info.appDir}"`,
     '--force-temp',
   ];
 
   info.waitPids.forEach((pid) => {
     updaterArgs.push('-p');
     updaterArgs.push(pid.toString());
   });
 
   const updaterStartCommand = `start "" "${updaterPath}"`;
 
   console.log('Spawning updater with args:', updaterArgs);
 
   const updaterProcess = cp.spawn(updaterStartCommand, updaterArgs, {
     cwd: info.tempDir,
     detached: true,
     shell: true,
   });
 
   console.log(`Spawning updater - PID: ${updaterProcess.pid}`);
 
   const returnCode = await new Promise<number>((resolve) => {
     updaterProcess.on('exit', resolve);
     updaterProcess.on('error', resolve);
   });

   console.log(`Updater spawn result: ${returnCode}`);
  
   updateState.installing = true;
 
   updaterProcess.unref();
 
   return returnCode.toString() === '0';
 }
 
 module.exports = (info: IUpdateInfo, startApp: () => void, exit: () => void) => {
   return entry(info)
     .then((shouldExit) => {
       closeUpdaterWindow();
       if (shouldExit) {
         console.log('Closing for update...');
         exit();
       } else {
         console.log('App will start without updating.');
         startApp();
       }
     })
     .catch((error) => {
       updateState.error = true;
       closeUpdaterWindow();
       console.log(error);
       startApp();
     });
 };