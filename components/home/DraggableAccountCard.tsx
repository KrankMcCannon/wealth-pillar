import { memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountCard } from "./AccountCard";
import { Account } from "../../types";
import { useBreakpoint } from "../../hooks/ui/useResponsive";

interface AccountWithData {
  account: Account;
  balance: number;
  personName?: string;
}

interface DraggableAccountCardProps {
  accountData: AccountWithData;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (draggedAccountId: string, toIndex: number) => void;
}

export const DraggableAccountCard = memo<DraggableAccountCardProps>(
  ({ accountData, index, isDragging, isDragOver, onDragStart, onDragEnd, onDragOver, onDrop }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const { isMobile, isTablet } = useBreakpoint();

    const handleDragStart = (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("application/json", JSON.stringify({ accountId: accountData.account.id })); // Usa JSON invece di text/html

      // Aggiungi un'immagine fantasma personalizzata
      if (cardRef.current) {
        const ghost = cardRef.current.cloneNode(true) as HTMLElement;
        ghost.style.opacity = "0.8";
        ghost.style.transform = "rotate(5deg)";
        ghost.style.width = cardRef.current.offsetWidth + "px";
        ghost.style.height = cardRef.current.offsetHeight + "px";
        ghost.style.pointerEvents = "none";
        ghost.style.position = "fixed";
        ghost.style.zIndex = "9999";
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);

        // Rimuovi l'immagine fantasma dopo un breve delay
        setTimeout(() => {
          if (document.body.contains(ghost)) {
            document.body.removeChild(ghost);
          }
        }, 0);
      }

      onDragStart(index);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      onDragOver(e, index);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      try {
        const data = e.dataTransfer.getData("application/json");
        const { accountId } = JSON.parse(data);
        onDrop(accountId, index);
      } catch (error) {
        console.error("Errore nel parsing dei dati del drag:", error);
      }
    };

    // Scale ridotto su mobile
    const getScale = () => {
      if (isDragging) {
        return isMobile ? 0.9 : 0.95;
      }
      return 1;
    };

    const getHoverScale = () => {
      return isMobile ? 1.02 : 1.05;
    };

    return (
      <div
        ref={cardRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="cursor-grab active:cursor-grabbing"
      >
        <motion.div
          layout
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: getScale(),
            rotate: isDragging ? 2 : 0,
            zIndex: isDragging ? 10 : 1,
          }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          whileHover={{
            scale: isDragging ? getScale() : getHoverScale(),
            transition: { duration: 0.2 },
          }}
          whileTap={{ scale: 0.98 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.3,
          }}
          className={isDragOver && !isDragging ? "relative" : ""}
          style={{
            zIndex: isDragging ? 10 : 1,
          }}
        >
          {/* Indicatore di posizione durante drag over */}
          <AnimatePresence>
            {isDragOver && !isDragging && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 flex items-center justify-center z-20"
              >
                <div className="text-blue-600 dark:text-blue-400 font-medium text-sm">Posiziona qui</div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={{
              opacity: isDragging ? 0.5 : 1,
              boxShadow: isDragging ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)" : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
            transition={{ duration: 0.2 }}
          >
            <AccountCard
              account={accountData.account}
              balance={accountData.balance}
              personName={accountData.personName}
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }
);

DraggableAccountCard.displayName = "DraggableAccountCard";
