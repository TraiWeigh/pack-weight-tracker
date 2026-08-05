/**
 * HikerAnimation — animated silhouette of a gender-neutral thru-hiker and dog
 * walking across the Showcase background. Renders as its own position:fixed
 * layer (z-index 9991) so it is never inside a div whose opacity transitions.
 *
 * All artwork is original — no external images, GIFs, or paid APIs.
 * aria-hidden="true" — decorative only.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── CSS injection (once per page-load) ───────────────────────────────────────

const STYLE_ID = 'tw-hiker-styles';

const SHOWCASE_CSS = `
/* ── TrailWeigh hiker & dog walking animations ──────────────────────────── */

/* Hiker limbs */
@keyframes tw-leg-l  { 0%,100%{transform:rotate(-18deg);}  50%{transform:rotate(18deg);}  }
@keyframes tw-leg-r  { 0%,100%{transform:rotate(18deg);}   50%{transform:rotate(-18deg);} }
@keyframes tw-arm-l  { 0%,100%{transform:rotate(14deg);}   50%{transform:rotate(-14deg);} }
@keyframes tw-arm-r  { 0%,100%{transform:rotate(-14deg);}  50%{transform:rotate(14deg);}  }
@keyframes tw-body-bob    { 0%,50%,100%{transform:translateY(0);}    25%,75%{transform:translateY(-2px);} }
@keyframes tw-pack-sway   { 0%,50%,100%{transform:rotate(0deg);}     25%{transform:rotate(-1.5deg);} 75%{transform:rotate(1.5deg);} }

/* Dog limbs */
@keyframes tw-dog-leg-fl  { 0%,100%{transform:rotate(-15deg);} 50%{transform:rotate(15deg);}  }
@keyframes tw-dog-leg-fr  { 0%,100%{transform:rotate(15deg);}  50%{transform:rotate(-15deg);} }
@keyframes tw-dog-leg-rl  { 0%,100%{transform:rotate(15deg);}  50%{transform:rotate(-15deg);} }
@keyframes tw-dog-leg-rr  { 0%,100%{transform:rotate(-15deg);} 50%{transform:rotate(15deg);}  }
@keyframes tw-dog-tail    { 0%,100%{transform:rotate(-10deg);} 50%{transform:rotate(30deg);}  }
@keyframes tw-dog-bob     { 0%,50%,100%{transform:translateY(0);}    25%,75%{transform:translateY(-1.5px);} }
@keyframes tw-dog-head-nod{ 0%,100%{transform:translateY(0);}        50%{transform:translateY(2px);}       }

/* Apply walking animations via class on the SVG element */
.tw-walking .tw-leg-l     { transform-box:fill-box; transform-origin:50% 0%; animation:tw-leg-l     1.1s  ease-in-out infinite; }
.tw-walking .tw-leg-r     { transform-box:fill-box; transform-origin:50% 0%; animation:tw-leg-r     1.1s  ease-in-out infinite; }
.tw-walking .tw-arm-l     { transform-box:fill-box; transform-origin:50% 0%; animation:tw-arm-l     1.1s  ease-in-out infinite; }
.tw-walking .tw-arm-r     { transform-box:fill-box; transform-origin:50% 0%; animation:tw-arm-r     1.1s  ease-in-out infinite; }
.tw-walking .tw-body      { animation:tw-body-bob   0.55s ease-in-out infinite; }
.tw-walking .tw-pack      { transform-box:fill-box; transform-origin:50% 50%; animation:tw-pack-sway 1.1s  ease-in-out infinite; }
.tw-walking .tw-dog-leg-fl{ transform-box:fill-box; transform-origin:50% 0%; animation:tw-dog-leg-fl 0.85s ease-in-out infinite; }
.tw-walking .tw-dog-leg-fr{ transform-box:fill-box; transform-origin:50% 0%; animation:tw-dog-leg-fr 0.85s ease-in-out infinite; }
.tw-walking .tw-dog-leg-rl{ transform-box:fill-box; transform-origin:50% 0%; animation:tw-dog-leg-rl 0.85s ease-in-out infinite; }
.tw-walking .tw-dog-leg-rr{ transform-box:fill-box; transform-origin:50% 0%; animation:tw-dog-leg-rr 0.85s ease-in-out infinite; }
.tw-walking .tw-dog-tail  { transform-box:fill-box; transform-origin:100% 0%; animation:tw-dog-tail  0.7s  ease-in-out infinite; }
.tw-walking .tw-dog-body  { animation:tw-dog-bob    0.55s ease-in-out infinite; }
.tw-walking .tw-dog-head  { animation:tw-dog-head-nod 1.1s ease-in-out infinite; }

