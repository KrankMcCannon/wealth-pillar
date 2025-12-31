"use client";

import { Badge } from "@/src/components/ui";
import { CategoryIcon, iconSizes, Transaction } from "@/src/lib";
import { formatCurrency } from "@/lib/utils";
import { memo, useEffect, useRef } from "react";
import { motion, useMotionValue, PanInfo, animate } from "framer-motion";
import {
  transactionStyles,
  getTransactionAmountColor,
  getTransactionIconColor,
  getTransactionBadgeColor
} from "../theme";
import { transactionInteraction } from "../theme/transaction-tokens";

interface TransactionRowProps {
  transaction: Transaction;
  accountNames: Record<string, string>;
  variant: "regular" | "recurrent";
  context: "due" | "informative";
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  getCategoryLabel: (key: string) => string;
  isOpen: boolean;
  onSwipe: (id: string | null) => void;
}

/**
 * Individual Transaction Row Component
 * Optimized for performance and smooth swiping using Framer Motion
 *
 * Features:
 * - Swipe-to-delete gesture with configurable thresholds
 * - Smart tap detection (distinguishes swipe from tap)
 * - Smooth spring animations
 * - Centralized styling from theme system
 *
 * All animation constants and styles are defined in the theme system,
 * making it easy to tune behavior across all transaction rows.
 */
