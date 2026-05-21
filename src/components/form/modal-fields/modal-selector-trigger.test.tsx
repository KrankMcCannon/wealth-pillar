import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalSelectorTrigger } from './modal-selector-trigger';

describe('ModalSelectorTrigger', () => {
  it('renders label and value', () => {
    render(<ModalSelectorTrigger label="Account" value="Checking" />);
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Checking')).toBeInTheDocument();
  });

  it('renders muted placeholder value', () => {
    render(<ModalSelectorTrigger label="Date" value="Select date" valueMuted />);
    expect(screen.getByText('Select date')).toBeInTheDocument();
  });

  it('calls onClick when enabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<ModalSelectorTrigger label="Date" value="Today" onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<ModalSelectorTrigger label="Date" value="Today" disabled onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
