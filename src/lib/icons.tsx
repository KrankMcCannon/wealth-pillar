import React from 'react';
import {
  // Financial & Banking icons
  ArrowUpRight,
  Building2,
  Banknote,
  TrendingUp,
  PiggyBank,
  CreditCard,
  DollarSign,

  // Utilities & Bills icons
  Tv,
  Smartphone,
  Phone,
  Zap,
  Activity,
  Droplets,
  Flame,
  Trash2,
  WifiIcon as Wifi,

  // Transportation icons
  Car,
  Fuel,
  Wrench,

  // Health & Wellness icons
  Heart,
  Pill,
  Stethoscope,
  Dumbbell,

  // Beauty & Personal Care icons
  Sparkles,
  Scissors,
  Package,

  // Food & Dining icons
  UtensilsCrossed,
  ShoppingBasket,
  Coffee,
  ChefHat,

  // Shopping & Lifestyle icons
  Gift,
  ShirtIcon as Shirt,
  PartyPopper,

  // Utility icons
  FileText,
} from 'lucide-react';

export const designSystemColors = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  success: 'var(--color-accent)', // Using accent color for success (mint green)
  warning: 'var(--color-warning)',
  error: 'var(--color-destructive)',
  info: 'var(--color-secondary)', // Using secondary color for info
  neutral: 'var(--color-primary)',
};

// Modern icon mapping - Category-based line-art icons
export const iconMapping: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  // Financial Operations
  'trasferimento': ArrowUpRight,
  'bonifico': Building2,
  'contanti': Banknote,
  'stipendio': DollarSign,
  'investimenti': TrendingUp,
  'risparmi': PiggyBank,
  'rata_auto': CreditCard,

  // Utilities & Bills
  'abbonamenti_tv': Tv,
  'ricarica_telefono': Smartphone,
  'bolletta_tim': Phone,
  'bolletta_luce': Zap,
  'bolletta_gas': Flame,
  'bolletta_acqua': Droplets,
  'bolletta_tari': Trash2,
  'abbonamenti_necessari': Wifi,
  'bolletta_depuratore': Activity,

  // Transportation
  'bollo_auto': Car,
  'benzina': Fuel,
  'tagliando_auto': Wrench,

  // Health & Wellness
  'medicine': Pill,
  'medicine_thor': Pill,
  'visite_mediche': Stethoscope,
  'analisi_mediche': Activity,
  'veterinario': Heart,
  'palestra': Dumbbell,

  // Beauty & Personal Care
  'parrucchiere': Scissors,
  'estetista': Sparkles,
  'skincare': Package,
  'haircare': Package,
  'taglio_thor': Scissors,

  // Food & Dining
  'spesa': ShoppingBasket,
  'cibo_fuori': UtensilsCrossed,
  'cibo_asporto': Coffee,
  'cibo_thor': ChefHat,

  // Shopping & Lifestyle
  'vestiti': Shirt,
  'regali': Gift,
  'eventi': PartyPopper,
  'yuup_thor': Heart,

  // Default/Misc
  'altro': FileText,
};

const categoryColors: Record<string, string> = {
  // Financial
  stipendio: designSystemColors.success,
  trasferimento: designSystemColors.info,
  bonifico: designSystemColors.info,
  investimenti: designSystemColors.primary,
  contanti: designSystemColors.secondary,
  risparmi: designSystemColors.secondary,

  // Utilities
  bolletta_luce: designSystemColors.warning,
  bolletta_gas: designSystemColors.error,
  bolletta_acqua: 'hsl(var(--category-utilities-blue))',
  bolletta_tim: 'hsl(var(--category-utilities-red))',
  bolletta_tari: 'var(--color-destructive)',
  ricarica_telefono: designSystemColors.info,
  abbonamenti_tv: designSystemColors.primary,
  abbonamenti_necessari: designSystemColors.secondary,
  bolletta_depuratore: 'hsl(var(--category-utilities-blue))',

  // Transportation
  bollo_auto: 'hsl(var(--category-transportation-purple))',
  tagliando_auto: 'hsl(var(--category-transportation-purple))',
  rata_auto: 'hsl(var(--category-transportation-purple))',
  benzina: 'hsl(var(--category-transportation-orange))',

  // Health
  medicine: 'hsl(var(--category-health-cyan))',
  medicine_thor: 'hsl(var(--category-health-cyan))',
  visite_mediche: 'hsl(var(--category-health-cyan))',
  analisi_mediche: 'hsl(var(--category-health-cyan))',
  veterinario: 'var(--color-secondary)',
  palestra: 'hsl(var(--category-health-teal))',

  // Beauty & Lifestyle
  parrucchiere: 'hsl(var(--category-beauty-pink))',
  estetista: 'hsl(var(--category-beauty-pink))',
  skincare: 'hsl(var(--category-beauty-pink))',
  haircare: 'hsl(var(--category-beauty-pink))',
  taglio_thor: 'hsl(var(--category-beauty-pink))',

  // Food
  spesa: 'hsl(var(--category-food-green))',
  cibo_fuori: 'hsl(var(--category-food-green))',
  cibo_asporto: 'hsl(var(--category-food-green))',
  cibo_thor: 'hsl(var(--category-food-green))',

  // Shopping
  vestiti: designSystemColors.secondary,
  regali: 'hsl(var(--category-shopping-purple))',
  eventi: designSystemColors.warning,
  yuup_thor: 'hsl(var(--category-shopping-orange))',

  // Default
  altro: designSystemColors.neutral,
};

export const getSemanticColor = (categoryKey: string): string =>
  categoryColors[categoryKey] || designSystemColors.neutral;

interface IconProps {
  icon: string;
  className?: string;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ icon, className = '', size = 20, color }) => {
  const IconComponent = iconMapping[icon] || FileText;
  return (
    <IconComponent
      className={className}
      width={size}
      height={size}
      style={color ? { color } : undefined}
    />
  );
};

interface CategoryIconProps {
  categoryKey: string;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryKey,
  size = 20,
  className = ''
}) => (
  <Icon
    icon={categoryKey}
    size={size}
    className={className}
    color={className.includes('text-') ? undefined : getSemanticColor(categoryKey)}
  />
);

export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type IconSize = keyof typeof iconSizes;
