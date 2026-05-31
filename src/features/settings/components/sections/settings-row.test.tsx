import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsRow } from './settings-row';

describe('SettingsRow', () => {
  it('renders a button row and handles click', () => {
    const onClick = vi.fn();
    render(
      <SettingsRow
        icon={<span data-testid="icon" />}
        label="Currency"
        value="EUR"
        onClick={onClick}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Currency/i }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });

  it('renders a link row with href', () => {
    render(
      <SettingsRow
        icon={<span data-testid="icon" />}
        label="Help"
        href="https://example.com/help"
      />
    );

    const link = screen.getByRole('link', { name: /Help/i });
    expect(link).toHaveAttribute('href', 'https://example.com/help');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders a static div when no href or onClick', () => {
    render(<SettingsRow icon={<span />} label="Static row" showChevron={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Static row')).toBeInTheDocument();
  });
});
