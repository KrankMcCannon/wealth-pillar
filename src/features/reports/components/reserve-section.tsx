'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { stitchHome, stitchReports } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';
import type { NetSavingsResult } from '@/server/use-cases/shared/savings.logic';

interface ReserveSectionProps {
  savings: NetSavingsResult;
  movementsHref: string;
}

export function ReserveSection({ savings, movementsHref }: ReserveSectionProps) {
  const t = useTranslations('Reports.Reserve');
  const { format: formatMoney } = useFormatCurrency();
  const empty = savings.count === 0;
  const netSigned = `${savings.net > 0 ? '+' : ''}${formatMoney(savings.net)}`;

  return (
    <section aria-labelledby="reports-reserve-heading" className={stitchHome.scanSection}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="reports-reserve-heading" className={stitchHome.scanSectionTitle}>
          {t('title')}
        </h3>
        {!empty ? (
          <span
            className={cn(
              'text-base font-semibold tabular-nums',
              savings.net < 0 ? stitchHome.amountExpense : stitchHome.amountIncome
            )}
            aria-label={netSigned}
          >
            {netSigned}
          </span>
        ) : null}
      </div>
      {empty ? (
        <div className={`${stitchReports.emptyWell} flex flex-col items-center gap-2`}>
          <p>{t('empty')}</p>
          <Link href="/transactions" className={stitchHome.viewAllLink}>
            {t('addTransfer')}
          </Link>
        </div>
      ) : (
        <>
          <p className={stitchReports.kpiPair}>
            {t('savingsMeta', {
              deposits: formatMoney(savings.deposits),
              withdrawals: formatMoney(savings.withdrawals),
            })}
          </p>
          <div className={stitchReports.periodActionGroup}>
            <Link
              href={movementsHref}
              className={stitchReports.periodActionRow}
              aria-label={t('viewMovesAria', { count: savings.count })}
            >
              <span>{t('viewMoves', { count: savings.count })}</span>
              <ChevronRight className={stitchReports.rankingChevron} aria-hidden />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
