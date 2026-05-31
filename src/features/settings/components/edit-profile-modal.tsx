'use client';

import { useMemo } from 'react';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { EntityFormModal } from '@/components/form';
import { ModalTextField } from '@/components/form/modal-fields';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';
import { toast } from '@/hooks/use-toast';
import { updateUserProfileAction } from '@/features/settings';
import { useSettingsModalsContextOptional } from '@/features/settings/context/settings-modals-context';

const createEditProfileSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z.string().min(1, t('validation.nameRequired')).max(100, t('validation.nameMax')).trim(),
    email: z
      .string()
      .min(1, t('validation.emailRequired'))
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, t('validation.emailInvalid'))
      .toLowerCase(),
  });

type EditProfileFormData = z.infer<ReturnType<typeof createEditProfileSchema>>;

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentName: string;
  currentEmail: string;
}

export function EditProfileModal({
  isOpen,
  onClose,
  userId,
  currentName,
  currentEmail,
}: Readonly<EditProfileModalProps>) {
  const t = useTranslations('SettingsModals.EditProfile');
  const editProfileSchema = useMemo(() => createEditProfileSchema(t), [t]);
  const settingsContext = useSettingsModalsContextOptional();

  const defaultValues = useMemo(
    (): EditProfileFormData => ({
      name: currentName,
      email: currentEmail,
    }),
    [currentName, currentEmail]
  );

  return (
    <EntityFormModal<EditProfileFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      description={t('description')}
      schema={editProfileSchema}
      defaultValues={defaultValues}
      resetValues={defaultValues}
      repositionInputs={false}
      footer={(form) => (
        <ModalFooterActions
          variant="dual"
          cancelLabel={t('cancelButton')}
          submitLabel={t('saveChangesButton')}
          onCancel={onClose}
          submitType="submit"
          isSubmitting={form.formState.isSubmitting}
        />
      )}
      onSubmit={async (data) => {
        if (data.name === currentName && data.email === currentEmail) {
          toast({
            title: t('toast.noChangesTitle'),
            description: t('toast.noChangesDescription'),
            variant: 'info',
          });
          onClose();
          return;
        }

        const { data: updatedUser, error } = await updateUserProfileAction(userId, {
          name: data.name === currentName ? undefined : data.name,
          email: data.email === currentEmail ? undefined : data.email,
        });

        if (error) {
          toast({ title: t('toast.errorTitle'), description: error, variant: 'destructive' });
          throw new Error(error);
        }

        if (!updatedUser) {
          toast({
            title: t('toast.errorTitle'),
            description: t('toast.updateFailedDescription'),
            variant: 'destructive',
          });
          throw new Error('update failed');
        }

        settingsContext?.onProfileUpdate({
          name: updatedUser.name,
          email: updatedUser.email,
        });
        toast({
          title: t('toast.updatedTitle'),
          description: t('toast.updatedDescription'),
          variant: 'success',
        });
        onClose();
      }}
    >
      {(form) => (
        <>
          <ModalTextField
            control={form.control}
            name="name"
            label={t('nameLabel')}
            placeholder={t('namePlaceholder')}
            autoComplete="name"
            disabled={form.formState.isSubmitting}
          />
          <ModalTextField
            control={form.control}
            name="email"
            label={t('emailLabel')}
            type="email"
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            disabled={form.formState.isSubmitting}
          />
        </>
      )}
    </EntityFormModal>
  );
}
