import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalWrapper } from './modal-wrapper';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ModalWrapper accessibility', () => {
  it('renders an accessible sheet title and card shell', () => {
    render(
      <ModalWrapper
        isOpen
        onOpenChange={() => {}}
        title="Edit profile"
        description="Update details"
      >
        <p>Form body</p>
      </ModalWrapper>
    );

    expect(screen.getByRole('heading', { name: 'Edit profile' })).toBeInTheDocument();
    expect(screen.getByText('Update details')).toBeInTheDocument();
    expect(screen.getByText('Form body')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="sheet-content"]')).toHaveClass('bg-card');
  });
});
