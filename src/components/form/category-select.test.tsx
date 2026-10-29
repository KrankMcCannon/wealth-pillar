import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Category } from '@/lib/types';
import { CategorySelect, findCategoryByValue } from './category-select';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('@/lib/icons', () => ({
  CategoryIcon: () => null,
  getSemanticColor: () => '#000',
}));

vi.mock('@/stores/category-usage-store', () => {
  const useCategoryUsageStore = Object.assign(
    (
      selector: (state: {
        usageMap: Record<string, never>;
        recordCategoryUsage: () => void;
      }) => unknown
    ) => selector({ usageMap: {}, recordCategoryUsage: vi.fn() }),
    { persist: { rehydrate: vi.fn() } }
  );
  return { useCategoryUsageStore };
});

if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.releasePointerCapture = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

const categories: Category[] = [
  {
    id: 'id-alpha',
    label: 'Alpha',
    key: 'aaa',
    icon: 'circle',
    color: '#111',
    group_id: 'g1',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'id-food',
    label: 'Food',
    key: 'food',
    icon: 'utensils',
    color: '#f00',
    group_id: 'g1',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

describe('findCategoryByValue', () => {
  it('resolves by key or id and ignores empty values', () => {
    expect(findCategoryByValue(categories, 'food')?.label).toBe('Food');
    expect(findCategoryByValue(categories, 'id-food')?.key).toBe('food');
    expect(findCategoryByValue(categories, '')).toBeUndefined();
    expect(findCategoryByValue(categories, undefined)).toBeUndefined();
  });
});

describe('CategorySelect', () => {
  it('shows the selected category label, not the first alphabetical item', () => {
    const onValueChange = vi.fn();
    render(
      <CategorySelect
        value="food"
        onValueChange={onValueChange}
        categories={categories}
        captionLabel="Category"
      />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Food');
    expect(screen.getByRole('combobox')).not.toHaveTextContent('Alpha');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('shows a placeholder when unset and does not emit the first category', () => {
    const onValueChange = vi.fn();
    render(
      <CategorySelect
        value=""
        onValueChange={onValueChange}
        categories={categories}
        placeholder="Pick a category"
      />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Pick a category');
    expect(screen.getByRole('combobox')).not.toHaveTextContent('Alpha');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('displays the matching category when the value is an id', () => {
    render(<CategorySelect value="id-food" onValueChange={() => {}} categories={categories} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Food');
  });

  it('reproduces Bug 2: clicking category select while an input is focused', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <div>
        <input data-testid="description-input" defaultValue="" />
        <CategorySelect value="" onValueChange={() => {}} categories={categories} />
      </div>
    );
    const descInput = screen.getByTestId('description-input');
    await user.type(descInput, 'Dinner with friends');
    expect(document.activeElement).toBe(descInput);

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    // If Bug 2 is present: combobox is not expanded or dropdown is not open
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
  });

  it('reproduces Bug 3: clicking search bar inside category dropdown does not close it', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<CategorySelect value="" onValueChange={() => {}} categories={categories} />);
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');

    const searchInput = screen.getByPlaceholderText('searchPlaceholder');
    await user.click(searchInput);

    // If Bug 3 is present: searchInput was unmounted or combobox closed
    expect(screen.getByPlaceholderText('searchPlaceholder')).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
  });

  it('selects an option on click and closes the dropdown', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CategorySelect value="" onValueChange={onValueChange} categories={categories} />);

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');

    const foodOption = screen.getByRole('option', { name: /Food/ });
    await user.click(foodOption);

    expect(onValueChange).toHaveBeenCalledWith('food');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });
});
