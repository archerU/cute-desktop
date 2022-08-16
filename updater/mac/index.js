import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const { remote, ipcRenderer } = window.require('electron');
console.log(remote, ipcRenderer)
class App extends React.Component {
  state = {
    message: '正在检查更新...',
    installing: false,
    error: false,
    percentComplete: null
  }

  download() {
    remote.shell.openExternal('');
    remote.app.quit();
  }

  componentDidMount() {
    ipcRenderer.on('autoUpdate-pushState', (event, data) => {
      if (data.version) {
        this.setState({
          message: '正在下载最新版本: ' + data.version
        });
      }
      if (data.percent) {
        this.setState({
          percentComplete: Math.floor(data.percent)
        });
      }
      if (data.installing) {
        this.setState({
          installing: true,
          message: `下载版本为： ${data.version}`
        })
      }
      if (data.error) {
        this.setState({
          error: true,
          message: '发生未知错误，请联系小二处理'
        })
      }
    });
    // 告诉主进程mounted结束
    ipcRenderer.send('WinUpdater-getState');
  }

  render() {
    const {message, percentComplete, installing, error} = this.state;
    return(
      <div className="UpdaterWindow">
        <div className="updaterImg">
          <img className="faSpin" src="https://gw.alicdn.com/imgextra/i4/O1CN01ydJYl81rC6ITxCYKK_!!6000000005594-2-tps-200-200.png" />
          {message}
        </div>
        {percentComplete !== null && !installing && !error && (
          <div>
            <div className="UpdaterWindow-progressPercent">{percentComplete}% 完成</div>
            <div className="UpdaterWindow-progressBarContainer">
              <div className="UpdaterWindow-progressBar" style={{ width: `${percentComplete}%` }}/>
            </div>
          </div>
        )} 
        {installing && (
          <div className="UpdaterWindow-issues">
            正在下载更新。这可能需要几分钟。
          </div>
        )}
        {error && (
          <div className="UpdaterWindow-issues">
            更新时出错了，请
            <span className="UpdaterWindow-link" onClick={this.download}>
              手动下载
            </span>
          </div>
        )}
      </div>
    )
  }
}



ReactDOM.render(<App />, document.getElementById('app'))