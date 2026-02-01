"use client";

import { useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import {
  Button,
  ModalBody,
  ModalFooter,
  ModalWrapper,
  Amount,
} from "@/components/ui";
import { RecurringTransactionSeries } from "@/lib/types";
import { toggleRecurringSeriesActiveAction } from "@/features/recurring";
import { recurringStyles } from "../theme/recurring-styles";

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
  const [isLoading, setIsLoading] = useState(false);

  if (!series) return null;

  const willPause = series.is_active;
  const actionText = willPause ? "Mettere in pausa" : "Riprendere";
  const actionTextLower = willPause ? "messa in pausa" : "ripresa";

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const result = await toggleRecurringSeriesActiveAction(
        series.id,
        !willPause,
      );
      if (result.error) {
        console.error("Failed to toggle series:", result.error);
      } else if (result.data) {
        onSuccess?.(result.data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to toggle series:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`${actionText} serie ricorrente`}
      description={
        willPause
          ? "La serie non genererà più transazioni automatiche"
          : "La serie riprenderà a generare transazioni"
      }
      showCloseButton={!isLoading}
      disableOutsideClose={isLoading}
    >
      <ModalBody>
        <div className={recurringStyles.pauseModal.container}>
          <div className={recurringStyles.pauseModal.card}>
            <p className={recurringStyles.pauseModal.title}>
              {series.description}
            </p>
            <Amount
              type={series.type === "income" ? "income" : "expense"}
              size="lg"
              emphasis="strong"
            >
              {series.type === "income" ? series.amount : -series.amount}
            </Amount>
          </div>

          <div className={recurringStyles.pauseModal.description}>
            {willPause ? (
              <>
                <p>
                  La serie ricorrente verrà {actionTextLower}. Non verranno più
                  create transazioni automatiche finché non la riattiverai.
                </p>
                <p className={recurringStyles.pauseModal.descriptionStrong}>
                  Le transazioni già create rimarranno invariate.
                </p>
              </>
            ) : (
              <p>
                La serie ricorrente verrà {actionTextLower}. Riprenderà a
                generare transazioni automatiche secondo la frequenza impostata.
              </p>
            )}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          Annulla
        </Button>
        <Button onClick={handleConfirm} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {actionText}...
            </>
          ) : (
            <>
              {willPause ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {actionText}
            </>
          )}
        </Button>
      </ModalFooter>
    </ModalWrapper>
  );
}
