"use client";

import * as React from "react";
import { Check, CreditCard, Loader2, Sparkles } from "lucide-react";
import { ModalWrapper, ModalActions } from "@/src/components/ui/modal-wrapper";
import { Button } from "@/components/ui";
import { useToast } from "@/src/components/ui/toast";
import { updateSubscriptionAction } from "@/src/features/settings/actions";
import { cn } from "@/src/lib";

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
}: SubscriptionModalProps) {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleUpgrade = async () => {
    setIsProcessing(true);

    try {
      const { data, error } = await updateSubscriptionAction(groupId, "upgrade");

      if (error) {
        showToast({
          type: "error",
          title: "Errore",
          description: error,
        });
        setIsProcessing(false);
        return;
      }

      // TODO: Redirect to Stripe checkout when implemented
      showToast({
        type: "info",
        title: "Prossimamente",
        description: data?.message || "L'integrazione con Stripe è in arrivo",
      });

      setIsProcessing(false);
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      showToast({
        type: "error",
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento",
      });
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);

    try {
      const { data, error } = await updateSubscriptionAction(groupId, "cancel");

      if (error) {
        showToast({
          type: "error",
          title: "Errore",
          description: error,
        });
        setIsProcessing(false);
        return;
      }

      showToast({
        type: "success",
        title: "Abbonamento cancellato",
        description: data?.message || "Il tuo abbonamento è stato cancellato",
      });

      onOpenChange(false);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      showToast({
        type: "error",
        title: "Errore",
        description: "Si è verificato un errore durante la cancellazione",
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
      disableOutsideClose={isProcessing}
      footer={
        <ModalActions>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Chiudi
          </Button>
          {isPremium ? (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Elaborazione...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Passa a Premium
                </>
              )}
            </Button>
          )}
        </ModalActions>
      }
    >
      <div className="space-y-4">
        {/* Free Plan */}
        <div
          className={cn(
            "rounded-lg border-2 p-4 transition-all",
            !isPremium
              ? "border-primary bg-primary/5"
              : "border-gray-200 bg-white"
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Piano Gratuito</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">€0 <span className="text-sm font-normal text-gray-600">/mese</span></p>
            </div>
            {!isPremium && (
              <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">
                Piano Attuale
              </span>
            )}
          </div>

          <ul className="space-y-2">
            {[
              "1 gruppo familiare",
              "5 membri massimi",
              "Transazioni illimitate",
              "Budget mensili di base",
              "Report mensili",
            ].map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Premium Plan */}
        <div
          className={cn(
            "rounded-lg border-2 p-4 transition-all relative overflow-hidden",
            isPremium
              ? "border-primary bg-primary/5"
              : "border-gray-200 bg-white"
          )}
        >
          {/* Premium badge */}
          <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12">
            <div className="absolute transform rotate-45 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold py-1 w-32 text-center shadow-md" style={{ top: '35px' }}>
              Premium
            </div>
          </div>

          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Piano Premium
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                €9.99 <span className="text-sm font-normal text-gray-600">/mese</span>
              </p>
            </div>
            {isPremium && (
              <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">
                Piano Attuale
              </span>
            )}
          </div>

          <ul className="space-y-2">
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
            ].map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          {!isPremium && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                <CreditCard className="inline h-3 w-3 mr-1" />
                Pagamento sicuro tramite Stripe
              </p>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
