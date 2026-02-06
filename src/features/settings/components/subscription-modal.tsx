'use client';

import * as React from 'react';
import { Check, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SubscriptionModal Component
 * Modal for managing group subscription (Free vs Premium)
 *
 * Features:
 * - Display Free and Premium plans
 * - Feature comparison
 * - Upgrade/Cancel subscription
 * - Current plan indicator
 * - Stripe integration placeholder
 *
 * @example
 * ```tsx
 * <SubscriptionModal
 *   isOpen={showModal}
 *   onOpenChange={setShowModal}
 *   groupId={currentUser.group_id}
 *   currentPlan="free"
 * />
 * ```
 */
export function SubscriptionModal({
  isOpen,
  onOpenChange,
  groupId,
  currentPlan,
}: Readonly<SubscriptionModalProps>) {
  const t = useTranslations('SettingsModals.Subscription');
  const [isProcessing, setIsProcessing] = React.useState(false);

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
          {/* Free Plan */}
          <div
            className={cn(
              settingsStyles.modals.subscription.cardBase,
              isPremium
                ? settingsStyles.modals.subscription.cardIdle
                : settingsStyles.modals.subscription.cardActive
            )}
          >
            <div className={settingsStyles.modals.subscription.headerRow}>
              <div>
                <h3 className={settingsStyles.modals.subscription.planTitle}>{t('free.title')}</h3>
                <p className={settingsStyles.modals.subscription.planPrice}>
                  €0{' '}
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
                  <span className={settingsStyles.modals.subscription.listText}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Plan */}
          <div
            className={cn(
              `${settingsStyles.modals.subscription.cardBase} relative overflow-hidden`,
              isPremium
                ? settingsStyles.modals.subscription.cardActive
                : settingsStyles.modals.subscription.cardIdle
            )}
          >
            {/* Premium badge */}
            <div className={settingsStyles.modals.subscription.premiumBadgeWrap}>
              <div
                className={settingsStyles.modals.subscription.premiumBadge}
                style={settingsStyles.modals.subscription.premiumBadgeStyle}
              >
                {t('premium.badge')}
              </div>
            </div>

            <div className={settingsStyles.modals.subscription.headerRow}>
              <div>
                <h3 className={settingsStyles.modals.subscription.premiumTitleRow}>
                  {t('premium.title')}
                  <Sparkles className={settingsStyles.modals.subscription.premiumIcon} />
                </h3>
                <p className={settingsStyles.modals.subscription.planPrice}>
                  €9.99{' '}
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
                  <span className={settingsStyles.modals.subscription.listText}>{feature}</span>
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
              <>
                <Sparkles className={settingsStyles.modals.iconSmall} />
                {t('upgradeButton')}
              </>
            )}
          </Button>
        )}
      </ModalFooter>
    </ModalWrapper>
  );
}
