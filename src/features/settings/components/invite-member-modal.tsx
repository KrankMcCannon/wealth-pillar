'use client';

import { ActionTimeoutError, withDeadline } from '@/lib/utils/with-deadline';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Mail } from 'lucide-react';
import { EntityFormModal } from '@/components/form';
import { ModalTextField } from '@/components/form/modal-fields';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';
import { toast } from '@/hooks/use-toast';
import {
  getGroupInvitationStatusAction,
  sendGroupInvitationAction,
} from '@/features/settings/actions';
import { stitchSettings as s } from '@/styles/home-design-foundation';

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
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

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
      schema={inviteMemberSchema}
      defaultValues={defaultValues}
      resetValues={defaultValues}
      repositionInputs={false}
      bodyClassName={s.modalFormBody}
      footer={(form) => (
        <ModalFooterActions
          variant="dual"
          cancelLabel={t('cancelButton')}
          submitLabel={t('sendButton')}
          onCancel={verificationEmail ? () => undefined : onClose}
          submitType="submit"
          isSubmitting={form.formState.isSubmitting || Boolean(verificationEmail)}
          submitIcon={<Mail className="h-4 w-4 shrink-0" aria-hidden />}
        />
      )}
      onSubmit={async (data) => {
        const email = data.email.trim().toLowerCase();
        let result;
        try {
          result = await withDeadline(sendGroupInvitationAction(groupId, currentUserId, email));
        } catch (error) {
          if (error instanceof ActionTimeoutError) {
            setVerificationEmail(email);
            return;
          }
          throw error;
        }

        if (result.error && result.errorCode !== 'INVITATION_ALREADY_PENDING') {
          toast({
            title: t('toast.sendErrorTitle'),
            description: result.error,
            variant: 'destructive',
          });
          throw new Error(result.error);
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
        <div className={s.sectionCard}>
          <ModalTextField
            control={form.control}
            name="email"
            layout="plain"
            label={t('emailLabel')}
            type="email"
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            disabled={form.formState.isSubmitting || Boolean(verificationEmail)}
          />
          {verificationEmail ? (
            <div role="alert" className="space-y-3 p-3">
              <p className="text-sm">
                {t('verifyOutcomeDescription', { email: verificationEmail })}
              </p>
              <button
                type="button"
                className="min-h-11 underline"
                disabled={isVerifying}
                onClick={async () => {
                  setIsVerifying(true);
                  try {
                    const status = await withDeadline(
                      getGroupInvitationStatusAction(groupId, verificationEmail)
                    );
                    if (status.error || !status.data)
                      throw new Error(status.error ?? 'Verification failed');
                    if (status.data.status === 'none') {
                      setVerificationEmail(null);
                      toast({
                        title: t('toast.sendErrorTitle'),
                        description: t('verificationNotFound'),
                        variant: 'destructive',
                      });
                      return;
                    }
                    toast({
                      title: t('toast.successTitle'),
                      description: t('toast.successDescription', { email: verificationEmail }),
                      variant: 'success',
                    });
                    onSuccess?.();
                    onClose();
                  } catch {
                    toast({
                      title: t('toast.sendErrorTitle'),
                      description: t('verificationFailed'),
                      variant: 'destructive',
                    });
                  } finally {
                    setIsVerifying(false);
                  }
                }}
              >
                {isVerifying ? t('verifying') : t('verifyOutcomeButton')}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </EntityFormModal>
  );
}
