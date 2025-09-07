export const dummyCategoryColors: Record<string, string> = {
  // Categorie specifiche - Cura personale (tonalità rosa/viola)
  'parrucchiere': '#ec4899',
  'estetista': '#f472b6',
  'skincare': '#d946ef',
  'haircare': '#c084fc',
  'taglio_thor': '#a855f7',

  // Categorie finanziarie (tonalità verdi)
  'trasferimento': '#059669',
  'bonifico': '#047857',
  'contanti': '#065f46',
  'investimenti': '#064e3b',
  'risparmi': '#022c22',
  'rata_auto': '#166534',

  // Bollette specifiche (tonalità rosse)
  'bolletta_acqua': '#dc2626',
  'bolletta_tari': '#b91c1c',
  'bolletta_tim': '#991b1b',
  'bolletta_gas': '#7f1d1d',
  'bolletta_luce': '#fbbf24',
  'bolletta_depuratore': '#3b82f6',

  // Salute e medicina (tonalità blu/cyan)
  'medicine': '#0891b2',
  'medicine_thor': '#0e7490',
  'visite_mediche': '#155e75',
  'analisi_mediche': '#0c4a6e',
  'veterinario': '#075985',
  'palestra': '#0369a1',

  // Cibo e alimentari (tonalità verdi)
  'cibo_fuori': '#16a34a',
  'cibo_asporto': '#15803d',
  'cibo_thor': '#166534',
  'spesa': '#14532d',

  // Auto e trasporti (tonalità viola)
  'bollo_auto': '#7c3aed',
  'tagliando_auto': '#6d28d9',
  'benzina': '#5b21b6',

  // Shopping e abbigliamento (tonalità blu)
  'vestiti': '#2563eb',
  'regali': '#1d4ed8',
  'abbonamenti_tv': '#1e40af',
  'abbonamenti_necessari': '#1e3a8a',

  // Tecnologia (tonalità indaco)
  'ricarica_telefono': '#4338ca',
  'yuup_thor': '#3730a3',

  // Altri/varie (tonalità neutre)
  'altro': '#6b7280',
  'eventi': '#f59e0b',
  'stipendio': '#10b981',
  'assicurazione': '#3b82f6'
};

// Category labels mapping
export const categoryLabels: Record<string, string> = {
  'parrucchiere': 'Parrucchiere',
  'trasferimento': 'Trasferimento',
  'altro': 'Altro',
  'bonifico': 'Bonifico',
  'abbonamenti_tv': 'Abbonamenti TV',
  'veterinario': 'Veterinario',
  'bollo_auto': 'Bollo Auto',
  'contanti': 'Contanti',
  'cibo_fuori': 'Ristoranti',
  'investimenti': 'Investimenti',
  'yuup_thor': 'Yuup',
  'palestra': 'Palestra',
  'spesa': 'Spesa',
  'bolletta_acqua': 'Bolletta Acqua',
  'medicine_thor': 'Medicine',
  'bolletta_tari': 'Bolletta TARI',
  'medicine': 'Medicine',
  'ricarica_telefono': 'Ricarica Telefono',
  'regali': 'Regali',
  'bolletta_tim': 'Bolletta TIM',
  'estetista': 'Estetista',
  'tagliando_auto': 'Tagliando Auto',
  'stipendio': 'Stipendio',
  'vestiti': 'Vestiti',
  'visite_mediche': 'Visite Mediche',
  'risparmi': 'Risparmi',
  'skincare': 'Skincare',
  'haircare': 'Haircare',
  'taglio_thor': 'Taglio',
  'cibo_thor': 'Cibo',
  'eventi': 'Eventi',
  'rata_auto': 'Rata Auto',
  'bolletta_gas': 'Bolletta Gas',
  'bolletta_depuratore': 'Bolletta Depuratore',
  'analisi_mediche': 'Analisi Mediche',
  'bolletta_luce': 'Bolletta Luce',
  'abbonamenti_necessari': 'Abbonamenti',
  'cibo_asporto': 'Cibo Asporto',
  'benzina': 'Benzina',
  'assicurazione': 'Assicurazione'
};

export const getCategoryLabel = (categoryKey: string): string => {
  return categoryLabels[categoryKey] || categoryKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};