import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SelectionModal } from './selection-modal';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/ui/modal-wrapper', () => ({
  ModalWrapper: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
  ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/modal-footer-actions', () => ({
  ModalFooterActions: () => <div data-testid="footer-actions" />,
}));

describe('SelectionModal', () => {
  it('renders options as a radiogroup with the current value marked', () => {
    render(
      <SelectionModal
        isOpen
        onClose={vi.fn()}
        title="Currency"
        description="Pick a currency"
        value="EUR"
        isSaving={false}
        onSave={vi.fn()}
        options={[
          { value: 'EUR', label: 'Euro', description: 'Eurozone' },
          { value: 'USD', label: 'US Dollar', description: 'United States' },
        ]}
      />
    );

    expect(screen.getByRole('radiogroup', { name: 'Currency' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Euro/ })).toBeChecked();
    expect(screen.getByText('currentBadge')).toBeInTheDocument();
    expect(screen.getByText('Eurozone')).toBeInTheDocument();
  });
});
