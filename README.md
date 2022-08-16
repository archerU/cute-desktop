


## 启动

### 如果运行

```
yarn

yarn compile

yarn start

```

### 打包

```
yarn

yarn compile

// windows
yarn package

// mac 
yarn package:mac
```

### Electron 图标如何制作

https://picwish.cn/?chn-piccpa
https://cloudconvert.com/png-to-ico

### Electron 打包目录问题
https://128bit.top/electronzhong-de-ge-lei-lu-jing-wen-ti/

https://www.csdn.net/tags/MtTaEgysNDEzMTE1LWJsb2cO0O0O.html

https://www.longqi.cf/tools/2015/02/13/ffmpegcn/

### Electron 自定义窗口
https://blog.csdn.net/weixin_40629244/article/details/116332270

### Electron 托盘处理
https://juejin.cn/post/6938195509198733348

### Electron 安全协议
https://juejin.cn/post/6844904174434385933

### webpack 配置
https://cloud.tencent.com/developer/article/1450916?from=15425
https://cloud.tencent.com/developer/article/1742015
https://juejin.cn/post/6844903913301213191



The source list for the Content Security Policy directive 'script-src' contains an invalid source: ''unsafe'. It will be ignored.

### Electron 打开本地目录
  const userData = path.join(app.getPath('appData'), 'cute-desktop');
electron.shell.openPath(userData);

### Electron 文件下载器
https://www.cnblogs.com/JasonLong/p/13844056.html

### Electron 使用 ffmpeg demo
https://blog.wangyu.link/2020/05/15/2020-05-15/


### ffmpeg save / saveTofile 打包后，输出只读文件错误

```
[2022-08-15T09:44:32.338Z] [info] [electron-main] - Stderr output: fccc7727-38cb-468b-8315-d9cb8bff311b.mp4: Read-only file system
[2022-08-15T09:44:32.344Z] [info] [electron-main] - Stderr output: 
[2022-08-15T09:44:32.344Z] [info] [electron-main] - Cannot process video: ffmpeg exited with code 1: fccc7727-38cb-468b-8315-d9cb8bff311b.mp4: Read-only file system
```
原因是这个文件夹只读，换一个地方存储。
