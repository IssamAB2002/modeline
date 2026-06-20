import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n'; // Initialize i18n configuration
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>Loading…</div>}>
        <App />
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
);
