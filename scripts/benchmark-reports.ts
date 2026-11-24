import { isDeepStrictEqual } from 'node:util';
import type { Account, Category, Transaction } from '@/lib/types';
import {
  buildReportsSectionViewModel,
  computeUserFlows,
  prepareReportsCalculations,
  type DateWindow,
} from '@/server/use-cases/reports/report.logic';

const users = Array.from({ length: 6 }, (_, index) => `user-${index + 1}`);
const accounts = users.flatMap((userId, index) => [
  {
    id: `spend-${index}`,
    name: `Spend ${index}`,
    type: 'checking',
    user_ids: [userId],
    group_id: 'group-1',
    balance: 10_000 + index,
    created_at: '',
    updated_at: '',
  },
  {
    id: `reserve-${index}`,
    name: `Reserve ${index}`,
    type: 'savings',
    user_ids: [userId],
    group_id: 'group-1',
    balance: 20_000 + index,
    created_at: '',
    updated_at: '',
  },
]) as Account[];
const categories = [
  {
    id: 'food',
    key: 'food',
    label: 'Food',
    icon: 'Circle',
    color: '#000000',
    group_id: 'group-1',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'salary',
    key: 'salary',
    label: 'Salary',
    icon: 'Circle',
    color: '#ffffff',
    group_id: 'group-1',
    created_at: '',
    updated_at: '',
  },
] as Category[];
const transactions = Array.from({ length: 5_000 }, (_, index) => {
  const user = users[index % users.length]!;
  const transfer = index % 7 === 0;
  const savingsTransfer = transfer && index % 14 === 0;
  const type: Transaction['type'] = transfer ? 'transfer' : index % 3 === 0 ? 'income' : 'expense';
  return {
    id: `transaction-${index}`,
    description: `Synthetic ${index}`,
    amount: Number(((index % 317) + 1).toFixed(2)),
    type,
    category: index % 3 === 0 ? 'salary' : 'food',
    date: index % 2 === 0 ? '2026-11-15' : '2026-10-15',
    user_id: user,
    account_id: savingsTransfer ? `spend-${index % users.length}` : `spend-${index % users.length}`,
    to_account_id: transfer
      ? `${savingsTransfer ? 'reserve' : 'spend'}-${(index + 1) % users.length}`
      : null,
    frequency: 'once' as const,
    recurring_series_id: null,
    group_id: 'group-1',
    created_at: '',
    updated_at: '',
  };
});
const currentWindow: DateWindow = {
  start: new Date('2026-11-01T00:00:00+01:00'),
  end: new Date('2026-11-30T23:59:59+01:00'),
};
const comparisonWindow: DateWindow = {
  start: new Date('2026-10-01T00:00:00+02:00'),
  end: new Date('2026-10-31T23:59:59+01:00'),
};

function median(values: number[]): number {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
}

function runLegacy(userIds: string[]) {
  const sections = {
    all: buildReportsSectionViewModel(
      transactions,
      accounts,
      categories,
      userIds,
      currentWindow,
      comparisonWindow
    ),
  } as Record<string, ReturnType<typeof buildReportsSectionViewModel>>;
  for (const userId of userIds) {
    const userFlows = computeUserFlows(transactions, accounts, userIds, currentWindow);
    sections[userId] = buildReportsSectionViewModel(
      transactions,
      accounts,
      categories,
      userIds,
      currentWindow,
      comparisonWindow,
      userId,
      userFlows
    );
  }
  return sections;
}

function runPrepared(userIds: string[]) {
  const prepared = prepareReportsCalculations(transactions, accounts, [
    currentWindow,
    comparisonWindow,
  ]);
  const userFlows = computeUserFlows(transactions, accounts, userIds, currentWindow, prepared);
  const sections = {
    all: buildReportsSectionViewModel(
      transactions,
      accounts,
      categories,
      userIds,
      currentWindow,
      comparisonWindow,
      undefined,
      undefined,
      prepared
    ),
  } as Record<string, ReturnType<typeof buildReportsSectionViewModel>>;
  for (const userId of userIds) {
    sections[userId] = buildReportsSectionViewModel(
      transactions,
      accounts,
      categories,
      userIds,
      currentWindow,
      comparisonWindow,
      userId,
      userFlows,
      prepared
    );
  }
  return sections;
}

for (const count of [1, 2, 6]) {
  const userIds = users.slice(0, count);
  const legacySamples: number[] = [];
  const preparedSamples: number[] = [];
  let legacyOutput: ReturnType<typeof runLegacy> | undefined;
  let preparedOutput: ReturnType<typeof runPrepared> | undefined;

  for (let iteration = 0; iteration < 6; iteration += 1) {
    let start = performance.now();
    legacyOutput = runLegacy(userIds);
    const legacyDuration = performance.now() - start;
    start = performance.now();
    preparedOutput = runPrepared(userIds);
    const preparedDuration = performance.now() - start;
    if (iteration > 0) {
      legacySamples.push(legacyDuration);
      preparedSamples.push(preparedDuration);
    }
  }

  if (!isDeepStrictEqual(legacyOutput, preparedOutput)) {
    throw new Error(`Report output changed for ${count} member(s)`);
  }
  process.stdout.write(
    `${JSON.stringify({
      rows: transactions.length,
      members: count,
      legacyMedianMs: median(legacySamples),
      preparedMedianMs: median(preparedSamples),
      equivalentOutput: true,
    })}\n`
  );
}
