import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { isSelectSearchable } from './form-select';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('../ui/select', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ui/select')>();
  return {
    ...actual,
    Select: ({
      children,
      ...props
    }: ComponentProps<typeof actual.Select>) => (
      <actual.Select {...props} open>
        {children}
      </actual.Select>
    ),
  };
});

describe('isSelectSearchable', () => {
  it('hides search under 6 options unless forced on', () => {
    expect(isSelectSearchable(3)).toBe(false);
    expect(isSelectSearchable(5, true)).toBe(true);
  });

  it('shows search at 6+ options unless forced off', () => {
    expect(isSelectSearchable(6)).toBe(true);
    expect(isSelectSearchable(20, false)).toBe(false);
  });
});

describe('FormSelect search chrome', () => {
  it('hides search when there are fewer than 6 options', async () => {
    const { FormSelect } = await import('./form-select');
    render(
      <FormSelect
        value="a"
        onValueChange={() => {}}
        captionLabel="Pick"
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
          { value: 'c', label: 'Gamma' },
        ]}
      />
    );
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('shows a labelled search field when there are 6+ options', async () => {
    const { FormSelect } = await import('./form-select');
    render(
      <FormSelect
        value="0"
        onValueChange={() => {}}
        captionLabel="Pick"
        options={Array.from({ length: 6 }, (_, i) => ({
          value: String(i),
          label: `Option ${i}`,
        }))}
      />
    );
    expect(screen.getByRole('searchbox', { name: 'searchPlaceholder' })).toBeInTheDocument();
  });
});
