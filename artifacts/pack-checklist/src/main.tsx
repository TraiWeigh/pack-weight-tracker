import { createRoot } from 'react-dom/client';
import React from 'react';

import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';

import './index.css';

// 023H: Wrap the entire app in a top-level error boundary so that an
// uncaught render error shows a friendly recovery message instead of a
// completely blank screen.  The boundary logs the technical error to the
// console for diagnosis but does not expose it in the UI, does not
// auto-clear any user storage, and does not create a reload loop.
createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
