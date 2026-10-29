import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetProgressBar, getBudgetProgressbarProps } from './budget-progress-bar';

describe('getBudgetProgressbarProps', () => {
  it('exposes a clamped progressbar contract', () => {
    expect(getBudgetProgressbarProps({ percent: 42.4, label: 'Groceries' })).toEqual({
      role: 'progressbar',
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuenow': 42,
      'aria-valuetext': '42%',
      'aria-label': 'Groceries',
    });
  });

  it('clamps aria-valuenow at 100 when over budget', () => {
    const props = getBudgetProgressbarProps({ percent: 130, label: 'Over' });
    expect(props['aria-valuenow']).toBe(100);
    expect(props['aria-valuetext']).toBe('130%');
  });
});

describe('BudgetProgressBar', () => {
  it('renders an accessible progressbar', () => {
    render(<BudgetProgressBar percent={60} label="Food budget" fillClassName="bg-primary" />);

    const bar = screen.getByRole('progressbar', { name: 'Food budget' });
    expect(bar).toHaveAttribute('aria-valuenow', '60');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });
});
