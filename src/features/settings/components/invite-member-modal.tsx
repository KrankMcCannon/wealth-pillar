'use client';

import { useMemo } from 'react';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntityFormModal } from '@/components/form';
import { ModalTextField } from '@/components/form/modal-fields';
import { toast } from '@/hooks/use-toast';
import { sendGroupInvitationAction } from '@/features/settings';
import { settingsStyles } from '@/features/settings/theme';
import { formModalStyles as s } from '@/components/form/form-modal-styles';

const createInviteMemberSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    email: z
      .string()
      .min(1, t('validation.emailRequired'))
      .email(t('validation.emailInvalid'))
      .toLowerCase(),
  });

type InviteMemberFormData = z.infer<ReturnType<typeof createInviteMemberSchema>>;

export interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currentUserId: string;
  onSuccess?: () => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  groupId,
  currentUserId,
  onSuccess,
}: InviteMemberModalProps) {
  const t = useTranslations('SettingsModals.InviteMember');
  const inviteMemberSchema = useMemo(() => createInviteMemberSchema(t), [t]);

  const defaultValues = useMemo(
    (): InviteMemberFormData => ({
      email: '',
    }),
    []
  );

  return (
    <EntityFormModal<InviteMemberFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      description={t('description')}
      schema={inviteMemberSchema}
      defaultValues={defaultValues}
      resetValues={defaultValues}
      repositionInputs={false}
      footer={(form) => (
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={form.formState.isSubmitting}
            className={settingsStyles.modals.actionsButton}
            type="button"
          >
            {t('cancelButton')}
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={settingsStyles.modals.actionsButton}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className={settingsStyles.modals.loadingIcon} />
                {t('sendingButton')}
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                {t('sendButton')}
              </>
            )}
          </Button>
        </>
      )}
      onSubmit={async (data) => {
        const { error } = await sendGroupInvitationAction(groupId, currentUserId, data.email);

        if (error) {
          toast({
            title: t('toast.sendErrorTitle'),
            description: error,
            variant: 'destructive',
          });
          throw new Error(error);
        }

        toast({
          title: t('toast.successTitle'),
          description: t('toast.successDescription', { email: data.email }),
          variant: 'success',
        });

        onSuccess?.();
        onClose();
      }}
    >
      {(form) => (
        <>
          <ModalTextField
            control={form.control}
            name="email"
            label={t('emailLabel')}
            type="email"
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            disabled={form.formState.isSubmitting}
          />

          <div className={s.noteShell}>
            <p className={s.noteLabel}>
              <strong>{t('noteLabel')}</strong> {t('noteText')}
            </p>
          </div>
        </>
      )}
    </EntityFormModal>
  );
}
