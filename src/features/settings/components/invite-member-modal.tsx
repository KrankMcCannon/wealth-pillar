'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModalBody, ModalFooter, ModalWrapper } from '@/components/ui/modal-wrapper';
import { toast } from '@/hooks/use-toast';
import { sendGroupInvitationAction } from '@/features/settings';
import { settingsStyles } from '@/features/settings/theme';
import { SettingsModalField, SettingsModalForm } from './settings-modal-form';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const createInviteMemberSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    email: z
      .string()
      .min(1, t('validation.emailRequired'))
      .email(t('validation.emailInvalid'))
      .toLowerCase(),
  });

type InviteMemberFormData = z.infer<ReturnType<typeof createInviteMemberSchema>>;

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
  const t = useTranslations('SettingsModals.InviteMember');
  const inviteMemberSchema = React.useMemo(() => createInviteMemberSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
    },
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      reset({ email: '' });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: InviteMemberFormData) => {
    try {
      // Call server action to send invitation
      const { error } = await sendGroupInvitationAction(groupId, currentUserId, data.email);

      if (error) {
        toast({
          title: t('toast.sendErrorTitle'),
          description: error,
          variant: 'destructive',
        });
        return;
      }

      // Show success toast
      toast({
        title: t('toast.successTitle'),
        description: t('toast.successDescription', { email: data.email }),
        variant: 'success',
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: t('toast.errorTitle'),
        description: t('toast.errorDescription'),
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
      <SettingsModalForm onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <ModalBody>
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

          {/* Info message */}
          <div className={settingsStyles.modals.invite.infoBox}>
            <p className={settingsStyles.modals.invite.infoText}>
              <strong className={settingsStyles.modals.invite.infoStrong}>{t('noteLabel')}</strong>{' '}
              {t('noteText')}
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
                {t('sendingButton')}
              </>
            ) : (
              <>
                <Mail className={settingsStyles.modals.iconSmall} />
                {t('sendButton')}
              </>
            )}
          </Button>
        </ModalFooter>
      </SettingsModalForm>
    </ModalWrapper>
  );
}
