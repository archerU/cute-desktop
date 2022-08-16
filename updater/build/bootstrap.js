"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var util = require("util");
var path = require("path");
var tasklist = require("tasklist");
var fs = require("fs");
var node_fetch_1 = require("node-fetch");
var cp = require("child_process");
var semver = require("semver");
var electron = require("electron");
var mkdir = util.promisify(fs.mkdir);
function isUpdaterRunning(updaterPath, updaterName) {
    return __awaiter(this, void 0, void 0, function () {
        var updaterRunning, processes, processItem;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    updaterRunning = false;
                    if (!fs.existsSync(updaterPath)) {
                        return [2 /*return*/, updaterRunning];
                    }
                    return [4 /*yield*/, tasklist()];
                case 1:
                    processes = _a.sent();
                    for (processItem in processes) {
                        if (processes[processItem].imageName === updaterName) {
                            console.log("Detected running updater process ".concat(processes[processItem].imageName, " - PID: ").concat(processes[processItem].pid));
                            try {
                                fs.unlinkSync(updaterPath);
                            }
                            catch (e) {
                                updaterRunning = true;
                            }
                        }
                    }
                    return [2 /*return*/, updaterRunning];
            }
        });
    });
}
function fetchUpdater(info) {
    return __awaiter(this, void 0, void 0, function () {
        var updaterName, updaterPath, outStream;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    updaterName = 'latest-updater.exe';
                    updaterPath = path.resolve(info.tempDir, updaterName);
                    return [4 /*yield*/, isUpdaterRunning(updaterPath, updaterName)];
                case 1:
                    if (_a.sent()) {
                        console.log('Updater is already running, aborting fetch.');
                        return [2 /*return*/, null];
                    }
                    outStream = fs.createWriteStream(updaterPath);
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            (0, node_fetch_1.default)("".concat(info.baseUrl, "/").concat(updaterName))
                                .then(function (response) {
                                if (response.status !== 200) {
                                    reject("Failed to fetch updater: status ".concat(response.status));
                                }
                                var outPipe = response.body.pipe(outStream);
                                outPipe.on('close', function () {
                                    resolve(updaterPath);
                                });
                                outPipe.on('error', function (error) {
                                    reject(error);
                                });
                            })
                                .catch(function (e) {
                                reject(e);
                            });
                        })];
            }
        });
    });
}
function getLatestVersionInfo(info) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, node_fetch_1.default)("".concat(info.baseUrl, "/").concat(info.versionFileName))];
                case 1:
                    response = _a.sent();
                    if (response.status !== 200) {
                        console.log("Failed to fetch version information - ".concat(response.status));
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, response.json()];
            }
        });
    });
}
function shouldUpdate(latestVersion, info) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!latestVersion) {
                console.log('Failed to fetch latest version.');
                return [2 /*return*/, false];
            }
            if (semver.eq(info.version, latestVersion.version)) {
                console.log('Already latest version.');
                return [2 /*return*/, false];
            }
            if (semver.gt(info.version, latestVersion.version)) {
                console.log('Latest version is less than current version. Update will not be applied.');
                return [2 /*return*/, false];
            }
            return [2 /*return*/, true];
        });
    });
}
var updaterWindow;
var updaterWindowSuccessfulClose = false;
var updateState = {
    version: '',
    percent: 0,
    installing: false,
    error: false
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
    updaterWindow.on('ready-to-show', function () {
        updaterWindow.show();
    });
    updaterWindow.on('close', function () {
        if (!updaterWindowSuccessfulClose)
            electron.app.quit();
    });
    var curPath = 'file://' + path.resolve(__dirname, '..') + '/win/index.html';
    updaterWindow.loadURL(curPath);
    //updaterWindow.webContents.openDevTools({ mode: 'undocked' });
    electron.ipcMain.on('WinUpdater-getState', function () {
        pushState();
    });
}
function closeUpdaterWindow() {
    updaterWindowSuccessfulClose = true;
    if (updaterWindow) {
        electron.app.once('will-quit', function (e) { return e.preventDefault(); });
        updaterWindow.close();
    }
}
function entry(info) {
    return __awaiter(this, void 0, void 0, function () {
        var latestVersion, updaterPath, updaterArgs, updaterStartCommand, updaterProcess, returnCode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Starting update check:', info);
                    return [4 /*yield*/, getLatestVersionInfo(info)];
                case 1:
                    latestVersion = _a.sent();
                    if (!latestVersion) {
                        console.log('Aborting update to due failure fetching latest version information.');
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, shouldUpdate(latestVersion, info)];
                case 2:
                    if (!(_a.sent()))
                        return [2 /*return*/, false];
                    spawnUpdaterWindow();
                    return [4 /*yield*/, mkdir(info.tempDir, { recursive: true })];
                case 3:
                    _a.sent();
                    updateState.version = latestVersion.version;
                    updateState.percent = 0;
                    return [4 /*yield*/, fetchUpdater(info)];
                case 4:
                    updaterPath = _a.sent();
                    if (!updaterPath) {
                        console.log('Aborting update due to updater already running.');
                        return [2 /*return*/, true];
                    }
                    updaterArgs = [
                        '--base-url',
                        "\"".concat(info.baseUrl, "\""),
                        '--version',
                        "\"".concat(latestVersion.version, "\""),
                        '--exec',
                        "\"".concat(info.exec.join(' '), "\""),
                        '--cwd',
                        "\"".concat(info.cwd, "\""),
                        '--app-dir',
                        "\"".concat(info.appDir, "\""),
                        '--force-temp',
                    ];
                    info.waitPids.forEach(function (pid) {
                        updaterArgs.push('-p');
                        updaterArgs.push(pid.toString());
                    });
                    updaterStartCommand = "start \"\" \"".concat(updaterPath, "\"");
                    console.log('Spawning updater with args:', updaterArgs);
                    updaterProcess = cp.spawn(updaterStartCommand, updaterArgs, {
                        cwd: info.tempDir,
                        detached: true,
                        shell: true,
                    });
                    console.log("Spawning updater - PID: ".concat(updaterProcess.pid));
                    return [4 /*yield*/, new Promise(function (resolve) {
                            updaterProcess.on('exit', resolve);
                            updaterProcess.on('error', resolve);
                        })];
                case 5:
                    returnCode = _a.sent();
                    console.log("Updater spawn result: ".concat(returnCode));
                    updateState.installing = true;
                    updaterProcess.unref();
                    return [2 /*return*/, returnCode.toString() === '0'];
            }
        });
    });
}
module.exports = function (info, startApp, exit) {
    return entry(info)
        .then(function (shouldExit) {
        closeUpdaterWindow();
        if (shouldExit) {
            console.log('Closing for update...');
            exit();
        }
        else {
            console.log('App will start without updating.');
            startApp();
        }
    })
        .catch(function (error) {
        updateState.error = true;
        closeUpdaterWindow();
        console.log(error);
        startApp();
    });
};
