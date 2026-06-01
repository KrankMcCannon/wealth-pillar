import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthPageWrapper } from './auth-page-wrapper';

describe('AuthPageWrapper', () => {
  it('renders children in the mobile auth shell', () => {
    render(
      <AuthPageWrapper>
        <span>Sign in content</span>
      </AuthPageWrapper>
    );

    expect(screen.getByText('Sign in content')).toBeInTheDocument();
  });
});
