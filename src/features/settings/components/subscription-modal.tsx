'use client';

import * as React from 'react';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ModalBody, ModalFooter, ModalWrapper } from '@/components/ui/modal-wrapper';
import { toast } from '@/hooks/use-toast';
import { updateSubscriptionAction } from '@/features/settings';
import { cn } from '@/lib';
import { settingsStyles } from '@/features/settings/theme';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SubscriptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  currentPlan: 'free' | 'premium';
  /** ISO 4217 code for displaying plan prices (e.g. user preference currency). */
  billingCurrency?: string;
}

function formatPlanPrice(locale: string, currency: string, amount: number): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: amount === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: amount === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SubscriptionModal Component
 * Modal for managing group subscription (Free vs Premium)
 */
export function SubscriptionModal({
  isOpen,
  onOpenChange,
  groupId,
  currentPlan,
  billingCurrency = 'EUR',
}: Readonly<SubscriptionModalProps>) {
  const t = useTranslations('SettingsModals.Subscription');
  const locale = useLocale();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const freePrice = React.useMemo(
    () => formatPlanPrice(locale, billingCurrency, 0),
    [locale, billingCurrency]
  );
  const premiumPrice = React.useMemo(
    () => formatPlanPrice(locale, billingCurrency, 9.99),
    [locale, billingCurrency]
  );

  const handleUpgrade = async () => {
    setIsProcessing(true);

    try {
      const { data, error } = await updateSubscriptionAction(groupId, 'upgrade');

      if (error) {
        toast({
          title: t('toast.errorTitle'),
          description: error,
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      // TODO: Redirect to Stripe checkout when implemented
      toast({
        title: t('toast.comingSoonTitle'),
        description: data?.message || t('toast.comingSoonDescription'),
        variant: 'info',
      });

      setIsProcessing(false);
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: t('toast.errorTitle'),
        description: t('toast.upgradeErrorDescription'),
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);

    try {
      const { data, error } = await updateSubscriptionAction(groupId, 'cancel');

      if (error) {
        toast({
          title: t('toast.errorTitle'),
          description: error,
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      toast({
        title: t('toast.cancelledTitle'),
        description: data?.message || t('toast.cancelledDescription'),
        variant: 'success',
      });

      onOpenChange(false);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: t('toast.errorTitle'),
        description: t('toast.cancelErrorDescription'),
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const isPremium = currentPlan === 'premium';

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
      titleClassName={settingsStyles.modals.title}
      descriptionClassName={settingsStyles.modals.description}
      disableOutsideClose={isProcessing}
      repositionInputs={false}
    >
      <ModalBody>
        <div className={settingsStyles.modals.subscription.container}>
          <div
            className={cn(
              settingsStyles.modals.subscription.cardBase,
              isPremium
                ? settingsStyles.modals.subscription.cardIdle
                : settingsStyles.modals.subscription.cardActive
            )}
          >
            <div className={settingsStyles.modals.subscription.headerRow}>
              <div className="min-w-0">
                <h3 className={settingsStyles.modals.subscription.planTitle}>{t('free.title')}</h3>
                <p className={settingsStyles.modals.subscription.planPrice}>
                  {freePrice}{' '}
                  <span className={settingsStyles.modals.subscription.planPriceSuffix}>
                    {t('perMonth')}
                  </span>
                </p>
              </div>
              {!isPremium && (
                <span className={settingsStyles.modals.subscription.planBadge}>
                  {t('currentPlanBadge')}
                </span>
              )}
            </div>

            <ul className={settingsStyles.modals.subscription.list}>
              {[
                t('free.features.familyGroup'),
                t('free.features.maxMembers'),
                t('free.features.unlimitedTransactions'),
                t('free.features.basicMonthlyBudgets'),
                t('free.features.monthlyReports'),
              ].map((feature) => (
                <li key={feature} className={settingsStyles.modals.subscription.listItem}>
                  <Check className={settingsStyles.modals.subscription.listIcon} />
                  <span
                    className={cn(settingsStyles.modals.subscription.listText, 'wrap-break-word')}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={cn(
              settingsStyles.modals.subscription.cardBase,
              isPremium
                ? settingsStyles.modals.subscription.cardActive
                : settingsStyles.modals.subscription.cardIdle
            )}
          >
            <div className={settingsStyles.modals.subscription.headerRow}>
              <div className="min-w-0">
                <div className={settingsStyles.modals.subscription.premiumTitleRow}>
                  <h3 className={settingsStyles.modals.subscription.planTitle}>
                    {t('premium.title')}
                  </h3>
                  <span className={settingsStyles.modals.subscription.premiumLabelBadge}>
                    {t('premium.badge')}
                  </span>
                </div>
                <p className={settingsStyles.modals.subscription.planPrice}>
                  {premiumPrice}{' '}
                  <span className={settingsStyles.modals.subscription.planPriceSuffix}>
                    {t('perMonth')}
                  </span>
                </p>
              </div>
              {isPremium && (
                <span className={settingsStyles.modals.subscription.planBadge}>
                  {t('currentPlanBadge')}
                </span>
              )}
            </div>

            <ul className={settingsStyles.modals.subscription.list}>
              {[
                t('premium.features.unlimitedFamilyGroups'),
                t('premium.features.unlimitedMembers'),
                t('premium.features.unlimitedTransactions'),
                t('premium.features.advancedBudgets'),
                t('premium.features.detailedReports'),
                t('premium.features.dataExport'),
                t('premium.features.prioritySupport'),
                t('premium.features.advancedPushNotifications'),
                t('premium.features.multiDeviceSync'),
              ].map((feature) => (
                <li key={feature} className={settingsStyles.modals.subscription.listItem}>
                  <Check className={settingsStyles.modals.subscription.listIcon} />
                  <span
                    className={cn(settingsStyles.modals.subscription.listText, 'wrap-break-word')}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {!isPremium && (
              <div className={settingsStyles.modals.subscription.secureRow}>
                <p className={settingsStyles.modals.subscription.secureText}>
                  <CreditCard className={settingsStyles.modals.subscription.secureIcon} />
                  {t('securePayment')}
                </p>
              </div>
            )}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isProcessing}
          className={settingsStyles.modals.actionsButton}
        >
          {t('closeButton')}
        </Button>
        {isPremium ? (
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className={cn(
              settingsStyles.modals.actionsButton,
              settingsStyles.modals.subscription.cancelButton
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className={settingsStyles.modals.loadingIcon} />
                {t('processingButton')}
              </>
            ) : (
              t('cancelSubscriptionButton')
            )}
          </Button>
        ) : (
          <Button
            onClick={handleUpgrade}
            disabled={isProcessing}
            className={settingsStyles.modals.actionsButton}
          >
            {isProcessing ? (
              <>
                <Loader2 className={settingsStyles.modals.loadingIcon} />
                {t('processingButton')}
              </>
            ) : (
              t('upgradeButton')
            )}
          </Button>
        )}
      </ModalFooter>
    </ModalWrapper>
  );
}
