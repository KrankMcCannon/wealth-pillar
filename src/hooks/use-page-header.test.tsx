import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useDashboardHeaderStore } from '@/components/layout/dashboard-header-store';
import { usePageHeader } from './use-page-header';

function Probe({
  title,
  showBack,
  backHref,
}: {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}) {
  usePageHeader({
    ...(title !== undefined ? { title } : {}),
    ...(showBack !== undefined ? { showBack } : {}),
    ...(backHref !== undefined ? { backHref } : {}),
  });
  return null;
}

describe('usePageHeader', () => {
  beforeEach(() => {
    useDashboardHeaderStore.setState(useDashboardHeaderStore.getInitialState(), true);
  });

  it('keeps the title when backHref is stable across rerenders', () => {
    const reset = vi.fn();
    useDashboardHeaderStore.setState({ resetHeader: reset });

    const { rerender } = render(
      <Probe title="Period" showBack={true} backHref="/reports" />
    );
    expect(useDashboardHeaderStore.getState().config.title).toBe('Period');
    expect(reset).not.toHaveBeenCalled();

    rerender(<Probe title="Period" showBack={true} backHref="/reports" />);
    expect(reset).not.toHaveBeenCalled();
    expect(useDashboardHeaderStore.getState().config.backHref).toBe('/reports');
  });

  it('keeps the last title on unmount so Suspense fallbacks do not flash the app name', () => {
    const { unmount } = render(<Probe title="Period" showBack={true} />);
    expect(useDashboardHeaderStore.getState().config.title).toBe('Period');
    unmount();
    expect(useDashboardHeaderStore.getState().config.title).toBe('Period');
    expect(useDashboardHeaderStore.getState().config.ready).toBe(true);
  });
});
