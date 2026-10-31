import { toDateTime } from '@/lib/utils/date-utils';
import type { RecurringTransactionSeries } from '@/lib/types';
type Definition = Pick<
  RecurringTransactionSeries,
  'type' | 'frequency' | 'due_day' | 'start_date' | 'end_date' | 'amount'
>;
export function validateRecurringDefinition(input: Definition): string | null {
  if (input.type === 'transfer')
    return 'I trasferimenti ricorrenti richiedono un conto destinazione e non sono ancora disponibili.';
  if (!['income', 'expense'].includes(input.type)) return 'Tipo di ricorrenza non valido';
  if (!Number.isFinite(Number(input.amount)) || Number(input.amount) <= 0)
    return "L'importo deve essere maggiore di zero";
  if (!['once', 'weekly', 'biweekly', 'monthly', 'yearly'].includes(input.frequency))
    return 'Frequenza non valida';
  const max = ['weekly', 'biweekly'].includes(input.frequency) ? 7 : 31;
  if (!Number.isInteger(input.due_day) || input.due_day < 1 || input.due_day > max)
    return `Il giorno deve essere un intero tra 1 e ${max}`;
  const start = toDateTime(input.start_date);
  const end = input.end_date ? toDateTime(input.end_date) : null;
  if (!start || (input.end_date && !end)) return 'Data della ricorrenza non valida';
  if (end && end < start) return 'La data finale non può precedere quella iniziale';
  return null;
}