/* Horizontal travel.
   Fixed-pixel offsets are used (NOT calc(-100%-…)) so the animation does not
   depend on the element's own width being computed before the keyframe resolves. */
@keyframes tw-travel-ltr {
  from { transform: translateX(-450px); }
  to   { transform: translateX(calc(100vw + 450px)); }
}
@keyframes tw-travel-rtl {
  from { transform: translateX(calc(100vw + 450px)); }
  to   { transform: translateX(-450px); }
}
.tw-travel-ltr { animation: tw-travel-ltr 38s linear forwards; }
.tw-travel-rtl { animation: tw-travel-rtl 38s linear forwards; }

/* Reduced-motion: suppress only when the media query is actually active */
@media (prefers-reduced-motion: reduce) {
  .tw-walking .tw-leg-l, .tw-walking .tw-leg-r,
  .tw-walking .tw-arm-l, .tw-walking .tw-arm-r,
  .tw-walking .tw-body,  .tw-walking .tw-pack,
  .tw-walking .tw-dog-leg-fl, .tw-walking .tw-dog-leg-fr,
  .tw-walking .tw-dog-leg-rl, .tw-walking .tw-dog-leg-rr,
  .tw-walking .tw-dog-tail,   .tw-walking .tw-dog-body,
  .tw-walking .tw-dog-head    { animation:none !important; transform:none !important; }
  .tw-travel-ltr, .tw-travel-rtl { animation:none !important; transform:none !important; }
}
`;

function ensureStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = SHOWCASE_CSS;
  document.head.appendChild(el);
}

// ── Reduced-motion hook ───────────────────────────────────────────────────────

function usePrefersReducedMotion() {
  const mq = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const [reduced, setReduced] = useState(mq?.matches ?? false);
  useEffect(() => {
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return reduced;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface TravelPass { dir: 'ltr' | 'rtl'; key: number; }
interface HikerAnimationProps { active: boolean; }

// ── SVG silhouette ────────────────────────────────────────────────────────────

const FILL   = '#1a1a1a';
const STROKE = '#1a1a1a';

function Silhouette({ dir, walking }: { dir: 'ltr' | 'rtl'; walking: boolean }) {
  return (
    <svg
      viewBox="0 0 230 108"
      style={{
        height:   'clamp(90px, 15vh, 190px)',
        width:    'auto',
        display:  'block',
        overflow: 'visible',
        // Mirror horizontally when going right-to-left
        transform: dir === 'rtl' ? 'scaleX(-1)' : undefined,
        // Drop shadow keeps silhouette readable on both light and dark backgrounds
        filter: [
          'drop-shadow(0 2px 6px rgba(0,0,0,0.85))',
          'drop-shadow(0 0 14px rgba(255,255,255,0.18))',
        ].join(' '),
      }}
      aria-hidden="true"
      className={walking ? 'tw-walking' : undefined}
      overflow="visible"
    >
      {/* ── Leash (drawn first — behind both figures) ──────────────────────── */}
      <path
        d="M44,44 Q98,26 163,65"
        fill="none"
        stroke={STROKE}
        strokeWidth="1.6"
        strokeOpacity="0.65"
        strokeDasharray="5,3"
        strokeLinecap="round"
      />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* HIKER                                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* Backpack — behind torso, drawn first */}
      <g className="tw-pack">
        {/* Lid */}
        <rect x="29" y="15" width="15" height="7"  rx="3"   fill={FILL} />
        {/* Main body */}
        <rect x="28" y="21" width="19" height="29" rx="5"   fill={FILL} />
        {/* Hip-belt */}
        <rect x="29" y="48" width="14" height="5"  rx="2.5" fill={FILL} />
      </g>

      {/* Torso, head, neck, hips — bob together */}
      <g className="tw-body">
        {/* Head */}
        <circle cx="55" cy="10" r="9"             fill={FILL} />
        {/* Neck */}
        <rect   x="51" y="18"  width="8"  height="5" rx="2" fill={FILL} />
        {/* Torso */}
        <path   d="M46,23 L66,23 L64,54 L48,54 Z"          fill={FILL} />
        {/* Hips */}
        <rect   x="47" y="52" width="17" height="7"  rx="3" fill={FILL} />
      </g>

      {/* Left arm */}
      <g className="tw-arm-l">
        <rect x="40" y="26" width="7" height="22" rx="3.5" fill={FILL} />
      </g>

      {/* Right arm */}
      <g className="tw-arm-r">
        <rect x="65" y="26" width="7" height="22" rx="3.5" fill={FILL} />
      </g>

      {/* Trekking poles */}
      <line x1="71" y1="46" x2="82" y2="98" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="46" x2="29" y2="98" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />

      {/* Left leg */}
      <g className="tw-leg-l">
        <rect    x="47" y="58" width="9"  height="23" rx="4"   fill={FILL} />
        <rect    x="45" y="79" width="8"  height="17" rx="4"   fill={FILL} />
        <ellipse cx="47" cy="96" rx="9" ry="4"                 fill={FILL} />
      </g>

      {/* Right leg */}
      <g className="tw-leg-r">
        <rect    x="57" y="58" width="9"  height="23" rx="4"   fill={FILL} />
        <rect    x="57" y="79" width="8"  height="17" rx="4"   fill={FILL} />
        <ellipse cx="62" cy="96" rx="9" ry="4"                 fill={FILL} />
      </g>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* DOG                                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* Body + neck bob together */}
      <g className="tw-dog-body">
        <ellipse cx="152" cy="79" rx="25" ry="13" fill={FILL} />
        {/* Neck */}
        <ellipse cx="175" cy="70" rx="11"  ry="8"  fill={FILL} />
      </g>

      {/* Tail */}
      <g className="tw-dog-tail">
        <path
          d="M128,72 Q115,54 120,42"
          fill="none"
          stroke={STROKE}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>

      {/* Head */}
      <g className="tw-dog-head">
        {/* Skull */}
        <circle cx="184" cy="61" r="12"  fill={FILL} />
        {/* Floppy ear */}
        <path
          d="M188,50 Q201,47 199,62 Q194,71 186,67 Q182,61 185,54 Z"
          fill={FILL}
        />
        {/* Muzzle */}
        <ellipse cx="196" cy="66" rx="8" ry="6" fill={FILL} />
        {/* Nose */}
        <circle  cx="203" cy="64" r="2.5"       fill={FILL} />
      </g>

      {/* Front-left leg */}
      <g className="tw-dog-leg-fl">
        <rect    x="136" y="89" width="6"  height="13" rx="3" fill={FILL} />
        <ellipse cx="139" cy="103" rx="5.5" ry="3"           fill={FILL} />
      </g>
      {/* Front-right leg */}
      <g className="tw-dog-leg-fr">
        <rect    x="143" y="89" width="6"  height="13" rx="3" fill={FILL} />
        <ellipse cx="146" cy="103" rx="5.5" ry="3"           fill={FILL} />
      </g>
      {/* Back-left leg */}
      <g className="tw-dog-leg-rl">
        <rect    x="160" y="89" width="6"  height="13" rx="3" fill={FILL} />
        <ellipse cx="163" cy="103" rx="5.5" ry="3"           fill={FILL} />
      </g>
      {/* Back-right leg */}
      <g className="tw-dog-leg-rr">
        <rect    x="167" y="89" width="6"  height="13" rx="3" fill={FILL} />
        <ellipse cx="170" cy="103" rx="5.5" ry="3"           fill={FILL} />
      </g>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HikerAnimation({ active }: HikerAnimationProps) {
  const reduced  = usePrefersReducedMotion();
  const pauseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the "next pass" direction+key without closure stale-state issues
  const nextRef  = useRef<TravelPass>({ dir: 'ltr', key: 0 });
  const [travelPass, setTravelPass] = useState<TravelPass | null>(null);

  // Inject CSS once on mount
  useEffect(() => { ensureStyles(); }, []);

  // Start / restart travel when active; clean up when inactive or on unmount
  useEffect(() => {
    if (!active || reduced) {
      setTravelPass(null);
      if (pauseRef.current) { clearTimeout(pauseRef.current); pauseRef.current = null; }
      nextRef.current = { dir: 'ltr', key: 0 };
      return;
    }
    const first: TravelPass = { dir: 'ltr', key: 0 };
    nextRef.current = first;
    setTravelPass(first);
    return () => {
      setTravelPass(null);
      if (pauseRef.current) { clearTimeout(pauseRef.current); pauseRef.current = null; }
      nextRef.current = { dir: 'ltr', key: 0 };
    };
  }, [active, reduced]);

  // When a travel pass ends, wait 7 s then start the next pass in the other direction.
  // Guard: check animationName so bubbling events from infinite walking animations
  // (which fire animationiteration, not animationend) do not trigger early.
  const handleTravelEnd = useCallback((e: React.AnimationEvent<HTMLDivElement>) => {
    if (!e.animationName.startsWith('tw-travel-')) return;
    // Unmount current wrapper — figure is already off-screen at the end position
    setTravelPass(null);
    const nextDir = nextRef.current.dir === 'ltr' ? 'rtl' : 'ltr';
    const nextKey = nextRef.current.key + 1;
    nextRef.current = { dir: nextDir, key: nextKey };
    pauseRef.current = setTimeout(() => {
      setTravelPass({ dir: nextDir, key: nextKey });
    }, 7000);
  }, []);

  const walking = active && !reduced;

  return (
    // Own fixed layer — never inside an opacity-transitioning parent.
    // z-index 9991 places it above the background (9990) and below the
    // wake-event intercept (9992).
    <div
      aria-hidden="true"
      style={{
        position:      'fixed',
        bottom:        '5%',
        left:          0,
        width:         '100%',
        height:        'clamp(90px, 15vh, 190px)',
        zIndex:        9991,
        pointerEvents: 'none',
        overflow:      'visible',
        display:       active ? 'block' : 'none',
      }}
    >
      {/* ── Normal animation: travel across viewport ─────────────────────── */}
      {active && !reduced && travelPass && (
        <div
          key={travelPass.key}
          className={`tw-travel-${travelPass.dir}`}
          onAnimationEnd={handleTravelEnd}
          style={{
            position: 'absolute',
            bottom:   0,
            left:     0,
            display:  'inline-block',
          }}
        >
          <Silhouette dir={travelPass.dir} walking={walking} />
        </div>
      )}

      {/* ── Reduced-motion: static centered silhouette ───────────────────── */}
      {active && reduced && (
        <div style={{
          position:  'absolute',
          bottom:    0,
          left:      '50%',
          transform: 'translateX(-50%)',
        }}>
          <Silhouette dir="ltr" walking={false} />
        </div>
      )}
    </div>
  );
}
