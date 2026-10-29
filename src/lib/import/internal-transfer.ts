const INTERNAL_TRANSFER_PATTERNS = [
  /inviato da revolut/i,
  /revitr\d+/i,
  /\brisparmi\b/i,
  /accredita eur risparmi/i,
  /prelievo da pocket/i,
  /bon\. istantaneo a debito edoardo valentini.*risparmi/i,
  /spese acquisto prima casa/i,
  /spese agenzia immobiliare/i,
];

export function isLikelyInternalTransfer(description: string): boolean {
  return INTERNAL_TRANSFER_PATTERNS.some((pattern) => pattern.test(description));
}
