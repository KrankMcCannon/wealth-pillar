import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useDashboardHeaderStore } from '@/components/layout/dashboard-header-store';
import { usePageHeader } from './use-page-header';

function Probe({
  title,
  showBack,
  onBack,
}: {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}) {
  usePageHeader({
    ...(title !== undefined ? { title } : {}),
    ...(showBack !== undefined ? { showBack } : {}),
    ...(onBack !== undefined ? { onBack } : {}),
  });
  return null;
}

describe('usePageHeader', () => {
  beforeEach(() => {
    useDashboardHeaderStore.setState(useDashboardHeaderStore.getInitialState(), true);
  });

  it('does not reset when only onBack identity changes', () => {
    const reset = vi.fn();
    useDashboardHeaderStore.setState({ resetHeader: reset });

    const { rerender } = render(
      <Probe title="Period" showBack={true} onBack={() => undefined} />
    );
    expect(useDashboardHeaderStore.getState().config.title).toBe('Period');
    expect(reset).not.toHaveBeenCalled();

    rerender(<Probe title="Period" showBack={true} onBack={() => undefined} />);
    expect(reset).not.toHaveBeenCalled();
    expect(useDashboardHeaderStore.getState().config.showBack).toBe(true);
  });

  it('keeps the last title on unmount so Suspense fallbacks do not flash the app name', () => {
    const { unmount } = render(<Probe title="Period" showBack={true} />);
    expect(useDashboardHeaderStore.getState().config.title).toBe('Period');
    unmount();
    expect(useDashboardHeaderStore.getState().config.title).toBe('Period');
    expect(useDashboardHeaderStore.getState().config.ready).toBe(true);
  });
});
