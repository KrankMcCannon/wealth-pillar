"use client";

import { Badge, Button, Card } from "@/src/components/ui";
import { CategoryIcon, iconSizes, Transaction, Category } from "@/src/lib";
import { CategoryService } from "@/lib/services";
import { formatCurrency } from "@/lib/utils";
import { useRef, useState } from "react";

interface GroupedTransactionCardProps {
  transactions: Transaction[];
  accountNames: Record<string, string>;
  variant?: "regular" | "recurrent";
  showHeader?: boolean;
  totalAmount?: number;
  context?: "due" | "informative"; // New context parameter
  categories?: Category[]; // Categories for displaying labels
  onEditTransaction?: (transaction: Transaction) => void; // Callback for editing
  onDeleteTransaction?: (transactionId: string) => void; // Callback for deleting
}

export function GroupedTransactionCard({
  transactions,
  accountNames,
  variant = "regular",
  showHeader = false,
  totalAmount,
  context = "informative",
  categories = [],
  onEditTransaction,
  onDeleteTransaction,
}: GroupedTransactionCardProps) {
  const [openTransactionId, setOpenTransactionId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ id: string | null; offset: number }>({
    id: null,
    offset: 0,
  });
  const swipeStartRef = useRef({ id: "", x: 0, y: 0, moved: false });
  const ACTION_WIDTH = 80;
  const SWIPE_OPEN_THRESHOLD = ACTION_WIDTH / 2;
  const RESISTANCE_START = ACTION_WIDTH * 0.6;
  const DRAG_ACTIVATE_THRESHOLD = 8;

  if (!transactions.length) return null;
  // Helper to get category label
  const getCategoryLabel = (categoryKey: string) => {
    return CategoryService.getCategoryLabel(categories, categoryKey);
  };

  const getCardStyles = () => {
    switch (variant) {
      case "recurrent":
        if (context === "due") {
          // For due context, we'll determine background based on most urgent transaction
          const mostUrgentDays = Math.min(...transactions.map((tx) => getDaysUntilDue(tx)));
          if (mostUrgentDays <= 1)
            return "py-0 bg-destructive/10 backdrop-blur-sm border border-destructive/30 hover:shadow-xl hover:shadow-destructive/20";
          if (mostUrgentDays <= 3)
            return "py-0 bg-warning/10 backdrop-blur-sm border border-warning/30 hover:shadow-xl hover:shadow-warning/20";
          if (mostUrgentDays <= 7)
            return "py-0 bg-warning/10 backdrop-blur-sm border border-warning/30 hover:shadow-xl hover:shadow-warning/20";
          return "py-0 bg-primary/10 backdrop-blur-sm border border-primary/20 hover:shadow-xl hover:shadow-primary/20";
        } else {
          return "py-0 bg-primary/10 backdrop-blur-sm border border-primary/20 hover:shadow-xl hover:shadow-primary/20";
        }
      default:
        return "py-0 bg-card backdrop-blur-sm border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300";
    }
  };

  const getSectionHeaderStyles = () => {
    switch (variant) {
      case "recurrent":
        return "bg-primary/10 border-b border-primary/20";
      default:
        return "bg-primary/5 border-b border-primary/20";
    }
  };

  const getTotalAmountColor = () => {
    if (variant === "recurrent") return "text-primary";
    return (totalAmount || 0) >= 0 ? "text-primary" : "text-destructive";
  };

  const getDaysUntilDue = (transaction: Transaction): number => {
    // Legacy support for displaying recurring transaction info
    // In the new architecture, this information comes from RecurringTransactionSeries
    if (!transaction.frequency || transaction.frequency === "once") return Infinity;
    return 0; // Default for display purposes
  };

  const getTransactionAmountColor = (transaction: Transaction) => {
    if (variant === "recurrent") {
      // In due context, use urgency colors; in informative context, use standard purple
      if (context === "due") {
        const daysUntilDue = getDaysUntilDue(transaction);
        if (daysUntilDue <= 1) return "text-destructive"; // Due today/tomorrow
        if (daysUntilDue <= 3) return "text-warning"; // Due in 2-3 days
        if (daysUntilDue <= 7) return "text-warning/80"; // Due this week
        return "text-primary"; // Normal
      } else {
        return "text-primary"; // Standard primary for informative context
      }
    }
    // Transfer type uses neutral color (not calculated in daily totals)
    if (transaction.type === "transfer") return "text-primary";
    return transaction.type === "income" ? "text-success" : "text-destructive";
  };

  const getTransactionIconColor = (transaction: Transaction) => {
    if (variant === "recurrent") {
      if (context === "due") {
        const daysUntilDue = getDaysUntilDue(transaction);
        if (daysUntilDue <= 1) return "bg-destructive/10 text-destructive"; // Due today/tomorrow
        if (daysUntilDue <= 3) return "bg-warning/10 text-warning"; // Due in 2-3 days
        if (daysUntilDue <= 7) return "bg-warning/5 text-warning/80"; // Due this week
        return "bg-primary/10 text-primary"; // Normal
      } else {
        return "bg-primary/10 text-primary"; // Standard primary for informative context
      }
    }
    // All transaction types use primary color
    return "bg-primary/10 text-primary";
  };

  const getTransactionBadgeColor = (transaction: Transaction) => {
    if (variant === "recurrent") {
      if (context === "due") {
        const daysUntilDue = getDaysUntilDue(transaction);
        if (daysUntilDue <= 1) return "border-destructive/30 text-destructive bg-destructive/10"; // Due today/tomorrow
        if (daysUntilDue <= 3) return "border-warning/30 text-warning bg-warning/10"; // Due in 2-3 days
        if (daysUntilDue <= 7) return "border-warning/20 text-warning/80 bg-warning/5"; // Due this week
        return "border-primary/20 text-primary bg-primary/10"; // Normal
      } else {
        return "border-primary/20 text-primary bg-primary/10"; // Standard primary for informative context
      }
    }
    return "";
  };

  const handlePointerDown = (transactionId: string, event: React.PointerEvent<HTMLDivElement>) => {
    if (openTransactionId && openTransactionId !== transactionId) {
      setOpenTransactionId(null);
    }
    swipeStartRef.current = {
      id: transactionId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (transactionId: string, event: React.PointerEvent<HTMLDivElement>) => {
    if (swipeStartRef.current.id !== transactionId) return;
    const deltaX = event.clientX - swipeStartRef.current.x;
    const deltaY = event.clientY - swipeStartRef.current.y;

    if (Math.abs(deltaX) < Math.abs(deltaY)) return;

    if (!swipeStartRef.current.moved && Math.abs(deltaX) < DRAG_ACTIVATE_THRESHOLD) {
      return;
    }

    swipeStartRef.current.moved = true;

    if (deltaX >= 0) {
      setDragState({ id: transactionId, offset: 0 });
      return;
    }

    const abs = Math.abs(deltaX);
    const resisted = abs > RESISTANCE_START
      ? RESISTANCE_START + (abs - RESISTANCE_START) / 3
      : abs;
    const clamped = -Math.min(resisted, ACTION_WIDTH);
    setDragState({ id: transactionId, offset: clamped });
  };

  const handlePointerUp = (transactionId: string, event: React.PointerEvent<HTMLDivElement>) => {
    if (swipeStartRef.current.id !== transactionId) return;
    const deltaX = event.clientX - swipeStartRef.current.x;
    const deltaY = event.clientY - swipeStartRef.current.y;

    event.currentTarget.releasePointerCapture(event.pointerId);

    if (!swipeStartRef.current.moved) {
      setDragState({ id: null, offset: 0 });
      return;
    }

    if (Math.abs(deltaX) < Math.abs(deltaY)) {
      setDragState({ id: null, offset: 0 });
      return;
    }

    if (deltaX <= -SWIPE_OPEN_THRESHOLD) {
      setOpenTransactionId(transactionId);
    } else {
      setOpenTransactionId(null);
    }

    setDragState({ id: null, offset: 0 });
  };

  return (
    <Card className={`${getCardStyles()} rounded-2xl overflow-hidden`}>
      {/* Optional Header with Total */}
      {showHeader && totalAmount !== undefined && (
        <div className={`${getSectionHeaderStyles()} px-3 py-2`}>
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className={`text-sm font-bold ${getTotalAmountColor()}`}>{totalAmount}</p>
              <p className="text-xs">{0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Transactions List */}
      <div className="divide-y divide-primary/10">
        {transactions.map((transaction, index) => (
          <div
            key={transaction.id || index}
            className="relative overflow-hidden touch-pan-y"
            onPointerDown={(event) => handlePointerDown(transaction.id, event)}
            onPointerMove={(event) => handlePointerMove(transaction.id, event)}
            onPointerUp={(event) => handlePointerUp(transaction.id, event)}
            onPointerCancel={() => {
              setOpenTransactionId(null);
              setDragState({ id: null, offset: 0 });
            }}
          >
            {onDeleteTransaction && (
              <div
                className="absolute inset-y-0 right-0 left-0"
                style={{
                  opacity:
                    dragState.id === transaction.id
                      ? Math.min(1, Math.abs(dragState.offset) / 24)
                      : openTransactionId === transaction.id
                        ? 1
                        : 0,
                  pointerEvents:
                    dragState.id === transaction.id || openTransactionId === transaction.id ? "auto" : "none",
                }}
              >
                <div
                  className="absolute inset-y-0 right-0 bg-destructive/15"
                  style={{
                    width:
                      dragState.id === transaction.id
                        ? `${Math.min(ACTION_WIDTH, Math.abs(dragState.offset))}px`
                        : openTransactionId === transaction.id
                          ? `${ACTION_WIDTH}px`
                          : "0px",
                  }}
                />
                <div
                  className="relative flex h-full items-center justify-end px-2"
                  style={{
                    transform:
                      dragState.id === transaction.id
                        ? `translateX(${Math.max(
                            0,
                            (ACTION_WIDTH - Math.abs(dragState.offset)) / 2,
                          )}px)`
                        : openTransactionId === transaction.id
                          ? "translateX(0px)"
                          : `translateX(${ACTION_WIDTH / 2}px)`,
                  }}
                >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-destructive hover:bg-destructive/20"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteTransaction(transaction.id);
                  }}
                >
                  Elimina
                </Button>
                </div>
              </div>
            )}

            <div
              className="px-3 py-2 hover:bg-accent/10"
              style={{
                transform:
                  dragState.id === transaction.id
                    ? `translateX(${dragState.offset}px)`
                    : openTransactionId === transaction.id && onDeleteTransaction
                      ? `translateX(-${ACTION_WIDTH}px)`
                      : "translateX(0px)",
                transition:
                  dragState.id === transaction.id
                    ? "none"
                    : "transform 200ms ease, background-color 200ms ease",
                willChange: "transform",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (openTransactionId === transaction.id) {
                      setOpenTransactionId(null);
                      return;
                    }
                    onEditTransaction?.(transaction);
                  }}
                >
                  <div
                    className={`flex size-8 items-center justify-center rounded-lg ${getTransactionIconColor(
                      transaction,
                    )} shadow-sm transition-all duration-200 shrink-0`}
                  >
                    <CategoryIcon categoryKey={transaction.category} size={iconSizes.xs} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium transition-colors truncate text-sm">{transaction.description}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-black/60">{getCategoryLabel(transaction.category)}</span>
                      {variant === "regular" && transaction.account_id && accountNames[transaction.account_id] && (
                        <>
                          <span className="text-xs text-primary/40">•</span>
                          <span className="text-xs text-black/50">{accountNames[transaction.account_id]}</span>
                        </>
                      )}
                      {variant === "recurrent" && transaction.frequency && (
                        <>
                          <span className="text-xs text-primary/40">•</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getTransactionBadgeColor(
                              transaction,
                            )} font-medium px-1 py-0 scale-75 origin-left`}
                          >
                            {transaction.frequency}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className={`text-sm font-bold ${getTransactionAmountColor(transaction)}`} suppressHydrationWarning>
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  {variant === "recurrent" && transaction.frequency && transaction.frequency !== "once" && (
                    <p className={`text-xs mt-0.5 font-medium ${getTransactionAmountColor(transaction)}`}>
                      Serie ricorrente - {transaction.frequency}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
