"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";
import { ModalWrapper, ModalActions } from "@/src/components/ui/modal-wrapper";
import { Button } from "@/components/ui";
import { useToast } from "@/src/components/ui/toast";
import { sendGroupInvitationAction } from "@/src/features/settings/actions";
import { cn } from "@/src/lib";

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
  const { showToast } = useToast();

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
        showToast({
          type: "error",
          title: "Errore nell'invio",
          description: error,
        });
        return;
      }

      // Show success toast
      showToast({
        type: "success",
        title: "Invito inviato",
        description: `Un invito è stato inviato a ${data.email}`,
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending invitation:", error);
      showToast({
        type: "error",
        title: "Errore",
        description: "Si è verificato un errore durante l'invio dell'invito",
      });
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Invita Membro"
      description="Invia un invito per unirsi al gruppo"
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
                Invio...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Invia Invito
              </>
            )}
          </Button>
        </ModalActions>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-900 mb-1.5"
          >
            Indirizzo email del nuovo membro
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
            placeholder="nuovo.membro@example.com"
            disabled={isSubmitting}
            autoComplete="email"
            autoFocus
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Info message */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-sm text-blue-800">
            <strong className="font-semibold">Nota:</strong> Il nuovo membro
            riceverà un&apos;email con un link di invito valido per 7 giorni. Potrà
            accettare l&apos;invito creando un account o accedendo con un account
            esistente.
          </p>
        </div>
      </form>
    </ModalWrapper>
  );
}
