import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataSection } from './DataSection';

const openModal = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({
    openModal,
    closeModal: vi.fn(),
  }),
}));

describe('DataSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the import sheet from the settings row', () => {
    render(<DataSection />);
    fireEvent.click(screen.getByRole('button', { name: 'importTransactions' }));
    expect(openModal).toHaveBeenCalledWith('import');
  });
});
