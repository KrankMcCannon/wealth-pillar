import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalRootError } from './modal-root-error';

describe('ModalRootError', () => {
  it('renders nothing without message', () => {
    const { container } = render(<ModalRootError />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders alert with message', () => {
    render(<ModalRootError message="Server error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Server error');
  });
});
