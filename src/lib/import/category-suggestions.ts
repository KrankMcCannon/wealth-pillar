const CREDEM_CAUSALE_CATEGORY: Record<string, string> = {
  PDINT: 'ristorazione',
  PDPRE: 'bollette',
  EMRET: 'stipendio',
  OCRET: 'stipendio',
  DIIST: 'altro',
  DIBOU: 'altro',
  OCIST: 'altro',
  COIST: 'commissioni',
  COBON: 'commissioni',
  COUTE: 'commissioni',
  CPCNF: 'commissioni',
  DIASS: 'assicurazione',
  PDIMP: 'tasse',
  PDIST: 'commissioni',
  UCMUT: 'altro',
};

const KEYWORD_CATEGORY_RULES: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /netflix/i, category: 'intrattenimento' },
  { pattern: /spotify/i, category: 'intrattenimento' },
  { pattern: /deliveroo/i, category: 'ristorazione' },
  { pattern: /mcdonald/i, category: 'ristorazione' },
  { pattern: /amazon/i, category: 'shopping' },
  { pattern: /cursor/i, category: 'tecnologia' },
  { pattern: /google\s*\*google one/i, category: 'tecnologia' },
  { pattern: /wind tre/i, category: 'bollette' },
  { pattern: /emolumenti|stipendio|inps/i, category: 'stipendio' },
  { pattern: /comm\.|commissione|canone/i, category: 'commissioni' },
  { pattern: /bonifico|bon\./i, category: 'altro' },
];

export const DEFAULT_IMPORT_CATEGORY = 'altro';

export function suggestCategoryFromImportRow(input: {
  description: string;
  type: 'income' | 'expense';
  causale?: string;
}): string {
  if (input.causale) {
    const fromCausale = CREDEM_CAUSALE_CATEGORY[input.causale.toUpperCase()];
    if (fromCausale) return fromCausale;
  }

  for (const rule of KEYWORD_CATEGORY_RULES) {
    if (rule.pattern.test(input.description)) {
      return rule.category;
    }
  }

  if (input.type === 'income') {
    return 'stipendio';
  }

  return DEFAULT_IMPORT_CATEGORY;
}
