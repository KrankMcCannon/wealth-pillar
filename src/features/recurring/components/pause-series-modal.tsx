'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Pause, Play } from 'lucide-react';
import { Button, ModalBody, ModalFooter, ModalWrapper, Amount } from '@/components/ui';
import { RecurringTransactionSeries } from '@/lib/types';
import { toggleRecurringSeriesActiveAction } from '@/features/recurring';
import { recurringStyles } from '../theme/recurring-styles';

interface PauseSeriesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  series: RecurringTransactionSeries | null;
  onSuccess?: (series: RecurringTransactionSeries) => void;
}

export function PauseSeriesModal({
  isOpen,
  onOpenChange,
  series,
  onSuccess,
}: Readonly<PauseSeriesModalProps>) {
  const t = useTranslations('Recurring.PauseModal');
  const [isLoading, setIsLoading] = useState(false);

  if (!series) return null;

  const willPause = series.is_active;
  const actionText = willPause ? t('actions.pause') : t('actions.resume');
  const actionTextLower = willPause ? t('actions.pausedLower') : t('actions.resumedLower');

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const result = await toggleRecurringSeriesActiveAction(series.id, !willPause);
      if (result.error) {
        console.error('Failed to toggle series:', result.error);
      } else if (result.data) {
        onSuccess?.(result.data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to toggle series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t('title', { action: actionText })}
      description={willPause ? t('description.pause') : t('description.resume')}
      showCloseButton={!isLoading}
      disableOutsideClose={isLoading}
    >
      <ModalBody>
        <div className={recurringStyles.pauseModal.container}>
          <div className={recurringStyles.pauseModal.card}>
            <p className={recurringStyles.pauseModal.title}>{series.description}</p>
            <Amount
              type={series.type === 'income' ? 'income' : 'expense'}
              size="lg"
              emphasis="strong"
            >
              {series.type === 'income' ? series.amount : -series.amount}
            </Amount>
          </div>

          <div className={recurringStyles.pauseModal.description}>
            {willPause ? (
              <>
                <p>{t('body.pauseMain', { action: actionTextLower })}</p>
                <p className={recurringStyles.pauseModal.descriptionStrong}>
                  {t('body.pauseSecondary')}
                </p>
              </>
            ) : (
              <p>{t('body.resumeMain', { action: actionTextLower })}</p>
            )}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
          {t('buttons.cancel')}
        </Button>
        <Button onClick={handleConfirm} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {actionText}...
            </>
          ) : (
            <>
              {willPause ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {actionText}
            </>
          )}
        </Button>
      </ModalFooter>
    </ModalWrapper>
  );
}
