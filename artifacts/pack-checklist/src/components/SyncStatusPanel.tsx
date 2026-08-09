/**
 * SyncStatusPanel.tsx — Prompt 022T
 *
 * A compact collapsible diagnostic row inside the Locker panel.
 *
 * Displays NON-SENSITIVE information only:
 *   - Cloud Sync status (Idle / Syncing / Error)
 *   - Local vs Server file counts
 *   - Last successful sync time
 *   - Build identifier (from Vite define — unique per build)
 *   - Server environment label
 *   - Account Sync ID (deterministic fingerprint of Clerk userId — not the raw ID)
 *   - [Sync Now] button
 *
 * Purpose: lets the user compare these values on desktop vs iPhone to pinpoint
 *   which layer differs (build, environment, account identity, or server data).
 *
 * NEVER displays:
 *   - raw Clerk userId / JWT / cookies
 *   - API keys or secrets
 *   - database URL
 *   - private Locker payloads
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { fetchLockerStatus, accountSyncId, type LockerStatus } from '../lib/lockerApi';

export type SyncStatusState = 'idle' | 'syncing' | 'error';

export interface SyncProps {
  userId?: string;
  syncStatus: SyncStatusState;
  serverCount: number | null;
  /** Injected by LockerPanel from entries.length — optional in parent callers. */
  localCount?: number;
  lastSyncTime: number | null;
  syncError: string | null;
  onSyncNow: () => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit',
  });
}

export function SyncStatusPanel({
  userId,
  syncStatus,
  serverCount,
  localCount = 0,
  lastSyncTime,
  syncError,
  onSyncNow,
}: SyncProps) {
  const [open, setOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<LockerStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Fetch /api/locker/status once when the panel is opened (or on userId change).
  useEffect(() => {
    if (!open || !userId) return;
    setStatusError(null);
    fetchLockerStatus()
      .then(s => setServerStatus(s))
      .catch(err => {
        setStatusError('Status unavailable');
        console.error('[SyncStatusPanel] fetchLockerStatus failed:', err instanceof Error ? err.message : String(err));
      });
  }, [open, userId]);

  const fingerprint = userId ? accountSyncId(userId) : '—';

  const statusIcon = syncStatus === 'syncing'
    ? <Loader2 className="w-3 h-3 animate-spin text-primary" />
    : syncStatus === 'error'
      ? <CloudOff className="w-3 h-3 text-destructive" />
      : <Cloud className="w-3 h-3 text-green-600 dark:text-green-400" />;

  const statusLabel = syncStatus === 'syncing' ? 'Syncing…'
    : syncStatus === 'error' ? 'Error'
    : lastSyncTime ? `Synced ${formatTime(lastSyncTime)}`
    : 'Idle';

  return (
    <div className="border-t border-border">
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/20 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 flex-1 min-w-0">
          {statusIcon}
          <span className="text-[11px] font-medium text-muted-foreground">
            Cloud Sync
          </span>
          <span className={`text-[10px] ml-1 ${
            syncStatus === 'error' ? 'text-destructive' :
            syncStatus === 'syncing' ? 'text-primary' :
            lastSyncTime ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
          }`}>
            {statusLabel}
          </span>
        </span>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">
          {localCount}L / {serverCount !== null ? `${serverCount}S` : '?S'}
        </span>
        {open
          ? <ChevronUp className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        }
      </button>

      {/* Expanded details */}
      {open && (
        <div className="px-4 pb-3 flex flex-col gap-1.5 bg-muted/10">
          {/* Counts */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Local Files</span>
            <span className="font-mono font-medium text-foreground">{localCount}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Server Files</span>
            <span className="font-mono font-medium text-foreground">
              {serverCount !== null ? serverCount : '—'}
            </span>
          </div>
          {lastSyncTime && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Last Sync</span>
              <span className="font-mono font-medium text-foreground">{formatTime(lastSyncTime)}</span>
            </div>
          )}
          {!lastSyncTime && !syncError && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Last Sync</span>
              <span className="font-mono text-muted-foreground">Never</span>
            </div>
          )}
          {syncError && (
            <div className="text-[10px] text-destructive break-words">{syncError}</div>
          )}

          <div className="border-t border-border/50 my-0.5" />

          {/* Build */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Build</span>
            <span className="font-mono text-foreground">{typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : '—'}</span>
          </div>

          {/* Server build */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Server Build</span>
            <span className="font-mono text-foreground">
              {serverStatus ? serverStatus.serverBuild : statusError ? '—' : '…'}
            </span>
          </div>

          {/* Environment */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Environment</span>
            <span className="font-mono text-foreground">
              {serverStatus ? serverStatus.environment : statusError ? '—' : '…'}
            </span>
          </div>

          {/* Host */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Host</span>
            <span className="font-mono text-foreground truncate max-w-[120px]" title={window.location.hostname}>
              {window.location.hostname}
            </span>
          </div>

          {/* Account Sync ID — fingerprint only, no raw userId */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Account Sync ID</span>
            <span className={`font-mono font-semibold ${userId ? 'text-foreground' : 'text-muted-foreground'}`}>
              {fingerprint}
            </span>
          </div>

          <div className="border-t border-border/50 my-0.5" />

          {/* Sync Now button */}
          <button
            onClick={() => { onSyncNow(); }}
            disabled={syncStatus === 'syncing' || !userId}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed text-primary text-[11px] font-medium transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {syncStatus === 'syncing' ? 'Syncing…' : 'Sync Now'}
          </button>

          {statusError && (
            <p className="text-[9px] text-muted-foreground text-center">{statusError}</p>
          )}
        </div>
      )}
    </div>
  );
}
