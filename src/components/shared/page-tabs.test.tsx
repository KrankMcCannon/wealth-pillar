import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageTabs, PageTabsSticky } from './page-tabs';

describe('PageTabs', () => {
  const items = [
    { value: 'personal', label: 'Personale' },
    { value: 'sandbox', label: 'Sandbox' },
  ] as const;

  it('marks the current page tab and notifies on change', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PageTabs
        value="personal"
        onValueChange={onValueChange}
        ariaLabel="Sezioni investimenti"
        items={items}
      />
    );

    const current = screen.getByRole('tab', { name: 'Personale' });
    expect(current).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Sandbox' })).toHaveAttribute('aria-selected', 'false');

    await user.click(screen.getByRole('tab', { name: 'Sandbox' }));
    expect(onValueChange).toHaveBeenCalledWith('sandbox');
  });

  it('renders member chips above the switch in the sticky chrome', () => {
    render(
      <PageTabsSticky
        value="personal"
        ariaLabel="Sezioni investimenti"
        items={items}
        leading={<div>Tutti</div>}
      />
    );

    expect(screen.getByRole('tablist', { name: 'Sezioni investimenti' })).toBeInTheDocument();
    expect(
      screen.getByText('Tutti').compareDocumentPosition(screen.getByRole('tablist')) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).not.toBe(0);
  });
});
