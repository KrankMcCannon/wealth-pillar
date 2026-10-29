/**
 * Which ledger day sits under the sticky spendable bar.
 * Days are newest-first. Unmeasured groups are skipped so a first paint
 * does not snap to the oldest day.
 */
export function pickVisibleLedgerDay(
  daysNewestFirst: ReadonlyArray<{ isoDate: string }>,
  bottoms: ReadonlyMap<string, number>,
  line: number,
  newestDay: string | undefined
): string | undefined {
  let firstBelowLine: string | undefined;
  let measured = false;

  for (const day of daysNewestFirst) {
    const bottom = bottoms.get(day.isoDate);
    if (bottom === undefined) continue;
    measured = true;
    if (firstBelowLine === undefined && bottom > line + 2) {
      firstBelowLine = day.isoDate;
    }
  }

  if (firstBelowLine) return firstBelowLine;
  if (measured) return daysNewestFirst[daysNewestFirst.length - 1]?.isoDate ?? newestDay;
  return newestDay;
}
