/**
 * HikerAnimation — original animated silhouette of a gender-neutral thru-hiker
 * and their dog, walking horizontally across the showcase background.
 *
 * All artwork is original, created for TrailWeigh. No external images or APIs.
 * aria-hidden="true" — decorative only.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── CSS injection (once per page load) ───────────────────────────────────────

const STYLE_ID = 'tw-hiker-styles';
const SHOWCASE_CSS = `
/* ── TrailWeigh hiker & dog walking animations ─────────────────────────── */

/* Hiker limb swing */
@keyframes tw-leg-l {
  0%, 100% { transform: rotate(-14deg); }
  50%       { transform: rotate(14deg); }
}
@keyframes tw-leg-r {
  0%, 100% { transform: rotate(14deg); }
  50%       { transform: rotate(-14deg); }
}
@keyframes tw-arm-l {
  0%, 100% { transform: rotate(11deg); }
  50%       { transform: rotate(-11deg); }
}
@keyframes tw-arm-r {
  0%, 100% { transform: rotate(-11deg); }
  50%       { transform: rotate(11deg); }
}
@keyframes tw-body-bob {
  0%, 50%, 100% { transform: translateY(0px); }
  25%, 75%      { transform: translateY(-1.5px); }
}
@keyframes tw-pack-sway {
  0%, 50%, 100% { transform: rotate(0deg); }
  25%           { transform: rotate(-1deg); }
  75%           { transform: rotate(1deg); }
}

/* Dog limb animations */
@keyframes tw-dog-leg-fl {
  0%, 100% { transform: rotate(-11deg); }
  50%       { transform: rotate(11deg); }
}
@keyframes tw-dog-leg-fr {
  0%, 100% { transform: rotate(11deg); }
  50%       { transform: rotate(-11deg); }
}
@keyframes tw-dog-leg-rl {
  0%, 100% { transform: rotate(11deg); }
  50%       { transform: rotate(-11deg); }
}
@keyframes tw-dog-leg-rr {
  0%, 100% { transform: rotate(-11deg); }
  50%       { transform: rotate(11deg); }
}
@keyframes tw-dog-tail {
  0%, 100% { transform: rotate(-5deg); }
  50%       { transform: rotate(22deg); }
}
@keyframes tw-dog-head-nod {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(1.5px); }
}
@keyframes tw-dog-bob {
  0%, 50%, 100% { transform: translateY(0px); }
  25%, 75%      { transform: translateY(-1.2px); }
}

/* Horizontal travel across viewport */
@keyframes tw-travel-ltr {
  from { transform: translate3d(calc(-100% - 220px), 0, 0); }
  to   { transform: translate3d(calc(100vw  + 220px), 0, 0); }
}
@keyframes tw-travel-rtl {
  from { transform: translate3d(calc(100vw  + 220px), 0, 0); }
  to   { transform: translate3d(calc(-100% - 220px), 0, 0); }
}

/* Applied classes */
.tw-walking .tw-leg-l  { transform-box: fill-box; transform-origin: 50% 0%; animation: tw-leg-l  1.15s ease-in-out infinite; }
.tw-walking .tw-leg-r  { transform-box: fill-box; transform-origin: 50% 0%; animation: tw-leg-r  1.15s ease-in-out infinite; }
.tw-walking .tw-arm-l  { transform-box: fill-box; transform-origin: 50% 0%; animation: tw-arm-l  1.15s ease-in-out infinite; }
.tw-walking .tw-arm-r  { transform-box: fill-box; transform-origin: 50% 0%; animation: tw-arm-r  1.15s ease-in-out infinite; }
.tw-walking .tw-body   { animation: tw-body-bob 0.575s ease-in-out infinite; }
.tw-walking .tw-pack   { transform-box: fill-box; transform-origin: 50% 50%; animation: tw-pack-sway 1.15s ease-in-out infinite; }

.tw-walking .tw-dog-leg-fl { transform-box: fill-box; transform-origin: 50% 0%; animation: tw-dog-leg-fl 0.9s ease-in-out infinite; }
.tw-walking .tw-dog-leg-fr { transform-box: fill-box; transform-origin: 50% 0%; animation: tw-dog-leg-fr 0.9s ease-in-out infinite; }
.tw-walking .tw-dog-leg-rl { transform-box: fill-box; transform-origin: 50% 0%; animation: tw-dog-leg-rl 0.9s ease-in-out infinite; }
.tw-walking .tw-dog-leg-rr { transform-box: fill-box; transform-origin: 50% 0%; animation: tw-dog-leg-rr 0.9s ease-in-out infinite; }
.tw-walking .tw-dog-tail   { transform-box: fill-box; transform-origin: 100% 0%; animation: tw-dog-tail 0.7s ease-in-out infinite; }
.tw-walking .tw-dog-head   { animation: tw-dog-head-nod 1.15s ease-in-out infinite; }
.tw-walking .tw-dog-body   { animation: tw-dog-bob 0.575s ease-in-out infinite; }

