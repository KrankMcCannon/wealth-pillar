const SCROLL_Y_KEY = 'wealth-pillar:reports-scroll-y';
const GROUPS_OPEN_KEY = 'wealth-pillar:reports-period-groups-open';

function writeSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* private mode / quota */
  }
}

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function removeSession(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}

export function saveReportsScrollY(y: number = globalThis.window?.scrollY ?? 0): void {
  writeSession(SCROLL_Y_KEY, String(y));
}

export function consumeReportsScrollY(): number | null {
  const raw = readSession(SCROLL_Y_KEY);
  removeSession(SCROLL_Y_KEY);
  if (raw == null) return null;
  const y = Number(raw);
  return Number.isFinite(y) && y >= 0 ? y : null;
}

export function restoreReportsScrollY(): void {
  const y = consumeReportsScrollY();
  if (y == null || typeof globalThis.window?.scrollTo !== 'function') return;
  const restore = () => {
    globalThis.window.scrollTo({ top: y, left: 0, behavior: 'auto' });
  };
  restore();
  // Next.js may reset scroll after paint; replay once on the next frame.
  globalThis.window.requestAnimationFrame(restore);
}

export function readPeriodGroupsOpen(): Record<string, boolean> {
  const raw = readSession(GROUPS_OPEN_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const next: Record<string, boolean> = {};
    for (const [id, open] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof open === 'boolean') next[id] = open;
    }
    return next;
  } catch {
    return {};
  }
}

export function writePeriodGroupsOpen(state: Record<string, boolean>): void {
  writeSession(GROUPS_OPEN_KEY, JSON.stringify(state));
}

export function isPeriodGroupOpen(userId: string, stored: Record<string, boolean>): boolean {
  if (Object.hasOwn(stored, userId)) return stored[userId]!;
  return false;
}
