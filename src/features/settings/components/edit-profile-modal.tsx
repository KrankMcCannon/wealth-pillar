"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button, ModalActions, ModalWrapper } from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import { updateUserProfileAction } from "@/features/settings/actions";
import { useReferenceDataStore } from "@/stores/reference-data-store";
import { settingsStyles } from "../theme";
import { SettingsModalField, SettingsModalForm } from "./settings-modal-form";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const editProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Il nome è obbligatorio")
    .max(100, "Il nome deve essere massimo 100 caratteri")
    .trim(),
  email: z
    .string()
    .min(1, "L'email è obbligatoria")
    .email("Formato email non valido")
    .toLowerCase(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface EditProfileModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentName: string;
  currentEmail: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * EditProfileModal Component
 * Modal for editing user profile (name and email)
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Optimistic updates to Zustand store
 * - Toast notifications for success/error
 * - Loading states
 * - Prevents close during submission
 *
 * @example
 * ```tsx
 * <EditProfileModal
 *   isOpen={showModal}
 *   onOpenChange={setShowModal}
 *   userId={currentUser.id}
 *   currentName={currentUser.name}
 *   currentEmail={currentUser.email}
 * />
 * ```
 */
export function EditProfileModal({
  isOpen,
  onOpenChange,
  userId,
  currentName,
  currentEmail,
}: EditProfileModalProps) {
  const updateCurrentUser = useReferenceDataStore((state) => state.updateCurrentUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: currentName,
      email: currentEmail,
    },
  });

  // Reset form when modal opens with current values
  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: currentName,
        email: currentEmail,
      });
    }
  }, [isOpen, currentName, currentEmail, reset]);

  const onSubmit = async (data: EditProfileFormData) => {
    try {
      // Check if anything changed
      if (data.name === currentName && data.email === currentEmail) {
        toast({
          title: "Nessuna modifica",
          description: "Non hai apportato modifiche al profilo",
          variant: "info",
        });
        onOpenChange(false);
        return;
      }

      // Call server action
      const { data: updatedUser, error } = await updateUserProfileAction(userId, {
        name: data.name !== currentName ? data.name : undefined,
        email: data.email !== currentEmail ? data.email : undefined,
      });

      if (error) {
        toast({
          title: "Errore",
          description: error,
          variant: "destructive",
        });
        return;
      }

      if (!updatedUser) {
        toast({
          title: "Errore",
          description: "Impossibile aggiornare il profilo",
          variant: "destructive",
        });
        return;
      }

      // Optimistic update to Zustand store
      updateCurrentUser({
        name: updatedUser.name,
        email: updatedUser.email,
      });

      // Show success toast
      toast({
        title: "Profilo aggiornato",
        description: "Le modifiche sono state salvate con successo",
        variant: "success",
      });

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento",
        variant: "destructive",
      });
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Modifica Profilo"
      description="Aggiorna il tuo nome e indirizzo email"
      titleClassName={settingsStyles.modals.title}
      descriptionClassName={settingsStyles.modals.description}
      disableOutsideClose={isSubmitting}
      footer={
        <ModalActions>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className={settingsStyles.modals.actionsButton}
          >
            Annulla
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className={settingsStyles.modals.actionsButton}
          >
            {isSubmitting ? (
              <>
                <Loader2 className={settingsStyles.modals.loadingIcon} />
                Salvataggio...
              </>
            ) : (
              "Salva Modifiche"
            )}
          </Button>
        </ModalActions>
      }
    >
      <SettingsModalForm onSubmit={handleSubmit(onSubmit)}>
        <SettingsModalField
          id="name"
          label="Nome completo"
          error={errors.name?.message}
          inputProps={{
            type: "text",
            placeholder: "Mario Rossi",
            disabled: isSubmitting,
            autoComplete: "name",
            ...register("name"),
          }}
        />

        <SettingsModalField
          id="email"
          label="Indirizzo email"
          error={errors.email?.message}
          inputProps={{
            type: "email",
            placeholder: "mario.rossi@example.com",
            disabled: isSubmitting,
            autoComplete: "email",
            ...register("email"),
          }}
        />
      </SettingsModalForm>
    </ModalWrapper>
  );
}
