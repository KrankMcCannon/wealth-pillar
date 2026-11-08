import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LocaleError from './error';

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/i18n/routing', () => ({ usePathname: () => '/transactions', Link: 'a' }));
vi.mock('@/components/layout', () => ({
  HomeDashboardMain: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

it('invokes the retry callback supplied by Next.js 16.4', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const retry = vi.fn();
  render(<LocaleError error={new Error('temporary read failure')} retry={retry} />);
  fireEvent.click(screen.getByRole('button', { name: 'retry' }));
  expect(retry).toHaveBeenCalledTimes(1);
  vi.restoreAllMocks();
});
