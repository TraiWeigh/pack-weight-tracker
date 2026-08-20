import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type RectSnapshot = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
};

type ElementSnapshot = {
  selector: string;
  visible: boolean;
  rect: RectSnapshot;
};

type CategorySample = ElementSnapshot & {
  category: string;
};

type ViewportSnapshot = {
  timestamp: string;
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    innerWidth: number;
    innerHeight: number;
    outerWidth: number;
    outerHeight: number;
    scrollX: number;
    scrollY: number;
    devicePixelRatio: number;
  };
  document: {
    clientWidth: number;
    clientHeight: number;
    scrollWidth: number;
    scrollHeight: number;
    bodyScrollWidth: number;
    bodyScrollHeight: number;
  };
  visualViewport:
    | {
        available: true;
        width: number;
        height: number;
        offsetLeft: number;
        offsetTop: number;
        pageLeft: number;
        pageTop: number;
        scale: number;
      }
    | {
        available: false;
        message: 'visualViewport unavailable';
      };
  trailweigh: {
    pageState: 'Home' | 'Checklist' | 'Unknown';
    elements: {
      rootMobileShell: ElementSnapshot | null;
      appBar: ElementSnapshot | null;
      listSummary: ElementSnapshot | null;
      homeHero: ElementSnapshot | null;
      bottomBoxGroups: ElementSnapshot | null;
      homeContentScroller: ElementSnapshot | null;
      normalChecklistScroller: ElementSnapshot | null;
      openLongCategoryViewport: ElementSnapshot | null;
    };
    categorySamples: {
      firstVisible: CategorySample | null;
      middleVisible: CategorySample | null;
      lastVisible: CategorySample | null;
    };
    computed: {
      html: { overflowX: string; overflowY: string };
      body: { overflowX: string; overflowY: string };
      root: {
        overflowX: string;
        overflowY: string;
        boxSizing: string;
        width: string;
        maxWidth: string;
        minHeight: string;
      } | null;
      safeAreaInsets: {
        top: string;
        right: string;
        bottom: string;
        left: string;
      };
      orientation: 'portrait' | 'landscape';
    };
  };
  url: string;
  userAgent: string;
};

const DEBUG_QUERY = 'twViewportDebug';

function round(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : value;
}

function rectOf(element: Element): RectSnapshot {
  const rect = element.getBoundingClientRect();
  return {
    top: round(rect.top),
    bottom: round(rect.bottom),
    left: round(rect.left),
    right: round(rect.right),
    width: round(rect.width),
    height: round(rect.height),
  };
}

function elementOf(selector: string, element: Element | null): ElementSnapshot | null {
  if (!element) return null;
  const style = window.getComputedStyle(element);
  const rect = rectOf(element);
  return {
    selector,
    visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
    rect,
  };
}

function isVisibleInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= window.innerHeight &&
    rect.left <= window.innerWidth
  );
}

