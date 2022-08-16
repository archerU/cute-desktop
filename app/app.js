import React from 'react';
import ReactDOM from 'react-dom/client';
import Download from './components/download';
import './app.css';

const App = () => {
  return (
    <div>
      <Download></Download>
    </div>
  )
}


ReactDOM.createRoot(document.getElementById('app')).render(<App />);