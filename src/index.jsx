import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter basename={process.env.NODE_ENV === 'development' ? '' : '/pages-cal'}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