function captureSnapshot(): ViewportSnapshot {
  const root = document.querySelector('.tw-v3-root');
  const categoryElements = Array.from(document.querySelectorAll<HTMLElement>('[data-cat]'))
    .filter(isVisibleInViewport);
  const toCategorySample = (element: HTMLElement | undefined): CategorySample | null => {
    if (!element) return null;
    return {
      category: element.dataset.cat || '(unnamed category)',
      selector: `[data-cat="${element.dataset.cat || ''}"]`,
      visible: true,
      rect: rectOf(element),
    };
  };
  const visualViewport = window.visualViewport;
  const safeAreaProbe = document.querySelector('[data-testid="viewport-diagnostic-safe-area"]');
  const safeAreaStyle = safeAreaProbe ? window.getComputedStyle(safeAreaProbe) : null;
  const rootStyle = root ? window.getComputedStyle(root) : null;

  const element = (selector: string) => elementOf(selector, document.querySelector(selector));

  return {
    timestamp: new Date().toISOString(),
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      scrollX: round(window.scrollX),
      scrollY: round(window.scrollY),
      devicePixelRatio: window.devicePixelRatio,
    },
    document: {
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      bodyScrollWidth: document.body.scrollWidth,
      bodyScrollHeight: document.body.scrollHeight,
    },
    visualViewport: visualViewport
      ? {
          available: true,
          width: round(visualViewport.width),
          height: round(visualViewport.height),
          offsetLeft: round(visualViewport.offsetLeft),
          offsetTop: round(visualViewport.offsetTop),
          pageLeft: round(visualViewport.pageLeft),
          pageTop: round(visualViewport.pageTop),
          scale: round(visualViewport.scale),
        }
      : {
          available: false,
          message: 'visualViewport unavailable',
        },
    trailweigh: {
      pageState: document.querySelector('[data-testid="home-screen"]')
        ? 'Home'
        : root
          ? 'Checklist'
          : 'Unknown',
      elements: {
        rootMobileShell: element('.tw-v3-root'),
        appBar: element('[data-testid="app-bar"]'),
        listSummary: element('[data-testid="list-summary-bar"]'),
        homeHero: element('[data-testid="home-hero"]'),
        bottomBoxGroups: element('[data-testid="bottom-nav"]'),
        homeContentScroller: element('[data-testid="home-content-scroll"]'),
        normalChecklistScroller: element('[data-testid="main-scroll"]'),
        openLongCategoryViewport: element('[data-testid="open-cat-items"]'),
      },
      categorySamples: {
        firstVisible: toCategorySample(categoryElements[0]),
        middleVisible: toCategorySample(
          categoryElements.length >= 3
            ? categoryElements[Math.floor(categoryElements.length / 2)]
            : undefined,
        ),
        lastVisible: toCategorySample(categoryElements[categoryElements.length - 1]),
      },
      computed: {
        html: {
          overflowX: window.getComputedStyle(document.documentElement).overflowX,
          overflowY: window.getComputedStyle(document.documentElement).overflowY,
        },
        body: {
          overflowX: window.getComputedStyle(document.body).overflowX,
          overflowY: window.getComputedStyle(document.body).overflowY,
        },
        root: rootStyle
          ? {
              overflowX: rootStyle.overflowX,
              overflowY: rootStyle.overflowY,
              boxSizing: rootStyle.boxSizing,
              width: rootStyle.width,
              maxWidth: rootStyle.maxWidth,
              minHeight: rootStyle.minHeight,
            }
          : null,
        safeAreaInsets: {
          top: safeAreaStyle?.paddingTop || 'unavailable',
          right: safeAreaStyle?.paddingRight || 'unavailable',
          bottom: safeAreaStyle?.paddingBottom || 'unavailable',
          left: safeAreaStyle?.paddingLeft || 'unavailable',
        },
        orientation: window.matchMedia('(orientation: portrait)').matches
          ? 'portrait'
          : 'landscape',
      },
    },
    url: `${window.location.pathname}${window.location.search}`,
    userAgent: navigator.userAgent,
  };
}

function snapshotText(snapshot: ViewportSnapshot | null): string {
  return snapshot ? JSON.stringify(snapshot, null, 2) : 'Collecting viewport snapshot…';
}

