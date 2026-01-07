"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { ModalWrapper, ModalActions } from "@/src/components/ui/modal-wrapper";
import { Button } from "@/components/ui";
import { useToast } from "@/src/components/ui/toast";
import { updateUserProfileAction } from "@/src/features/settings/actions";
import { useReferenceDataStore } from "@/stores/reference-data-store";
import { cn } from "@/src/lib";

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
  const { showToast } = useToast();
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
        showToast({
          type: "info",
          title: "Nessuna modifica",
          description: "Non hai apportato modifiche al profilo",
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
        showToast({
          type: "error",
          title: "Errore",
          description: error,
        });
        return;
      }

      if (!updatedUser) {
        showToast({
          type: "error",
          title: "Errore",
          description: "Impossibile aggiornare il profilo",
        });
        return;
      }

      // Optimistic update to Zustand store
      updateCurrentUser({
        name: updatedUser.name,
        email: updatedUser.email,
      });

      // Show success toast
      showToast({
        type: "success",
        title: "Profilo aggiornato",
        description: "Le modifiche sono state salvate con successo",
      });

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast({
        type: "error",
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento",
      });
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Modifica Profilo"
      description="Aggiorna il tuo nome e indirizzo email"
      disableOutsideClose={isSubmitting}
      footer={
        <ModalActions>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Annulla
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              "Salva Modifiche"
            )}
          </Button>
        </ModalActions>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-900 mb-1.5"
          >
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className={cn(
              "w-full px-3 py-2 text-sm rounded-lg",
              "border border-gray-300 bg-white text-gray-900",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              errors.name && "border-red-500 focus:ring-red-500/20 focus:border-red-500"
            )}
            placeholder="Mario Rossi"
            disabled={isSubmitting}
            autoComplete="name"
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-900 mb-1.5"
          >
            Indirizzo email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className={cn(
              "w-full px-3 py-2 text-sm rounded-lg",
              "border border-gray-300 bg-white text-gray-900",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              errors.email && "border-red-500 focus:ring-red-500/20 focus:border-red-500"
            )}
            placeholder="mario.rossi@example.com"
            disabled={isSubmitting}
            autoComplete="email"
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </form>
    </ModalWrapper>
  );
}
