import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  it('uses a 44px min height and exposes aria-invalid', () => {
    render(<Input aria-invalid aria-label="Name" />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.className).toMatch(/min-h-11/);
  });
});
