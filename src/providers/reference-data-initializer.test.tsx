import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReferenceDataInitializer } from './reference-data-initializer';
import { useCategories, useReferenceDataStore } from '@/stores/reference-data-store';
import { SYSTEM_GROUP_ID } from '@/lib/constants';
import type { Category } from '@/lib/types';

const category = (id: string, groupId: string): Category => ({
  id,
  key: id,
  label: id,
  icon: 'ShoppingBasket',
  color: '#6366F1',
  group_id: groupId,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});
const catalog = [category('Sistema', SYSTEM_GROUP_ID), category('Gruppo', 'group-1')];
function Categories() {
  return (
    <ul>
      {useCategories().map((item) => (
        <li key={item.id}>{item.label}</li>
      ))}
    </ul>
  );
}
beforeEach(() => useReferenceDataStore.getState().reset());
describe('reference category hydration', () => {
  it('recovers from a previously initialized empty catalog', () => {
    useReferenceDataStore.getState().initialize({ accounts: [], categories: [] });
    render(
      <ReferenceDataInitializer data={{ accounts: [], categories: catalog }}>
        <Categories />
      </ReferenceDataInitializer>
    );
    expect(screen.getByText('Sistema')).toBeInTheDocument();
    expect(screen.getByText('Gruppo')).toBeInTheDocument();
  });
  it('applies a refreshed server catalog after navigation, including removals', () => {
    const view = render(
      <ReferenceDataInitializer data={{ accounts: [], categories: catalog }}>
        <Categories />
      </ReferenceDataInitializer>
    );
    view.rerender(
      <ReferenceDataInitializer
        data={{ accounts: [], categories: [category('Nuovo gruppo', 'group-2')] }}
      >
        <Categories />
      </ReferenceDataInitializer>
    );
    expect(screen.getByText('Nuovo gruppo')).toBeInTheDocument();
    expect(screen.queryByText('Gruppo')).not.toBeInTheDocument();
    expect(screen.queryByText('Sistema')).not.toBeInTheDocument();
  });
});
