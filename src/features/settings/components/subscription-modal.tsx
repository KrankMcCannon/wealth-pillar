"use client";

import * as React from "react";
import { Check, CreditCard, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalBody, ModalFooter, ModalWrapper } from "@/components/ui/modal-wrapper";
import { toast } from "@/hooks/use-toast";
import { updateSubscriptionAction } from "@/features/settings";
import { cn } from "@/lib";
import { settingsStyles } from "@/features/settings/theme";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SubscriptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  currentPlan: "free" | "premium";
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
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleUpgrade = async () => {
    setIsProcessing(true);

    try {
      const { data, error } = await updateSubscriptionAction(groupId, "upgrade");

      if (error) {
        toast({
          title: "Errore",
          description: error,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // TODO: Redirect to Stripe checkout when implemented
      toast({
        title: "Prossimamente",
        description: data?.message || "L'integrazione con Stripe è in arrivo",
        variant: "info",
      });

      setIsProcessing(false);
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);

    try {
      const { data, error } = await updateSubscriptionAction(groupId, "cancel");

      if (error) {
        toast({
          title: "Errore",
          description: error,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      toast({
        title: "Abbonamento cancellato",
        description: data?.message || "Il tuo abbonamento è stato cancellato",
        variant: "success",
      });

      onOpenChange(false);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la cancellazione",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const isPremium = currentPlan === "premium";

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Gestione Abbonamento"
      description="Scegli il piano più adatto alle tue esigenze"
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
                <h3 className={settingsStyles.modals.subscription.planTitle}>Piano Gratuito</h3>
                <p className={settingsStyles.modals.subscription.planPrice}>
                  €0 <span className={settingsStyles.modals.subscription.planPriceSuffix}>/mese</span>
                </p>
              </div>
              {!isPremium && (
                <span className={settingsStyles.modals.subscription.planBadge}>
                  Piano Attuale
                </span>
              )}
            </div>

            <ul className={settingsStyles.modals.subscription.list}>
              {[
                "1 gruppo familiare",
                "5 membri massimi",
                "Transazioni illimitate",
                "Budget mensili di base",
                "Report mensili",
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
                Premium
              </div>
            </div>

            <div className={settingsStyles.modals.subscription.headerRow}>
              <div>
                <h3 className={settingsStyles.modals.subscription.premiumTitleRow}>
                  Piano Premium
                  <Sparkles className={settingsStyles.modals.subscription.premiumIcon} />
                </h3>
                <p className={settingsStyles.modals.subscription.planPrice}>
                  €9.99 <span className={settingsStyles.modals.subscription.planPriceSuffix}>/mese</span>
                </p>
              </div>
              {isPremium && (
                <span className={settingsStyles.modals.subscription.planBadge}>
                  Piano Attuale
                </span>
              )}
            </div>

            <ul className={settingsStyles.modals.subscription.list}>
              {[
                "Gruppi familiari illimitati",
                "Membri illimitati",
                "Transazioni illimitate",
                "Budget avanzati con categorie personalizzate",
                "Report dettagliati e analisi",
                "Export dati in CSV/PDF",
                "Supporto prioritario",
                "Notifiche push avanzate",
                "Sincronizzazione multi-dispositivo",
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
                  Pagamento sicuro tramite Stripe
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
          Chiudi
        </Button>
        {isPremium ? (
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className={cn(settingsStyles.modals.actionsButton, settingsStyles.modals.subscription.cancelButton)}
          >
            {isProcessing ? (
              <>
                <Loader2 className={settingsStyles.modals.loadingIcon} />
                Elaborazione...
              </>
            ) : (
              "Cancella Abbonamento"
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
                Elaborazione...
              </>
            ) : (
              <>
                <Sparkles className={settingsStyles.modals.iconSmall} />
                Passa a Premium
              </>
            )}
          </Button>
        )}
      </ModalFooter>
    </ModalWrapper>
  );
}
