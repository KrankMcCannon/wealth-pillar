'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Category } from '@/lib/types';
export function BudgetIncludedCategories({
  keys,
  categories,
}: {
  keys: string[];
  categories: Category[];
}) {
  const t = useTranslations('Budgets.UX');
  const [query, setQuery] = useState('');
  const items = keys
    .map((key) => ({ key, label: categories.find((c) => c.key === key)?.label ?? key }))
    .filter((c) => c.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return (
    <details>
      <summary className="min-h-11 cursor-pointer py-3 font-semibold">
        {t('included', { count: keys.length })}
      </summary>
      <label className="flex flex-col gap-2 text-sm">
        {t('findCategory')}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-11 rounded-lg border border-border bg-background px-3 text-base"
        />
      </label>
      {items.length ? (
        <ul className="flex flex-wrap gap-2 py-3">
          {items.map((c) => (
            <li key={c.key} className="rounded-lg bg-muted px-3 py-2 text-sm">
              {c.label}
            </li>
          ))}
        </ul>
      ) : (
        <p role="status">{t('none')}</p>
      )}
    </details>
  );
}
