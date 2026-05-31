import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalWrapper } from './modal-wrapper';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ModalWrapper accessibility', () => {
  it('renders an accessible drawer title and card shell', () => {
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
    expect(document.querySelector('[data-slot="drawer-content"]')).toHaveClass('bg-card');
  });

  it('blocks dismiss when disableOutsideClose is true', () => {
    const onOpenChange = vi.fn();

    render(
      <ModalWrapper isOpen onOpenChange={onOpenChange} title="Locked modal" disableOutsideClose>
        <p>Form body</p>
      </ModalWrapper>
    );

    expect(screen.getByText('Form body')).toBeInTheDocument();
  });

  it('shows loading spinner instead of children when isLoading', () => {
    render(
      <ModalWrapper isOpen onOpenChange={() => {}} title="Loading modal" isLoading>
        <p>Form body</p>
      </ModalWrapper>
    );

    expect(screen.queryByText('Form body')).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="drawer-content"]')).toBeInTheDocument();
  });
});
