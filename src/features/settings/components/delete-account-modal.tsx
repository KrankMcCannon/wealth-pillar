"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Button, ModalBody, ModalFooter, ModalWrapper } from "@/components/ui";
import { settingsStyles } from "@/features/settings/theme";

interface DeleteAccountModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Modal for confirming account deletion
 * Shows warning and list of what will be deleted
 */
export function DeleteAccountModal({
  isOpen,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: Readonly<DeleteAccountModalProps>) {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title="Elimina Account"
      description="Questa azione è irreversibile"
      titleClassName={settingsStyles.modals.deleteAccount.title}
      descriptionClassName={settingsStyles.modals.description}
      disableOutsideClose={isDeleting}

    >
      <ModalBody>
        <div className={settingsStyles.modals.deleteAccount.body}>
          <p className={settingsStyles.modals.deleteAccount.bodyText}>
            Sei sicuro di voler eliminare il tuo account?
          </p>

          <div className={settingsStyles.modals.deleteAccount.warningBox}>
            <p className={settingsStyles.modals.deleteAccount.warningTitle}>
              Verranno eliminati permanentemente:
            </p>
            <ul className={settingsStyles.modals.deleteAccount.warningList}>
              <li className={settingsStyles.modals.deleteAccount.warningItem}>
                <span className={settingsStyles.modals.deleteAccount.warningDot}>•</span>
                <span>Il tuo account utente</span>
              </li>
              <li className={settingsStyles.modals.deleteAccount.warningItem}>
                <span className={settingsStyles.modals.deleteAccount.warningDot}>•</span>
                <span>Tutti i tuoi conti bancari</span>
              </li>
              <li className={settingsStyles.modals.deleteAccount.warningItem}>
                <span className={settingsStyles.modals.deleteAccount.warningDot}>•</span>
                <span>Tutte le tue transazioni</span>
              </li>
              <li className={settingsStyles.modals.deleteAccount.warningItem}>
                <span className={settingsStyles.modals.deleteAccount.warningDot}>•</span>
                <span>Tutti i tuoi budget</span>
              </li>
            </ul>
          </div>

          {error && (
            <div className={settingsStyles.modals.deleteAccount.warningAlert}>
              <AlertTriangle className={settingsStyles.modals.deleteAccount.warningAlertIcon} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          variant="outline"
          className={settingsStyles.modals.deleteAccount.button}
        >
          Annulla
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className={`${settingsStyles.modals.deleteAccount.button} ${settingsStyles.modals.deleteAccount.confirmButton}`}
        >
          {isDeleting ? (
            <>
              <Loader2 className={settingsStyles.modals.loadingIcon} />
              Eliminazione...
            </>
          ) : (
            "Elimina Account"
          )}
        </Button>
      </ModalFooter>
    </ModalWrapper>
  );
}
