import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLoader } from '@/components/shared/page-loader';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '',
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '',
}));

describe('PageLoader', () => {
  it('renders transactions skeleton without dashboard shell chrome', () => {
    const { container } = render(<PageLoader variant="transactions" />);

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(container.querySelector('#main-transactions-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders home skeleton content only', () => {
    const { container } = render(<PageLoader variant="home" />);

    expect(container.querySelector('#main-dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
