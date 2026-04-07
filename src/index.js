import React from 'react';
import ReactDOM from 'react-dom/client';
import Momentum from './Momentum';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><Momentum /></React.StrictMode>);
