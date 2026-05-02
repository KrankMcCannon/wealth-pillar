'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Briefcase,
  Car,
  CircleDot,
  Dog,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  LayoutGrid,
  PiggyBank,
  Plane,
  Shirt,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react';
import type { Category } from '@/lib/types';
import { findCategory } from '@/server/use-cases/categories/category.logic';

const KEY_MAP: Record<string, LucideIcon> = {
  altro: LayoutGrid,
  default: LayoutGrid,
  casa: Home,
  home: Home,
  affitto: Home,
  trasporti: Car,
  trasporto: Car,
  auto: Car,
  benzina: Car,
  alimentari: ShoppingCart,
  alimentazione: ShoppingCart,
  spesa: ShoppingCart,
  food: ShoppingCart,
  supermercato: ShoppingCart,
  salute: HeartPulse,
  health: HeartPulse,
  medicina: HeartPulse,
  svago: Sparkles,
  intrattenimento: Sparkles,
  divertimento: Sparkles,
  bollette: Zap,
  utilities: Zap,
  utenze: Zap,
  luce: Zap,
  gas: Zap,
  finanza: Landmark,
  finance: Landmark,
  banca: Landmark,
  investimenti: Landmark,
  ristoranti: UtensilsCrossed,
  ristorante: UtensilsCrossed,
  bar: UtensilsCrossed,
  lavoro: Briefcase,
  work: Briefcase,
  viaggi: Plane,
  vacanze: Plane,
  vestiti: Shirt,
  abbigliamento: Shirt,
  animali: Dog,
  pets: Dog,
  veterinario: Dog,
  bambini: Baby,
  figli: Baby,
  istruzione: GraduationCap,
  education: GraduationCap,
  scuola: GraduationCap,
  tecnologia: Wrench,
  tech: Wrench,
  computer: Wrench,
  internet: Wifi,
  telefono: Wifi,
  telefonia: Wifi,
  risparmi: PiggyBank,
  saving: PiggyBank,
};

function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

/**
 * Icona Lucide per la categoria del budget (chiave / label), fallback su cerchio.
 */
export function getBudgetCategoryLucideIcon(
  categoryIdentifier: string,
  categories: Category[]
): LucideIcon {
  const cat = findCategory(categories, categoryIdentifier);
  const rawKey = cat?.key ?? categoryIdentifier;
  const nk = normalizeKey(rawKey);
  if (KEY_MAP[nk]) {
    return KEY_MAP[nk];
  }

  const label = (cat?.label ?? '').toLowerCase();
  if (label.includes('casa') || label.includes('affitto') || label.includes('mutuo')) return Home;
  if (
    label.includes('trasport') ||
    label.includes('auto') ||
    label.includes('benzina') ||
    label.includes('carburante')
  ) {
    return Car;
  }
  if (
    label.includes('aliment') ||
    label.includes('spesa') ||
    label.includes('supermerc') ||
    label.includes('grocery')
  ) {
    return ShoppingCart;
  }
  if (label.includes('salut') || label.includes('medic') || label.includes('farmacia')) {
    return HeartPulse;
  }
  if (label.includes('svago') || label.includes('intratten') || label.includes('cinema')) {
    return Sparkles;
  }
  if (
    label.includes('bollett') ||
    label.includes('utenze') ||
    label.includes('luce') ||
    label.includes('gas')
  ) {
    return Zap;
  }
  if (label.includes('finanz') || label.includes('banca') || label.includes('invest')) {
    return Landmark;
  }
  if (label.includes('ristor') || label.includes('bar ') || label.includes('takeaway')) {
    return UtensilsCrossed;
  }
  if (label.includes('viagg') || label.includes('vacanz')) return Plane;
  if (label.includes('vestit') || label.includes('abbigliamento')) return Shirt;
  if (label.includes('animal') || label.includes('veterin')) return Dog;
  if (label.includes('bambin') || label.includes('figli')) return Baby;
  if (label.includes('scuola') || label.includes('istruz')) return GraduationCap;

  return CircleDot;
}

export interface BudgetCategoryLucideIconProps {
  readonly categoryIdentifier: string;
  readonly categories: Category[];
  readonly className?: string;
}

export function BudgetCategoryLucideIcon({
  categoryIdentifier,
  categories,
  className,
}: BudgetCategoryLucideIconProps) {
  const Icon = getBudgetCategoryLucideIcon(categoryIdentifier, categories);
  return <Icon className={className} strokeWidth={2} aria-hidden />;
}
