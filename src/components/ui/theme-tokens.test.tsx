import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';
import { Input } from './input';
import { Card, CardTitle, CardDescription } from './card';
import { Alert, AlertTitle } from './alert';
import { inputStyles, cardStyles, buttonStyles } from './component-styles';

describe('theme semantic tokens', () => {
  it('uses foreground tokens for body copy in component-styles', () => {
    expect(inputStyles.base).toContain('text-foreground');
    expect(inputStyles.base.replace(/selection:[^\s]+/g, '')).not.toMatch(/\btext-primary\b/);
    expect(cardStyles.title).toContain('text-foreground');
    expect(cardStyles.description).toContain('text-muted-foreground');
    expect(buttonStyles.variants.outline).toContain('text-foreground');
  });

  it('renders Input with semantic foreground classes', () => {
    render(<Input aria-label="Email" placeholder="you@example.com" />);
    const input = screen.getByLabelText('Email');
    expect(input.className).toContain('text-foreground');
    expect(input.className.replace(/selection:[^\s]+/g, '')).not.toMatch(/\btext-primary\b/);
  });

  it('renders Card title and description with semantic tokens', () => {
    render(
      <Card>
        <CardTitle>Budget</CardTitle>
        <CardDescription>Monthly overview</CardDescription>
      </Card>
    );
    expect(screen.getByText('Budget').className).toContain('text-foreground');
    expect(screen.getByText('Monthly overview').className).toContain('text-muted-foreground');
  });

  it('renders Alert default variant with foreground tokens', () => {
    render(
      <Alert>
        <AlertTitle>Notice</AlertTitle>
      </Alert>
    );
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('text-foreground');
  });

  it('keeps brand color on primary Button variant only', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button').className).toContain('bg-primary');
  });
});