/* Travel animations (applied to the outer wrapper div) */
.tw-travel-ltr { animation: tw-travel-ltr 35s linear forwards; }
.tw-travel-rtl { animation: tw-travel-rtl 35s linear forwards; }

/* Reduced-motion: suppress all movement */
@media (prefers-reduced-motion: reduce) {
  .tw-walking *,
  .tw-travel-ltr,
  .tw-travel-rtl {
    animation: none !important;
    transform: none !important;
  }
}
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id   = STYLE_ID;
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

// ── Travel state ──────────────────────────────────────────────────────────────

interface TravelState {
  dir: 'ltr' | 'rtl';
  key: number;
  traveling: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface HikerAnimationProps {
  active: boolean;
}

export function HikerAnimation({ active }: HikerAnimationProps) {
  const reduced  = usePrefersReducedMotion();
  const pauseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [travel, setTravel] = useState<TravelState | null>(null);

  // Inject CSS once
  useEffect(() => { ensureStyles(); }, []);

  // Start / stop travel based on active + reduced-motion
  useEffect(() => {
    if (!active || reduced) {
      setTravel(null);
      if (pauseRef.current) { clearTimeout(pauseRef.current); pauseRef.current = null; }
      return;
    }
    setTravel({ dir: 'ltr', key: 0, traveling: true });
    return () => {
      setTravel(null);
      if (pauseRef.current) { clearTimeout(pauseRef.current); pauseRef.current = null; }
    };
  }, [active, reduced]);

  // After a TRAVEL pass ends: pause, flip direction, restart.
  // Guard: only act when the animationName is the travel animation — child
  // walking animations (body-bob, leg-swing, etc.) also bubble animationend
  // and would otherwise fire this handler ~0.5 s into every pass.
  const handleTravelEnd = useCallback((e: React.AnimationEvent<HTMLDivElement>) => {
    if (!e.animationName.startsWith('tw-travel-')) return;
    setTravel(prev => {
      if (!prev) return null;
      return { ...prev, traveling: false };
    });
    pauseRef.current = setTimeout(() => {
      setTravel(prev => {
        if (!prev) return null;
        return {
          dir: prev.dir === 'ltr' ? 'rtl' : 'ltr',
          key: prev.key + 1,
          traveling: true,
        };
      });
    }, 7000); // ~7-second pause off-screen before re-entering
  }, []);

  const FILL = '#1c1c1c';
  const STROKE = '#1c1c1c';
  const walking = active && !reduced;

  return (
    /* Position near viewport bottom inside the showcase overlay */
    <div
      style={{
        position: 'absolute',
        bottom: '5%',
        left: 0,
        width: '100%',
        height: 'clamp(80px, 15vh, 140px)',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {/* Travel wrapper — key forces CSS animation restart on each new pass */}
      <div
        key={travel?.key ?? -1}
        className={travel?.traveling ? `tw-travel-${travel.dir}` : undefined}
        onAnimationEnd={handleTravelEnd}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          display: 'inline-block',
          visibility: travel?.traveling ? 'visible' : 'hidden',
        }}
      >
        {/* ── SVG silhouette ───────────────────────────────────────────── */}
        <svg
          viewBox="0 0 230 100"
          height="100%"
          style={{
            height: 'clamp(80px, 15vh, 140px)',
            width: 'auto',
            display: 'block',
            // Mirror horizontally when travelling right-to-left
            transform: travel?.dir === 'rtl' ? 'scaleX(-1)' : undefined,
            // Subtle shadow for visibility on both light and dark backgrounds
            filter:
              'drop-shadow(0 2px 4px rgba(0,0,0,0.75))' +
              ' drop-shadow(0 0 8px rgba(255,255,255,0.12))',
          }}
          aria-hidden="true"
          className={walking ? 'tw-walking' : undefined}
        >

          {/* ── LEASH (drawn first so it appears behind figures) ───────── */}
          <path
            d="M44,44 Q100,28 166,65"
            fill="none"
            stroke={STROKE}
            strokeWidth="1.4"
            strokeOpacity="0.6"
            strokeDasharray="5,3"
            strokeLinecap="round"
          />

          {/* ════════════════════════════════════════════════════════════ */}
          {/* HIKER                                                        */}
          {/* ════════════════════════════════════════════════════════════ */}

          {/* Backpack (behind torso; drawn first) */}
          <g className="tw-pack">
            {/* Lid */}
            <rect x="29" y="16" width="15" height="6"  rx="3"  fill={FILL} />
            {/* Main body */}
            <rect x="28" y="21" width="19" height="28" rx="5"  fill={FILL} />
            {/* Hip-belt wing */}
            <rect x="29" y="47" width="14" height="5"  rx="2.5" fill={FILL} />
          </g>

          {/* Torso */}
          <g className="tw-body">
            {/* Head */}
            <circle cx="55" cy="11" r="8.5" fill={FILL} />
            {/* Neck */}
            <rect   x="51" y="18"  width="8"  height="5"  rx="2" fill={FILL} />
            {/* Torso */}
            <path   d="M46,23 L66,23 L64,53 L48,53 Z"             fill={FILL} />
            {/* Hips */}
            <rect   x="47" y="51"  width="17" height="7"  rx="3"  fill={FILL} />
          </g>

          {/* Left arm (goes back while right leg goes forward) */}
          <g className="tw-arm-l">
            <rect x="40" y="27" width="7" height="21" rx="3.5" fill={FILL} />
          </g>

          {/* Right arm (goes forward) */}
          <g className="tw-arm-r">
            <rect x="65" y="27" width="7" height="21" rx="3.5" fill={FILL} />
          </g>

          {/* Trekking poles (subtle lines held in each hand) */}
          {/* Right pole */}
          <line x1="71" y1="46" x2="81" y2="93"
                stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
          {/* Left pole */}
          <line x1="42" y1="46" x2="30" y2="93"
                stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />

          {/* Left leg */}
          <g className="tw-leg-l">
            {/* Upper leg */}
            <rect x="47" y="57" width="9" height="24" rx="4"   fill={FILL} />
            {/* Lower leg (slight offset for knee) */}
            <rect x="45" y="79" width="8" height="16" rx="4"   fill={FILL} />
            {/* Foot */}
            <ellipse cx="47" cy="94" rx="9" ry="3.5"           fill={FILL} />
          </g>

          {/* Right leg */}
          <g className="tw-leg-r">
            {/* Upper leg */}
            <rect x="57" y="57" width="9" height="24" rx="4"   fill={FILL} />
            {/* Lower leg */}
            <rect x="57" y="79" width="8" height="16" rx="4"   fill={FILL} />
            {/* Foot */}
            <ellipse cx="62" cy="94" rx="9" ry="3.5"           fill={FILL} />
          </g>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* DOG                                                          */}
          {/* ════════════════════════════════════════════════════════════ */}

          {/* Dog body */}
          <g className="tw-dog-body">
            {/* Body */}
            <ellipse cx="152" cy="79" rx="24" ry="12" fill={FILL} />
            {/* Neck connecting body to head */}
            <ellipse cx="176" cy="71" rx="11"  ry="7"  fill={FILL} />
          </g>

          {/* Dog tail (at rear/left of body) */}
          <g className="tw-dog-tail">
            <path
              d="M129,73 Q116,56 121,44"
              fill="none"
              stroke={STROKE}
              strokeWidth="5.5"
              strokeLinecap="round"
            />
          </g>

          {/* Dog head */}
          <g className="tw-dog-head">
            {/* Skull */}
            <circle cx="184" cy="62" r="12" fill={FILL} />
            {/* Floppy ear (hangs from top-right side of head, facing right) */}
            <path
              d="M188,51 Q200,48 198,62 Q193,70 186,66 Q182,61 185,55 Z"
              fill={FILL}
            />
            {/* Muzzle/snout */}
            <ellipse cx="196" cy="66" rx="8" ry="6" fill={FILL} />
            {/* Nose */}
            <circle cx="203" cy="64" r="2.5" fill={FILL} />
          </g>

          {/* Dog front-left leg */}
          <g className="tw-dog-leg-fl">
            <rect x="136" y="88" width="6" height="12" rx="3" fill={FILL} />
            <ellipse cx="139" cy="100" rx="5" ry="2.5"        fill={FILL} />
          </g>
          {/* Dog front-right leg (slightly behind) */}
          <g className="tw-dog-leg-fr">
            <rect x="143" y="88" width="6" height="12" rx="3" fill={FILL} />
            <ellipse cx="146" cy="100" rx="5" ry="2.5"        fill={FILL} />
          </g>
          {/* Dog back-left leg */}
          <g className="tw-dog-leg-rl">
            <rect x="160" y="88" width="6" height="12" rx="3" fill={FILL} />
            <ellipse cx="163" cy="100" rx="5" ry="2.5"        fill={FILL} />
          </g>
          {/* Dog back-right leg */}
          <g className="tw-dog-leg-rr">
            <rect x="167" y="88" width="6" height="12" rx="3" fill={FILL} />
            <ellipse cx="170" cy="100" rx="5" ry="2.5"        fill={FILL} />
          </g>

        </svg>
      </div>
    </div>
  );
}
