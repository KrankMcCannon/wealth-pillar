"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalBody, ModalFooter, ModalWrapper } from "@/components/ui/modal-wrapper";
import { toast } from "@/hooks/use-toast";
import { sendGroupInvitationAction } from "@/features/settings";
import { settingsStyles } from "@/styles/system";
import { SettingsModalField, SettingsModalForm } from "./settings-modal-form";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, "L'email è obbligatoria")
    .email("Formato email non valido")
    .toLowerCase(),
});

type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface InviteMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  currentUserId: string;
  onSuccess?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * InviteMemberModal Component
 * Modal for inviting new members to the group via email
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Email format validation
 * - Duplicate invitation checking (server-side)
 * - Toast notifications for success/error
 * - Loading states
 * - Clear feedback messages
 *
 * @example
 * ```tsx
 * <InviteMemberModal
 *   isOpen={showModal}
 *   onOpenChange={setShowModal}
 *   groupId={currentUser.group_id}
 *   currentUserId={currentUser.id}
 * />
 * ```
 */
export function InviteMemberModal({
  isOpen,
  onOpenChange,
  groupId,
  currentUserId,
  onSuccess,
}: InviteMemberModalProps) {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
    },
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      reset({ email: "" });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: InviteMemberFormData) => {
    try {
      // Call server action to send invitation
      const { error } = await sendGroupInvitationAction(
        groupId,
        currentUserId,
        data.email
      );

      if (error) {
        toast({
          title: "Errore nell'invio",
          description: error,
          variant: "destructive",
        });
        return;
      }

      // Show success toast
      toast({
        title: "Invito inviato",
        description: `Un invito è stato inviato a ${data.email}`,
        variant: "success",
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio dell'invito",
        variant: "destructive",
      });
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Invita Membro"
      description="Invia un invito per unirsi al gruppo"
      titleClassName={settingsStyles.modals.title}
      descriptionClassName={settingsStyles.modals.description}
      disableOutsideClose={isSubmitting}
      repositionInputs={false}
    >
      <SettingsModalForm onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <ModalBody>
          <SettingsModalField
            id="email"
            label="Indirizzo email del nuovo membro"
            error={errors.email?.message}
            inputProps={{
              type: "email",
              placeholder: "nuovo.membro@example.com",
              disabled: isSubmitting,
              autoComplete: "email",
              ...register("email"),
            }}
          />

          {/* Info message */}
          <div className={settingsStyles.modals.invite.infoBox}>
            <p className={settingsStyles.modals.invite.infoText}>
              <strong className={settingsStyles.modals.invite.infoStrong}>Nota:</strong> Il nuovo membro
              riceverà un&apos;email con un link di invito valido per 7 giorni. Potrà
              accettare l&apos;invito creando un account o accedendo con un account
              esistente.
            </p>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className={settingsStyles.modals.actionsButton}
            type="button"
          >
            Annulla
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className={settingsStyles.modals.actionsButton}
          >
            {isSubmitting ? (
              <>
                <Loader2 className={settingsStyles.modals.loadingIcon} />
                Invio...
              </>
            ) : (
              <>
                <Mail className={settingsStyles.modals.iconSmall} />
                Invia Invito
              </>
            )}
          </Button>
        </ModalFooter>
      </SettingsModalForm>
    </ModalWrapper>
  );
}
