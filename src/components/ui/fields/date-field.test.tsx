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

  it('positions relative to a drawer host so the overlay stays inside the sheet', () => {
    const rect = overlayRectForTrigger(
      { top: 100, bottom: 148, left: 16, width: 300 },
      { width: 800, height: 800 },
      { top: 50, left: 0, width: 400, height: 600 }
    );
    expect(rect.top).toBe(106);
    expect(rect.left).toBe(16);
    expect(rect.width).toBe(300);
  });

  it('does not artificially clamp calendar height to a fraction of the modal host', () => {
    const rect = overlayRectForTrigger(
      { top: 200, bottom: 248, left: 16, width: 320 },
      { width: 1200, height: 900 },
      { top: 100, left: 100, width: 500, height: 500 }
    );
    expect(rect.maxHeight).toBe(400);
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
    render(<DateField value="2026-06-15" onChange={() => {}} label="When" presentation="drawer" />);
    fireEvent.click(screen.getByRole('button', { name: /When/ }));
    expect(screen.getByTestId('calendar-drawer')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-panel')).not.toBeInTheDocument();
  });

  it('renders the overlay as a floating fixed dialog in body so it is not clipped by parent modal', () => {
    render(
      <div data-slot="drawer-content">
        <DateField
          value="2026-06-15"
          onChange={() => {}}
          label="When"
          layout="stack"
          presentation="inline"
        />
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: /When/ }));
    const dialog = screen.getByRole('dialog', { name: 'When' });
    expect(dialog).toHaveClass('pointer-events-auto');
    expect(dialog).toHaveClass('fixed');
    expect(screen.getByRole('button', { name: 'closeCalendar' })).toHaveClass(
      'pointer-events-auto'
    );
    expect(screen.queryByTestId('calendar-drawer')).not.toBeInTheDocument();
  });
});
