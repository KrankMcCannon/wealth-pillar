'use client';

import { useMemo } from 'react';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { UserPlus } from 'lucide-react';
import { EntityFormModal } from '@/components/form';
import { ModalTextField } from '@/components/form/modal-fields';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';
import { ModalSection } from '@/components/ui/modal-wrapper';
import { Button } from '@/components/ui';
import { toast } from '@/hooks/use-toast';
import { updateGroupAction } from '@/features/settings';
import { useSettingsModalsContextOptional } from '@/features/settings/context/settings-modals-context';
import { useRequiredGroupUsers } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { cn } from '@/lib/utils';

const createManageGroupSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z.string().min(1, t('validation.nameRequired')).max(100, t('validation.nameMax')).trim(),
  });

type ManageGroupFormData = z.infer<ReturnType<typeof createManageGroupSchema>>;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const w = parts[0] ?? '';
    const slice = w.slice(0, 2);
    return slice.length > 0 ? slice.toUpperCase() : '?';
  }
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  const a = first.charAt(0);
  const b = last.charAt(0);
  if (!a && !b) return '?';
  return `${a}${b}`.toUpperCase();
}

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
      {...(isAdmin
        ? {
            footer: (form) => (
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full"
                  onClick={handleInvite}
                  disabled={form.formState.isSubmitting}
                >
                  <UserPlus data-icon="inline-start" aria-hidden />
                  {t('inviteButton')}
                </Button>
                <ModalFooterActions
                  variant="dual"
                  cancelLabel={t('cancelButton')}
                  submitLabel={t('saveButton')}
                  onCancel={onClose}
                  submitType="submit"
                  isSubmitting={form.formState.isSubmitting}
                />
              </div>
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
          <ModalTextField
            control={form.control}
            name="name"
            label={t('nameLabel')}
            placeholder={t('namePlaceholder')}
            disabled={!isAdmin || form.formState.isSubmitting}
          />

          <ModalSection title={t('membersTitle')}>
            <ul className={cn(s.noteShell, 'flex flex-col gap-0 p-0')}>
              {groupUsers.map((member, index) => {
                const roleKey =
                  member.role === 'admin' || member.role === 'superadmin' ? 'admin' : 'member';
                const isLast = index === groupUsers.length - 1;

                return (
                  <li
                    key={member.id}
                    className={cn(
                      'flex min-h-11 items-center gap-3 px-3 py-2.5',
                      !isLast && 'border-b border-border/20'
                    )}
                  >
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/35 bg-muted text-[11px] font-bold tabular-nums text-primary"
                      aria-hidden
                    >
                      {getInitials(member.name ?? '')}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium text-foreground">
                        {member.name}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t(`roles.${roleKey}`)}
                      </span>
                    </div>
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
