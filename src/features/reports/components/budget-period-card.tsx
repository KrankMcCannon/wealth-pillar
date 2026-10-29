import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';

export function derivePeriodOnTrack(period: ReportPeriodSummary): boolean {
  return period.remaining >= 0;
}
