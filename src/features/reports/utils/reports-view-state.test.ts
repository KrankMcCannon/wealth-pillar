import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  consumeReportsScrollY,
  isPeriodGroupOpen,
  readPeriodGroupsOpen,
  restoreReportsScrollY,
  saveReportsScrollY,
  writePeriodGroupsOpen,
} from './reports-view-state';

afterEach(() => {
  sessionStorage.clear();
});

describe('reports view state', () => {
  it('saves scroll once and consumes it', () => {
    saveReportsScrollY(420);
    expect(consumeReportsScrollY()).toBe(420);
    expect(consumeReportsScrollY()).toBeNull();
  });

  it('restores window scroll from the saved position', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    saveReportsScrollY(180);
    restoreReportsScrollY();
    expect(scrollTo).toHaveBeenCalledWith({ top: 180, left: 0, behavior: 'auto' });
    expect(consumeReportsScrollY()).toBeNull();
    scrollTo.mockRestore();
  });

  it('persists which person groups are open', () => {
    writePeriodGroupsOpen({ u1: true, u2: false });
    expect(readPeriodGroupsOpen()).toEqual({ u1: true, u2: false });
  });

  it('keeps every person collapsed unless stored otherwise', () => {
    expect(isPeriodGroupOpen('u1', {})).toBe(false);
    expect(isPeriodGroupOpen('u2', {})).toBe(false);
    expect(isPeriodGroupOpen('u2', { u2: true })).toBe(true);
  });
});
