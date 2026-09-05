'use client';

import { useMemo } from 'react';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { UserPlus } from 'lucide-react';
import { EntityFormModal } from '@/components/form';
import { ModalTextField } from '@/components/form/modal-fields';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';
import { ModalSection } from '@/components/ui/modal-wrapper';
import { toast } from '@/hooks/use-toast';
import { updateGroupAction } from '@/features/settings';
import { useSettingsModalsContextOptional } from '@/features/settings/context/settings-modals-context';
import { useRequiredGroupUsers } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { stitchSettings as sSettings } from '@/styles/home-design-foundation';
import { cn, sortUsersByRole } from '@/lib/utils';
import { initialsFromName } from '@/lib/utils/string-formatter';

const createManageGroupSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z.string().min(1, t('validation.nameRequired')).max(100, t('validation.nameMax')).trim(),
  });

type ManageGroupFormData = z.infer<ReturnType<typeof createManageGroupSchema>>;

const displayInitials = (name: string) =>
  initialsFromName(name, { emptyFallback: '?', singleWord: 'two' });

export interface ManageGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  isAdmin: boolean;
}

export function ManageGroupModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  isAdmin,
}: Readonly<ManageGroupModalProps>) {
  const t = useTranslations('SettingsModals.ManageGroup');
  const manageGroupSchema = useMemo(() => createManageGroupSchema(t), [t]);
  const settingsContext = useSettingsModalsContextOptional();
  const groupUsers = useRequiredGroupUsers();
  const { openModal } = useModalState();

  const defaultValues = useMemo(
    (): ManageGroupFormData => ({
      name: groupName,
    }),
    [groupName]
  );

  const handleInvite = () => {
    openModal('settings:invite');
  };

  return (
    <EntityFormModal<ManageGroupFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      description={t('description')}
      schema={manageGroupSchema}
      defaultValues={defaultValues}
      resetValues={defaultValues}
      repositionInputs={false}
      bodyClassName={sSettings.modalFormBody}
      {...(isAdmin
        ? {
            footer: (form) => (
              <ModalFooterActions
                variant="dual"
                cancelLabel={t('cancelButton')}
                submitLabel={t('saveButton')}
                onCancel={onClose}
                submitType="submit"
                isSubmitting={form.formState.isSubmitting}
                secondaryAction={
                  <button
                    type="button"
                    className={s.footer.secondaryAction}
                    onClick={handleInvite}
                    disabled={form.formState.isSubmitting}
                  >
                    <UserPlus className="size-4 shrink-0" aria-hidden />
                    {t('inviteButton')}
                  </button>
                }
              />
            ),
          }
        : {})}
      onSubmit={async (data) => {
        if (!isAdmin) {
          onClose();
          return;
        }

        if (data.name === groupName) {
          toast({
            title: t('toast.noChangesTitle'),
            description: t('toast.noChangesDescription'),
            variant: 'info',
          });
          onClose();
          return;
        }

        const { data: updated, error } = await updateGroupAction(groupId, data.name);

        if (error) {
          toast({ title: t('toast.errorTitle'), description: error, variant: 'destructive' });
          throw new Error(error);
        }

        if (!updated) {
          toast({
            title: t('toast.errorTitle'),
            description: t('toast.updateFailedDescription'),
            variant: 'destructive',
          });
          throw new Error('update failed');
        }

        settingsContext?.onGroupUpdate(updated.name);
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
          <div className={sSettings.sectionCard}>
            <ModalTextField
              control={form.control}
              name="name"
              label={t('nameLabel')}
              placeholder={t('namePlaceholder')}
              disabled={!isAdmin || form.formState.isSubmitting}
            />
          </div>

          <ModalSection title={t('membersTitle')}>
            <ul className={cn(sSettings.sectionCard, 'flex flex-col p-0')}>
              {sortUsersByRole(groupUsers).map((member, index, members) => {
                const roleKey =
                  member.role === 'admin' || member.role === 'superadmin' ? 'admin' : 'member';
                const isLast = index === members.length - 1;

                return (
                  <li
                    key={member.id}
                    className={cn(sSettings.memberRow, !isLast && sSettings.rowDivider)}
                  >
                    <div className={sSettings.rowLeft}>
                      <div className={sSettings.memberAvatar} aria-hidden>
                        {displayInitials(member.name ?? '')}
                      </div>
                      <span className={sSettings.memberName}>{member.name}</span>
                    </div>
                    <span className={sSettings.memberRole}>{t(`roles.${roleKey}`)}</span>
                  </li>
                );
              })}
            </ul>
          </ModalSection>
        </>
      )}
    </EntityFormModal>
  );
}
