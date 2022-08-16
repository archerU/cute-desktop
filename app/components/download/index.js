import React, {useState, useEffect} from 'react';
import { Button, Input, Progress, message} from 'antd';

const { Search } = Input;

const Download = () => {
  const [process, setProcess] = useState(0)
  const [value , setValue] = useState('');
  const [loading, setLoading] = useState(false)

  const electron = window.require('electron');

  // 开始下载
  function startDownload(value) {
    const array = value.split('/');
    const name = array[array.length - 1].split('.')[0];

    electron && electron.ipcRenderer.send('download', {
      inputPath: value,
      outputPath: name,
    })
  }

  // 取消下载
  function cancalDownload() {
    electron && electron.ipcRenderer.send('cancel-download', {})
  }

  // 下载进度
  electron && electron.ipcRenderer.on('download-process', (e, data) => {
    let process = 0;
    if (data) {
      process = Number(data.toFixed(2));
    }
    setProcess(process);
    setLoading(true);
  })

  // 下载成功
  electron && electron.ipcRenderer.on('download-success', (e, data) => {
    // console.log(data)
    // 弹窗提示
    // message.info('下载成功了');
    // 重制状态
    setLoading(false);
    setProcess(0);
  })

  // 取消下载成功
  electron && electron.ipcRenderer.on('cancle-download-success', (e, data) => {
    setLoading(false);
    setProcess(0);
  })

  function onSearch() {
    if (!value ) {
      return;
    }
    startDownload(value)
  }

  function onCancal() {
    cancalDownload()
  }

  function onOpenFolder() {
    electron && electron.ipcRenderer.send('open-folder', {})
  }

  return (
    <div className="download">
      <div className="input-group">
        <Input placeholder="输入需要下载的地址" value={value} onChange={(e) => {
          setValue(e.target.value)
        }}/>
        {loading ? (
          <Button type="primary" danger onClick={onCancal}>取消</Button>
        ): (
        <Button type="primary" onClick={onSearch}>下载</Button>
        )}
      </div>
      {/* <Search 
        placeholder="输入需要下载的地址"
        loading={loading}
        enterButton="下载"
        onSearch={onSearch}
      /> */}
      <div className="download-process">
        <Progress percent={process}  status="active"/>
        {/* <a className="download-lock">查看地址</a> */}
      </div>
      <Button onClick={onOpenFolder}>打开存储目录</Button>
    </div>
  )
}

export default Download;