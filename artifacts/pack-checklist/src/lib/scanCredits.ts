const FREE_CREDITS = 3;

const key = (userId: string) => `scan-credits-${userId}`;

export function getScanCredits(userId: string): number {
  const stored = localStorage.getItem(key(userId));
  if (stored === null) return FREE_CREDITS; // first visit → 3 free
  return Math.max(0, parseInt(stored, 10) || 0);
}

/** Deducts 1 credit. Returns false if none remaining. */
export function useScanCredit(userId: string): boolean {
  const current = getScanCredits(userId);
  if (current <= 0) return false;
  localStorage.setItem(key(userId), String(current - 1));
  return true;
}

/** Ensures the key exists (call once on mount). */
export function initScanCredits(userId: string): void {
  if (localStorage.getItem(key(userId)) === null) {
    localStorage.setItem(key(userId), String(FREE_CREDITS));
  }
}
