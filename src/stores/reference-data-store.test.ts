import { describe, it, expect, beforeEach } from 'vitest';
import { useReferenceDataStore } from './reference-data-store';
import type { Category } from '@/lib/types';

const sampleCategory = (id: string, key: string): Category => ({
  id,
  key,
  label: key,
  icon: 'ShoppingBasket',
  color: '#6366F1',
  group_id: 'group-1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
});

describe('useReferenceDataStore category actions', () => {
  beforeEach(() => {
    useReferenceDataStore.getState().reset();
    useReferenceDataStore.getState().initialize({
      accounts: [],
      categories: [sampleCategory('cat-1', 'spesa'), sampleCategory('temp-category-1', 'spesa_2')],
    });
  });

  it('removeCategory removes by id, not key', () => {
    useReferenceDataStore.getState().removeCategory('temp-category-1');

    const categories = useReferenceDataStore.getState().categories;
    expect(categories).toHaveLength(1);
    expect(categories[0]?.id).toBe('cat-1');
  });

  it('updateCategory updates by id, not key', () => {
    useReferenceDataStore.getState().updateCategory('cat-1', { label: 'Updated' });

    const categories = useReferenceDataStore.getState().categories;
    expect(categories.find((category) => category.id === 'cat-1')?.label).toBe('Updated');
    expect(categories.find((category) => category.id === 'temp-category-1')?.label).toBe('spesa_2');
  });
});
