'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModalBody, ModalFooter, ModalWrapper } from '@/components/ui/modal-wrapper';
import { toast } from '@/hooks/use-toast';
import { updateUserProfileAction } from '@/features/settings';
import { settingsStyles } from '@/features/settings/theme';
import { SettingsModalField } from './settings-modal-form';
import { cn } from '@/lib/utils';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const createEditProfileSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z
      .string()
      .min(1, t('validation.nameRequired'))
      .max(100, t('validation.nameMax'))
      .trim(),
    email: z
      .string()
      .min(1, t('validation.emailRequired'))
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, t('validation.emailInvalid'))
      .toLowerCase(),
  });

type EditProfileFormData = z.infer<ReturnType<typeof createEditProfileSchema>>;

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
}: Readonly<EditProfileModalProps>) {
  const t = useTranslations('SettingsModals.EditProfile');
  const editProfileSchema = React.useMemo(() => createEditProfileSchema(t), [t]);
  const router = useRouter();

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
          title: t('toast.noChangesTitle'),
          description: t('toast.noChangesDescription'),
          variant: 'info',
        });
        onOpenChange(false);
        return;
      }

      // Call server action
      const { data: updatedUser, error } = await updateUserProfileAction(userId, {
        name: data.name === currentName ? undefined : data.name,
        email: data.email === currentEmail ? undefined : data.email,
      });

      if (error) {
        toast({
          title: t('toast.errorTitle'),
          description: error,
          variant: 'destructive',
        });
        return;
      }

      if (!updatedUser) {
        toast({
          title: t('toast.errorTitle'),
          description: t('toast.updateFailedDescription'),
          variant: 'destructive',
        });
        return;
      }

      // Optimistic update to Zustand store
      router.refresh();

      // Show success toast
      toast({
        title: t('toast.updatedTitle'),
        description: t('toast.updatedDescription'),
        variant: 'success',
      });

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('toast.errorTitle'),
        description: t('toast.updateErrorDescription'),
        variant: 'destructive',
      });
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
      titleClassName={settingsStyles.modals.title}
      descriptionClassName={settingsStyles.modals.description}
      disableOutsideClose={isSubmitting}
      repositionInputs={false}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn(settingsStyles.modals.form, 'flex flex-col h-full')}
      >
        <ModalBody>
          <SettingsModalField
            id="name"
            label={t('nameLabel')}
            error={errors.name?.message}
            inputProps={{
              type: 'text',
              placeholder: t('namePlaceholder'),
              disabled: isSubmitting,
              autoComplete: 'name',
              ...register('name'),
            }}
          />

          <SettingsModalField
            id="email"
            label={t('emailLabel')}
            error={errors.email?.message}
            inputProps={{
              type: 'email',
              placeholder: t('emailPlaceholder'),
              disabled: isSubmitting,
              autoComplete: 'email',
              ...register('email'),
            }}
          />
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className={settingsStyles.modals.actionsButton}
            type="button"
          >
            {t('cancelButton')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className={settingsStyles.modals.actionsButton}
          >
            {isSubmitting ? (
              <>
                <Loader2 className={settingsStyles.modals.loadingIcon} />
                {t('savingButton')}
              </>
            ) : (
              t('saveChangesButton')
            )}
          </Button>
        </ModalFooter>
      </form>
    </ModalWrapper>
  );
}
