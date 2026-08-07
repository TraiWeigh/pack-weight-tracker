/**
 * LockerDeleteDialog — password-verified deletion for Locker entries.
 *
 * Identity verification strategy (Clerk v6):
 *  • Email+password accounts:
 *      signIn.create({ strategy: 'password', identifier, password }) → check result.status === 'complete'
 *      setActive() is deliberately NOT called — we only verify, not replace the session.
 *  • OAuth-only accounts:
 *      signIn.sso({ strategy, redirectUrl, redirectCallbackUrl }) triggers a redirect.
 *      Pending IDs are stored in sessionStorage before the redirect; the host page reads
 *      them on return and completes the deletion.
 *  • Guest (no Clerk user): simple confirmation, no password required.
 *
 * Rate limiting: 5 consecutive failures → 30-second client-side lockout.
 * Clerk's own server-side limits apply on top of this.
 *
 * The password is NEVER stored between renders, in localStorage, sessionStorage,
 * analytics logs, or console output.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSignIn, useUser } from '@clerk/react';
import { Eye, EyeOff, Trash2, X, AlertCircle } from 'lucide-react';
import type { LockerEntry } from './LockerPanel';

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECS = 30;

/** sessionStorage key used to survive the OAuth redirect round-trip. Only entry IDs — never credentials. */
export const LOCKER_PENDING_DELETE_KEY      = 'tw-locker-pending-delete';
/** URL query param appended after a successful OAuth reauthentication redirect. */
export const LOCKER_DELETE_VERIFIED_PARAM   = 'locker_delete_verified';

// ── OAuth provider detection ──────────────────────────────────────────────────

type OAuthStrategy = 'oauth_google' | 'oauth_github' | 'oauth_apple';
interface OAuthInfo { strategy: OAuthStrategy; label: string; }

