import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageFab } from './page-fab';

describe('PageFab', () => {
  it('uses the composer foreground fill instead of accent or primary', () => {
    render(<PageFab onClick={vi.fn()} ariaLabel="Add" testId="page-fab" />);
    const fab = screen.getByTestId('page-fab');
    expect(fab).toHaveClass('bg-foreground');
    expect(fab).not.toHaveClass('bg-accent');
    expect(fab).not.toHaveClass('bg-primary');
  });
});
