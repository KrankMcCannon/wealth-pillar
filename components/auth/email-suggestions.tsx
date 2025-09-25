'use client';

import { cn } from '@/lib/utils';

type Props = {
  value: string;
  onSelect: (email: string) => void;
  className?: string;
};

const COMMON_DOMAINS = ['gmail.com', 'outlook.com', 'icloud.com', 'yahoo.com', 'hotmail.com', 'live.com'];
const COMMON_TYPO_MAP: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
};

function suggestDomain(domain: string) {
  if (COMMON_TYPO_MAP[domain]) return COMMON_TYPO_MAP[domain];
  if (!domain.includes('.')) {
    // Missing TLD: try appending .com if it's a known provider
    const candidate = `${domain}.com`;
    if (COMMON_DOMAINS.includes(candidate)) return candidate;
  }
  // Light heuristic: suggest the first domain that starts with same first letter
  const first = domain[0];
  const candidate = COMMON_DOMAINS.find(d => d.startsWith(first));
  return candidate;
}

export function EmailSuggestions({ value, onSelect, className }: Props) {
  if (!value.includes('@')) return null;
  const [local, domain] = value.split('@');
  if (!local || !domain) return null;
  const suggestion = suggestDomain(domain.toLowerCase());
  if (!suggestion || suggestion === domain.toLowerCase()) return null;
  const suggestedEmail = `${local}@${suggestion}`;

  return (
    <div className={cn('text-xs text-[color:var(--text-secondary)]', className)}>
      Intendevi{' '}
      <button
        type="button"
        className="underline text-[hsl(var(--color-primary))]"
        onClick={() => onSelect(suggestedEmail)}
      >
        {suggestedEmail}
      </button>
      ?
    </div>
  );
}

export default EmailSuggestions;

