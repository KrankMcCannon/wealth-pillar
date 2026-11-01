import { formatDateShort } from '@/lib/utils/date-utils';
import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';

export function formatPeriodLabel(
  period: Pick<ReportPeriodSummary, 'startDate' | 'endDate' | 'isOpen'>,
  locale: string,
  ongoingLabel: string
): string {
  const start = formatDateShort(period.startDate, locale);
  const end = period.isOpen ? ongoingLabel : formatDateShort(period.endDate, locale);
  return `${start} – ${end}`;
}