function detectOAuth(
  externalAccounts: Array<{ provider: string }> | undefined
): OAuthInfo | null {
  const p = externalAccounts?.[0]?.provider;
  if (p === 'google') return { strategy: 'oauth_google', label: 'Continue with Google' };
  if (p === 'github') return { strategy: 'oauth_github', label: 'Continue with GitHub' };
  if (p === 'apple')  return { strategy: 'oauth_apple',  label: 'Continue with Apple'  };
  if (p)              return { strategy: p as OAuthStrategy, label: 'Verify Your Identity' };
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface LockerDeleteDialogProps {
  /** Entries that will be deleted on successful verification. */
  entries: LockerEntry[];
  /** Called after the user's identity is verified. The host page performs the actual deletion. */
  onConfirmed: () => void;
  /** Called when the dialog is cancelled — nothing is deleted. */
  onCancel: () => void;
  /** When true, no authentication is available; show a simple confirm without a password field. */
  isGuest?: boolean;
}

export function LockerDeleteDialog({
  entries,
  onConfirmed,
  onCancel,
  isGuest = false,
}: LockerDeleteDialogProps) {
  // Clerk v6: useSignIn() returns { signIn: SignInFutureResource, errors, fetchStatus }
  const { signIn, fetchStatus } = useSignIn();
  const { user } = useUser();

  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [attempts,    setAttempts]    = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown,   setCountdown]   = useState(0);

  const dialogRef   = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // ── Autofocus ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => passwordRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, []);

  // ── Lockout countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const rem = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (rem <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setCountdown(0);
        setTimeout(() => passwordRef.current?.focus(), 60);
      } else {
        setCountdown(rem);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [lockedUntil]);

  // ── Derived auth state ────────────────────────────────────────────────────
  const signInReady  = fetchStatus === 'idle' && !!signIn;
  const hasPassword  = !isGuest && (user?.passwordEnabled !== false);
  const oauthInfo    = !isGuest && !hasPassword && user
    ? detectOAuth(user.externalAccounts as Array<{ provider: string }>)
    : null;
  const isLocked     = !!lockedUntil && Date.now() < lockedUntil;

  // ── Rate-limit helper ──────────────────────────────────────────────────────
  const recordFailure = useCallback(() => {
    setAttempts(prev => {
      const next = prev + 1;
      if (next >= MAX_ATTEMPTS) setLockedUntil(Date.now() + LOCKOUT_SECS * 1000);
      return next;
    });
    setPassword('');
    setTimeout(() => passwordRef.current?.focus(), 60);
  }, []);

  // ── Password verification via Clerk v6 ────────────────────────────────────
  const handlePasswordSubmit = useCallback(async () => {
    if (isLocked || loading || !signInReady || !signIn || !user) return;
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const emailAddress = user.primaryEmailAddress?.emailAddress ?? '';

      // Clerk v6: create() with strategy='password' verifies credentials against Clerk's
      // server. We do NOT call setActive() — this is verification only; the existing
      // session remains unchanged.
      const result = await signIn.create({
        strategy: 'password',
        identifier: emailAddress,
        password,
      });

      if (result.status === 'complete') {
        setPassword('');
        onConfirmed();
      } else {
        // Unexpected intermediate status (e.g. MFA required) — treat as unverified.
        setError('Identity could not be fully verified. Nothing was deleted.');
        recordFailure();
      }
    } catch (err: unknown) {
      // Wrong password → Clerk throws with err.errors[0].code === 'form_password_incorrect'
      const clerkErr = err as { errors?: Array<{ code?: string }> };
      const code = clerkErr?.errors?.[0]?.code ?? '';
      if (code === 'form_password_incorrect' || code.includes('password')) {
        setError('Incorrect password. Nothing was deleted.');
      } else {
        setError('Verification failed. Please try again.');
      }
      recordFailure();
    } finally {
      setLoading(false);
    }
  }, [isLocked, loading, signInReady, signIn, user, password, onConfirmed, recordFailure]);

  // ── OAuth redirect verification ───────────────────────────────────────────
  const handleOAuthVerify = useCallback(async () => {
    if (!signInReady || !signIn || !oauthInfo) return;

    // Store only IDs (no credentials) so the host page can complete deletion on return.
    sessionStorage.setItem(LOCKER_PENDING_DELETE_KEY, JSON.stringify(entries.map(e => e.id)));

    try {
      const base = window.location.href.split('?')[0];
      // Clerk v6: signIn.sso() replaces the old authenticateWithRedirect().
      // redirectUrl        → where to go after a successful OAuth sign-in
      // redirectCallbackUrl → where to go if the session needs more information
      await signIn.sso({
        strategy: oauthInfo.strategy,
        redirectUrl: `${base}?${LOCKER_DELETE_VERIFIED_PARAM}=1`,
        redirectCallbackUrl: base,
      });
    } catch {
      sessionStorage.removeItem(LOCKER_PENDING_DELETE_KEY);
      setError('Could not start identity verification. Please try again.');
    }
  }, [signInReady, signIn, oauthInfo, entries]);

  // ── Focus trap ────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onCancel(); return; }
    if (e.key !== 'Tab') return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = Array.from(
      el.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])')
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus(); e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus(); e.preventDefault();
    }
  }, [onCancel]);

  // ── Content strings ───────────────────────────────────────────────────────
  const isSingle = entries.length === 1;
  const nameList = entries.map(e => `"${e.name}"`).join(', ');
  const title = isSingle
    ? `Delete "${entries[0].name}"?`
    : `Delete ${entries.length} Locker files?`;

  const bodyText = isGuest
    ? (isSingle
        ? `"${entries[0].name}" will be permanently deleted. This cannot be undone.`
        : `These ${entries.length} files (${nameList}) will be permanently deleted. This cannot be undone.`)
    : (isSingle
        ? `Enter your TrailWeigh password to permanently delete ${nameList}.`
        : `Enter your TrailWeigh password to permanently delete these ${entries.length} files: ${nameList}.`);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ldel-title"
      aria-describedby="ldel-desc"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className="relative bg-card border border-card-border rounded-xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 p-2 rounded-full bg-destructive/10 flex-shrink-0"
            aria-hidden="true"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="ldel-title"
              className="text-sm font-semibold text-foreground leading-snug"
            >
              {title}
            </h2>
            <p
              id="ldel-desc"
              className="mt-1 text-xs text-muted-foreground leading-relaxed"
            >
              {bodyText}
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cancel deletion"
            className="flex-shrink-0 text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Password field — email+password accounts only */}
        {hasPassword && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ldel-pwd" className="text-xs font-semibold text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                id="ldel-pwd"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                disabled={isLocked || loading}
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-describedby={error || isLocked ? 'ldel-error' : undefined}
                className="w-full text-sm border border-border rounded-lg px-3 py-2.5 pr-10 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* OAuth verify button — federated-login accounts only */}
        {oauthInfo && (
          <button
            onClick={handleOAuthVerify}
            disabled={loading || !signInReady}
            className="w-full text-sm font-semibold border border-border rounded-lg px-4 py-2.5 hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            {oauthInfo.label}
          </button>
        )}

        {/* Error / lockout message */}
        {(error || isLocked) && (
          <div
            id="ldel-error"
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 text-xs text-destructive"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {isLocked
                ? `Too many incorrect attempts. Try again in ${countdown} second${countdown !== 1 ? 's' : ''}.`
                : error}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg border border-border hover:bg-muted/40 transition-colors"
          >
            Cancel
          </button>

          {/* Password submit */}
          {hasPassword && (
            <button
              onClick={handlePasswordSubmit}
              disabled={isLocked || loading || !password.trim() || !signInReady}
              aria-label="Verify password and permanently delete"
              className="text-sm font-semibold bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
            >
              {loading && (
                <span
                  className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
              )}
              Permanently Delete
            </button>
          )}

          {/* Guest simple confirm */}
          {isGuest && (
            <button
              onClick={onConfirmed}
              className="text-sm font-semibold bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
