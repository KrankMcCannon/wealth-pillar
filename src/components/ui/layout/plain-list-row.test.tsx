import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlainListRow } from './plain-list-row';

describe('PlainListRow', () => {
  it('renders a button row and handles click', () => {
    const onClick = vi.fn();
    render(
      <PlainListRow title="Lunch" meta="Food · today" onClick={onClick} testId="row-1">
        10,00 €
      </PlainListRow>
    );

    const row = screen.getByTestId('row-1');
    expect(row.tagName).toBe('BUTTON');
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Food · today')).toBeInTheDocument();
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders a non-interactive row when onClick is omitted', () => {
    render(
      <PlainListRow title="SYM" meta="Asset">
        100,00 €
      </PlainListRow>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('SYM')).toBeInTheDocument();
    expect(screen.getByText('Asset')).toBeInTheDocument();
  });
});
