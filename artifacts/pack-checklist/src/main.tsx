import { createRoot } from 'react-dom/client';
import React from 'react';

import App from './App';
import { ThemeProvider } from './context/ThemeContext';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
