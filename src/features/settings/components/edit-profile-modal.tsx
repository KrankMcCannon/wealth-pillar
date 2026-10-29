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
import { stitchSettings as s } from '@/styles/home-design-foundation';
import { useVerifiedProfileEmail } from '../hooks/use-verified-profile-email';

const createEditProfileSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    verificationCode: z.string(),
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
  const { pendingEmail, verifyEmail, resetVerification, resendVerification } =
    useVerifiedProfileEmail();
  const close = () => {
    resetVerification();
    onClose();
  };

  const defaultValues = useMemo(
    (): EditProfileFormData => ({
      name: currentName,
      email: currentEmail,
      verificationCode: '',
    }),
    [currentName, currentEmail]
  );

  return (
    <EntityFormModal<EditProfileFormData>
      isOpen={isOpen}
      onClose={close}
      title={t('title')}
      schema={editProfileSchema}
      defaultValues={defaultValues}
      resetValues={defaultValues}
      repositionInputs={false}
      bodyClassName={s.modalFormBody}
      footer={(form) => (
        <ModalFooterActions
          variant="dual"
          cancelLabel={t('cancelButton')}
          submitLabel={t(pendingEmail ? 'verifyAndSaveButton' : 'saveChangesButton')}
          onCancel={close}
          submitType="submit"
          isSubmitting={form.formState.isSubmitting}
        />
      )}
      onSubmit={async (data, form) => {
        if (data.name === currentName && data.email === currentEmail) {
          toast({
            title: t('toast.noChangesTitle'),
            description: t('toast.noChangesDescription'),
            variant: 'info',
          });
          close();
          return;
        }

        if (data.email !== currentEmail) {
          if (pendingEmail === data.email && !data.verificationCode.trim()) {
            form.setError('verificationCode', { message: t('verificationCodeRequired') });
            return;
          }
          try {
            if (!(await verifyEmail(data.email, data.verificationCode))) {
              form.setValue('verificationCode', '');
              return;
            }
          } catch (error) {
            const details = error as { errors?: Array<{ longMessage?: string }> };
            form.setError(pendingEmail ? 'verificationCode' : 'email', {
              message:
                details?.errors?.[0]?.longMessage ??
                (error instanceof Error ? error.message : t('verificationFailed')),
            });
            return;
          }
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
        close();
      }}
    >
      {(form) => (
        <div className={s.formCard}>
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
          {pendingEmail ? (
            <>
              <p role="status" className="px-4 text-sm text-muted-foreground">
                {t('verificationSent', { email: pendingEmail })}
              </p>
              <ModalTextField
                control={form.control}
                name="verificationCode"
                label={t('verificationCodeLabel')}
                autoComplete="one-time-code"
                type="tel"
                disabled={form.formState.isSubmitting}
              />
              <button
                type="button"
                className="px-4 text-sm underline"
                disabled={form.formState.isSubmitting}
                onClick={async () => {
                  try {
                    await resendVerification();
                  } catch {
                    form.setError('verificationCode', { message: t('verificationFailed') });
                  }
                }}
              >
                {t('resendCodeButton')}
              </button>
            </>
          ) : null}
        </div>
      )}
    </EntityFormModal>
  );
}
