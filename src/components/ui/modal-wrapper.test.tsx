import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalWrapper } from './modal-wrapper';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ModalWrapper accessibility', () => {
  it('renders an accessible sheet title', () => {
    render(
      <ModalWrapper isOpen onOpenChange={() => {}} title="Edit profile">
        <p>Form body</p>
      </ModalWrapper>
    );

    expect(screen.getByRole('heading', { name: 'Edit profile' })).toBeInTheDocument();
    expect(screen.getByText('Form body')).toBeInTheDocument();
  });
});
