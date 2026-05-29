import {
  addDays,
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';

export type ReportsTimePreset = 'monthly' | 'weekly' | 'ytd' | 'yearly' | 'custom';

export interface DateWindow {
  start: Date;
  end: Date;
}

function startOfIsoWeek(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

/** Finestra corrente per preset (fine = oggi end-of-day, tranne custom). */
export function getCurrentReportingWindow(
  preset: ReportsTimePreset,
  custom: { start: string; end: string } | null,
  now = new Date()
): DateWindow {
  const end = endOfDay(now);

  if (preset === 'custom' && custom?.start && custom?.end) {
    const s = startOfDay(new Date(custom.start));
    const e = endOfDay(new Date(custom.end));
    if (s.getTime() <= e.getTime()) return { start: s, end: e };
  }

  if (preset === 'monthly') {
    return { start: startOfDay(startOfMonth(now)), end };
  }

  if (preset === 'weekly') {
    return { start: startOfDay(startOfIsoWeek(now)), end };
  }

  if (preset === 'ytd') {
    // Calendar fallback (1 Jan -> today). The page use-case refines the start to the
    // budget period that straddles 1 Jan when one exists.
    return { start: startOfDay(startOfYear(now)), end };
  }

  if (preset === 'yearly') {
    // Rolling year: today - 1 year -> today.
    return { start: startOfDay(subYears(now, 1)), end };
  }

  return { start: startOfDay(startOfMonth(now)), end };
}

/**
 * Finestra precedente per confronto delta: stessa “forma” del preset.
 * - monthly: stesso giorno del mese nel mese precedente (finestra parziale se siamo a metà mese)
 * - weekly: stessi giorni dalla domenica della settimana precedente alla stessa distanza dalla fine settimana corrente
 * - ytd: 1 gen – stesso giorno/mese dell’anno precedente (fallback calendario; il use-case rifinisce)
 * - yearly: anno mobile precedente (oggi-2anni – oggi-1anno)
 * - custom: stessa durata immediatamente prima di `start`
 */
export function getComparisonReportingWindow(
  preset: ReportsTimePreset,
  current: DateWindow,
  now = new Date()
): DateWindow | null {
  if (preset === 'custom') {
    const ms = current.end.getTime() - current.start.getTime();
    if (ms < 0) return null;
    const prevEnd = subDays(current.start, 1);
    const prevStart = new Date(prevEnd.getTime() - ms);
    return { start: startOfDay(prevStart), end: endOfDay(prevEnd) };
  }

  if (preset === 'monthly') {
    const ref = now;
    const dayInMonth = ref.getDate();
    const prevMonthAnchor = subMonths(ref, 1);
    const start = startOfDay(startOfMonth(prevMonthAnchor));
    const cap = endOfMonth(prevMonthAnchor);
    const target = new Date(
      prevMonthAnchor.getFullYear(),
      prevMonthAnchor.getMonth(),
      Math.min(dayInMonth, cap.getDate()),
      23,
      59,
      59,
      999
    );
    return { start, end: endOfDay(target) };
  }

  if (preset === 'weekly') {
    const thisWeekStart = startOfDay(startOfIsoWeek(now));
    const elapsedDays = Math.max(
      0,
      Math.floor((startOfDay(now).getTime() - thisWeekStart.getTime()) / 86400000)
    );
    const prevWeekStart = startOfDay(subWeeks(thisWeekStart, 1));
    const prevWeekEnd = endOfDay(addDays(prevWeekStart, elapsedDays));
    return { start: prevWeekStart, end: prevWeekEnd };
  }

  if (preset === 'ytd') {
    const y = now.getFullYear() - 1;
    const start = startOfDay(new Date(y, 0, 1));
    const end = endOfDay(new Date(y, now.getMonth(), now.getDate()));
    return { start, end };
  }

  if (preset === 'yearly') {
    return { start: startOfDay(subYears(now, 2)), end: endOfDay(subYears(now, 1)) };
  }

  return null;
}
