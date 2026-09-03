import { describe, expect, it } from 'vitest';
import { Coffee, Scissors, UtensilsCrossed } from 'lucide-react';
import type { Category } from '@/lib/types';
import { getBudgetCategoryLucideIcon } from './budget-category-lucide-icon';

function cat(key: string, label: string): Category {
  return {
    id: key,
    key,
    label,
    icon: key,
    color: '#000',
    group_id: 'g1',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };
}

describe('getBudgetCategoryLucideIcon', () => {
  const categories = [
    cat('cibo_asporto', 'Cibo Asporto'),
    cat('cibo_fuori', 'Cibo Fuori'),
    cat('parrucchiere', 'Parrucchiere'),
  ];

  it('uses the system icon map for known category keys', () => {
    expect(getBudgetCategoryLucideIcon('cibo_asporto', categories)).toBe(Coffee);
    expect(getBudgetCategoryLucideIcon('cibo_fuori', categories)).toBe(UtensilsCrossed);
    expect(getBudgetCategoryLucideIcon('parrucchiere', categories)).toBe(Scissors);
  });

  it('resolves by label when the identifier is not the key', () => {
    expect(getBudgetCategoryLucideIcon('Cibo Asporto', categories)).toBe(Coffee);
    expect(getBudgetCategoryLucideIcon('Parrucchiere', [])).toBe(Scissors);
  });
});
