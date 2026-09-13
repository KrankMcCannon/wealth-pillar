import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateField, overlayRectForTrigger } from './date-field';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('../mobile-calendar-drawer', () => ({
  MobileCalendarDrawer: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="calendar-drawer" /> : null,
}));

vi.mock('../calendar-panel', () => ({
  CalendarPanel: () => <div data-testid="calendar-panel" />,
}));

describe('overlayRectForTrigger', () => {
  it('flips above the trigger when there is no room below', () => {
    const rect = overlayRectForTrigger(
      { top: 500, bottom: 548, left: 16, width: 343 },
      { width: 375, height: 650 }
    );
    expect(rect.top).toBeLessThan(500);
    expect(rect.width).toBeLessThanOrEqual(343);
  });
});

describe('DateField', () => {
  it('formats a date with the active locale and overlays the calendar', () => {
    render(
      <DateField
        value="2026-06-15"
        onChange={() => {}}
        label="From"
        layout="stack"
        presentation="inline"
      />
    );
    const trigger = screen.getByRole('button', { name: /From/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveTextContent(/15/);
    fireEvent.click(trigger);
    expect(screen.getByRole('button', { name: /From/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'From' })).toBeInTheDocument();
    expect(screen.getByTestId('calendar-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-drawer')).not.toBeInTheDocument();
  });

  it('opens a nested drawer when presentation is drawer', () => {
    render(
      <DateField value="2026-06-15" onChange={() => {}} label="When" presentation="drawer" />
    );
    fireEvent.click(screen.getByRole('button', { name: /When/ }));
    expect(screen.getByTestId('calendar-drawer')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-panel')).not.toBeInTheDocument();
  });
});