export function ViewportDiagnostic() {
  const [expanded, setExpanded] = useState(false);
  const [snapshot, setSnapshot] = useState<ViewportSnapshot | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'fallback'>('idle');
  const enabled = useMemo(
    () => new URLSearchParams(window.location.search).get(DEBUG_QUERY) === '1',
    [],
  );

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    const refresh = () => setSnapshot(captureSnapshot());
    const scheduleRefresh = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(refresh);
    };
    const visualViewport = window.visualViewport;

    refresh();
    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('orientationchange', scheduleRefresh);
    visualViewport?.addEventListener('resize', scheduleRefresh);
    visualViewport?.addEventListener('scroll', scheduleRefresh);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', scheduleRefresh);
      window.removeEventListener('orientationchange', scheduleRefresh);
      visualViewport?.removeEventListener('resize', scheduleRefresh);
      visualViewport?.removeEventListener('scroll', scheduleRefresh);
    };
  }, [enabled]);

  if (!enabled) return null;

  const text = snapshotText(snapshot);
  const copySnapshot = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
    } catch {
      setCopyState('fallback');
    }
  };

  return createPortal(
    <>
      <div
        data-testid="viewport-diagnostic"
        aria-label="Temporary viewport diagnostic"
        style={{
          position: 'fixed',
          top: 8,
          right: 8,
          width: 'min(360px, calc(100vw - 16px))',
          maxWidth: 'calc(100vw - 16px)',
          zIndex: 2147483647,
          pointerEvents: 'none',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 11,
          lineHeight: 1.35,
          color: '#102018',
        }}
      >
        <div
          style={{
            background: 'rgba(248, 252, 249, 0.97)',
            border: '1px solid #315b43',
            borderRadius: 8,
            boxShadow: '0 3px 14px rgba(0,0,0,0.24)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 44,
              padding: '4px 6px 4px 10px',
            }}
          >
            <strong style={{ flex: 1, minWidth: 0 }}>Viewport diagnostic</strong>
            <span aria-live="polite" style={{ color: '#315b43', whiteSpace: 'nowrap' }}>
              {snapshot?.trailweigh.pageState ?? 'Loading'}
            </span>
            <button
              type="button"
              data-testid="viewport-diagnostic-toggle"
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse viewport diagnostic' : 'Expand viewport diagnostic'}
              onClick={() => setExpanded(value => !value)}
              style={{
                pointerEvents: 'auto',
                minWidth: 44,
                minHeight: 36,
                border: '1px solid #759582',
                borderRadius: 5,
                background: '#fff',
                color: '#173c27',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {expanded ? 'Hide' : 'Show'}
            </button>
          </div>

          {expanded && (
            <div
              data-testid="viewport-diagnostic-details"
              style={{
                maxHeight: 'min(68vh, 520px)',
                overflowY: 'auto',
                borderTop: '1px solid #b9cdbf',
                padding: '7px 8px 8px',
              }}
            >
              <div style={{ marginBottom: 6, color: '#315b43' }}>
                Live local-only snapshot · {snapshot?.timestamp ?? 'collecting…'}
              </div>
              <pre
                data-testid="viewport-diagnostic-values"
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 9.5,
                  lineHeight: 1.3,
                }}
              >
                {text}
              </pre>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button
                  type="button"
                  data-testid="viewport-diagnostic-copy"
                  onClick={copySnapshot}
                  style={{
                    pointerEvents: 'auto',
                    minHeight: 36,
                    flex: 1,
                    border: '1px solid #315b43',
                    borderRadius: 5,
                    background: '#315b43',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  {copyState === 'copied' ? 'Copied' : 'Copy Snapshot'}
                </button>
                <button
                  type="button"
                  data-testid="viewport-diagnostic-refresh"
                  onClick={() => {
                    setSnapshot(captureSnapshot());
                    setCopyState('idle');
                  }}
                  style={{
                    pointerEvents: 'auto',
                    minHeight: 36,
                    flex: 1,
                    border: '1px solid #759582',
                    borderRadius: 5,
                    background: '#fff',
                    color: '#173c27',
                    fontWeight: 700,
                  }}
                >
                  Refresh
                </button>
              </div>
              {copyState === 'fallback' && (
                <textarea
                  data-testid="viewport-diagnostic-fallback"
                  aria-label="Viewport diagnostic snapshot fallback"
                  readOnly
                  value={text}
                  onFocus={event => event.currentTarget.select()}
                  style={{
                    pointerEvents: 'auto',
                    display: 'block',
                    width: '100%',
                    height: 120,
                    marginTop: 8,
                    resize: 'vertical',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: 9.5,
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
      <div
        data-testid="viewport-diagnostic-safe-area"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          padding: 'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)',
          pointerEvents: 'none',
          visibility: 'hidden',
        }}
      />
    </>,
    document.body,
  );
}
