/**
 * AppErrorBoundary — 023H
 *
 * Top-level React error boundary so that an uncaught render error shows a
 * clear recovery message instead of a completely blank screen.
 *
 * Requirements (from Prompt 023H §8):
 *   ✓ No sensitive error details shown publicly
 *   ✓ Logs the technical error for diagnosis (console.error)
 *   ✓ Does NOT auto-clear storage or delete any user data
 *   ✓ Does NOT create a reload loop
 *   ✓ Provides a manual "Try Again" action that resets the boundary
 */
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log for diagnosis — never sent to an external service here.
    console.error('[TrailWeigh] Unhandled render error:', error);
    console.error('[TrailWeigh] Component stack:', info.componentStack);
  }

  private handleTryAgain = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100dvh',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            color: '#374151',
            backgroundColor: '#f9fafb',
            gap: '1rem',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            TrailWeigh couldn't load this view
          </h2>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#6b7280', maxWidth: '360px' }}>
            Your saved data has not been deleted. Please refresh the page or tap the button below to try again.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={this.handleTryAgain}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: '#3d6350',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                color: '#374151',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