export const TransactionRow = memo(({
  transaction,
  accountNames,
  variant,
  context,
  onEditTransaction,
  onDeleteTransaction,
  getCategoryLabel,
  isOpen,
  onSwipe,
}: TransactionRowProps) => {
  const x = useMotionValue(0);
  const hasDragged = useRef(false); // Traccia se c'è stato uno slide per evitare apertura modale

  const { swipe, spring, drag, tap } = transactionInteraction;

  // Sync internal x with external isOpen state
  // This is the single source of truth for the row position
  useEffect(() => {
    const targetX = isOpen ? -swipe.actionWidth : 0;
    if (x.get() !== targetX) {
      animate(x, targetX, {
        type: "spring",
        stiffness: spring.stiffness,
        damping: spring.damping
      });
    }
  }, [isOpen, x, swipe.actionWidth, spring.stiffness, spring.damping]);

  const handleDragStart = () => {
    hasDragged.current = false; // Reset all'inizio del drag
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const currentX = x.get();
    const velocityX = info.velocity.x;
    const dragDistance = Math.abs(info.offset.x);

    // Se ha draggato più di 10px, considera come slide (non tap)
    if (dragDistance > 10) {
      hasDragged.current = true;
    }

    if (isOpen) {
      // Card è aperta: swipe a destra per chiudere (UX moderna iOS/Android)
      // Chiudi se: swipato verso destra (anche poco) O qualsiasi velocità positiva
      // Logica: se stai swipando verso destra (chiusura), è intenzionale → chiudi
      const shouldClose = currentX > -swipe.actionWidth * 0.7 || velocityX > 10;

      if (shouldClose) {
        onSwipe(null); // Chiudi
      } else {
        onSwipe(transaction.id); // Rimani aperto
      }
    } else {
      // Card è chiusa: swipe a sinistra per aprire
      const shouldOpen = currentX < -swipe.threshold || velocityX < swipe.velocityThreshold;

      if (shouldOpen) {
        onSwipe(transaction.id); // Apri
      } else {
        onSwipe(null); // Rimani chiuso
      }
    }

    // Reset hasDragged dopo breve delay per permettere a handleTap di leggerlo
    setTimeout(() => {
      hasDragged.current = false;
    }, 100);
  };

  const handleTap = () => {
    // Se ha appena fatto uno slide, ignora il tap (previene apertura modale accidentale)
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }

    const currentX = x.get();

    // Se card è aperta o parzialmente aperta
    if (isOpen || currentX < -tap.threshold) {
      // Chiudi lo swipe IMMEDIATAMENTE (senza delay)
      onSwipe(null);

      // Apri modale di aggiornamento dopo delay per animazione fluida
      setTimeout(() => {
        onEditTransaction?.(transaction);
      }, 200); // 200ms per completare animazione di chiusura

      return;
    }

    // Card chiusa: apri direttamente la modale
    onEditTransaction?.(transaction);
  };

  // Calculate days until due for recurrent transactions
  const getDaysUntilDue = (): number => {
    if (!transaction.frequency || transaction.frequency === "once") return Infinity;
    // TODO: Implement actual date calculation based on transaction frequency
    return 0;
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <div className={transactionStyles.transactionRow.wrapper}>
      {/* Background Action Layer */}
      {onDeleteTransaction && (
        <div
          className={transactionStyles.transactionRow.deleteLayer}
          style={{
            width: `${swipe.actionWidth}px`,
            // Nasconde il bottone se la row non è esplicitamente aperta
            // Previene visualizzazione durante transizioni o tap accidentali
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none'
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Tap sull'area fuori dal bottone chiude lo swipe (UX moderna)
            if (isOpen) {
              onSwipe(null);
            }
          }}
        >
          <div
            className={transactionStyles.transactionRow.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTransaction(transaction.id);
            }}
          >
            Elimina
          </div>
        </div>
      )}

      {/* Foreground Card Content */}
      <motion.div
        drag={onDeleteTransaction ? "x" : false}
        dragConstraints={{ left: -swipe.actionWidth, right: 0 }}
        dragElastic={drag.elastic}
        dragMomentum={false}
        style={{ x }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        onClick={(e) => e.stopPropagation()}
        className={transactionStyles.transactionRow.content}
      >
        <div className={transactionStyles.transactionRow.contentLayout}>
          <div className={transactionStyles.transactionRow.leftSection}>
            {/* Category Icon */}
            <div
              className={`${transactionStyles.transactionRow.icon} ${getTransactionIconColor(
                variant,
                context,
                daysUntilDue
              )}`}
            >
              <CategoryIcon categoryKey={transaction.category} size={iconSizes.sm} />
            </div>

            {/* Transaction Details */}
            <div className={transactionStyles.transactionRow.details}>
              <h4 className={transactionStyles.transactionRow.title}>
                {transaction.description}
              </h4>

              <div className={transactionStyles.transactionRow.metadata}>
                <span className={transactionStyles.transactionRow.metadataText}>
                  {getCategoryLabel(transaction.category)}
                </span>

                {/* Account name for regular transactions */}
                {variant === "regular" && transaction.account_id && accountNames[transaction.account_id] && (
                  <>
                    <span className={transactionStyles.transactionRow.separator}>•</span>
                    <span className={transactionStyles.transactionRow.metadataSecondary}>
                      {accountNames[transaction.account_id]}
                    </span>
                  </>
                )}

                {/* Frequency badge for recurrent transactions */}
                {variant === "recurrent" && transaction.frequency && (
                  <>
                    <span className={transactionStyles.transactionRow.separator}>•</span>
                    <Badge
                      variant="outline"
                      className={`${transactionStyles.transactionRow.badge} ${getTransactionBadgeColor(
                        variant,
                        context,
                        daysUntilDue
                      )}`}
                    >
                      {transaction.frequency}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Amount Section */}
          <div className={transactionStyles.transactionRow.rightSection}>
            <p className={`${transactionStyles.transactionRow.amount} ${getTransactionAmountColor(transaction, variant)}`}>
              {formatCurrency(Math.abs(transaction.amount))}
            </p>
            {variant === "recurrent" && transaction.frequency && transaction.frequency !== "once" && (
              <p className={`${transactionStyles.transactionRow.amountSecondary} ${getTransactionAmountColor(transaction, variant)}`}>
                {transaction.frequency}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
});

TransactionRow.displayName = "TransactionRow";
