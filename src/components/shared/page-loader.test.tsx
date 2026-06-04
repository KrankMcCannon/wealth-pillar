import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLoader } from '@/components/shared/page-loader';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('PageLoader', () => {
  it('renders list skeleton without dashboard shell chrome', () => {
    const { container } = render(<PageLoader variant="list" />);

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders home skeleton content only', () => {
    const { container } = render(<PageLoader variant="home" />);

    expect(container.querySelector('#main-dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
