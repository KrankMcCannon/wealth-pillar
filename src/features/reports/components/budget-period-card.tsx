import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';

export function derivePeriodOnTrack(period: ReportPeriodSummary): boolean {
  return period.spendable.endBalance >= period.spendable.startBalance;
}
