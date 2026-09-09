import { describe, it, expect } from 'vitest';
import { stitchFab, stitchHome, stitchPageTabs, stitchReports } from './home-design-foundation';

describe('home-design-foundation stitch contracts', () => {
  it('keeps the page FAB on foreground fill', () => {
    expect(stitchFab.pageAdd).toContain('bg-foreground');
    expect(stitchFab.pageAdd).not.toContain('bg-primary');
  });

  it('keeps capsule page tabs rounded-full', () => {
    expect(stitchPageTabs.list).toContain('rounded-full');
    expect(stitchPageTabs.trigger).toContain('rounded-full');
  });

  it('aliases reports empty well to the home recipe', () => {
    expect(stitchReports.emptyWell).toBe(stitchHome.emptyWell);
  });
});
