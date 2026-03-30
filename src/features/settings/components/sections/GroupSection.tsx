'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SectionHeader } from '@/components/layout';
import { ListContainer, PageSection, RowCard } from '@/components/ui/layout';
import { RoleBadge } from '@/features/permissions';
import { ChevronRight, CreditCard, Plus, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { User } from '@/lib/types';
import { cn } from '@/lib/utils';

const MEMBER_ROW_ESTIMATE_PX = 84;
const VIRTUALIZE_MEMBER_THRESHOLD = 24;

interface GroupSectionProps {
  groupUsers: User[];
  isAdmin: boolean;
  onInviteMember: () => void;
  onManageSubscription: () => void;
}

function GroupMemberRow({ member, locale }: Readonly<{ member: User; locale: string }>) {
  const memberInitials = member.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <RowCard
      title={member.name}
      subtitle={member.email}
      icon={
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-xl text-sm font-semibold shadow-md',
            member.theme_color ? 'text-white' : 'bg-primary text-primary-foreground'
          )}
          style={member.theme_color ? { backgroundColor: member.theme_color } : undefined}
          aria-hidden
        >
          {memberInitials}
        </div>
      }
      actions={
        <div className="text-right">
          <RoleBadge
            role={
              member.role === 'superadmin' || member.role === 'admin'
                ? 'admin'
                : ((member.role || 'member') as 'admin' | 'member')
            }
            size="sm"
            variant="subtle"
          />
          <p className="mt-0.5 text-xs text-primary/50">
            {member.created_at ? new Date(member.created_at).toLocaleDateString(locale) : '-'}
          </p>
        </div>
      }
    />
  );
}

function VirtualGroupMemberList({
  groupUsers,
  locale,
}: Readonly<{ groupUsers: User[]; locale: string }>) {
  const parentRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual API (see library docs)
  const virtualizer = useVirtualizer({
    count: groupUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => MEMBER_ROW_ESTIMATE_PX,
    overscan: 8,
  });

  return (
    <div
      ref={parentRef}
      className="max-h-[min(28rem,60svh)] overflow-y-auto overscroll-contain rounded-xl border border-primary/20"
      role="list"
    >
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const member = groupUsers[vi.index];
          if (!member) return null;
          return (
            <div
              key={member.id}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full border-b border-primary/20"
              style={{
                height: `${vi.size}px`,
                transform: `translateY(${vi.start}px)`,
              }}
              role="listitem"
            >
              <div className="px-1 py-0.5">
                <GroupMemberRow member={member} locale={locale} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GroupSection({
  groupUsers,
  isAdmin,
  onInviteMember,
  onManageSubscription,
}: Readonly<GroupSectionProps>) {
  const t = useTranslations('SettingsSections.Group');
  const locale = useLocale();

  if (!isAdmin) return null;

  return (
    <PageSection>
      <SectionHeader title={t('title')} icon={Users} iconClassName="text-primary" />

      {/* Group Members List */}
      <PageSection variant="card" padding="sm">
        <SectionHeader
          title={t('membersTitle')}
          subtitle={t('membersSubtitle', { count: groupUsers.length })}
          titleAs="h3"
          titleClassName="text-sm font-semibold text-primary"
          subtitleClassName="text-xs text-primary/70"
        />
        {groupUsers.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-primary/70">{t('membersEmpty')}</p>
        ) : groupUsers.length > VIRTUALIZE_MEMBER_THRESHOLD ? (
          <VirtualGroupMemberList groupUsers={groupUsers} locale={locale} />
        ) : (
          <ListContainer divided className="divide-primary/20 space-y-0">
            {groupUsers.map((member) => (
              <GroupMemberRow key={member.id} member={member} locale={locale} />
            ))}
          </ListContainer>
        )}
      </PageSection>

      {/* Group Actions */}
      <PageSection variant="card" padding="sm">
        <SectionHeader
          title={t('groupActionsTitle')}
          titleAs="h3"
          titleClassName="text-sm font-semibold text-primary"
        />
        <ListContainer divided className="divide-primary/20 space-y-0">
          <RowCard
            title={t('inviteMemberTitle')}
            subtitle={t('inviteMemberDescription')}
            icon={
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                <Plus className="h-4 w-4" />
              </div>
            }
            onClick={onInviteMember}
            actions={<ChevronRight className="h-4 w-4 text-primary/50" />}
            variant="interactive"
          />
          <RowCard
            title={t('subscriptionTitle')}
            subtitle={t('subscriptionDescription')}
            icon={
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                <CreditCard className="h-4 w-4" />
              </div>
            }
            onClick={onManageSubscription}
            actions={<ChevronRight className="h-4 w-4 text-primary/50" />}
            variant="interactive"
          />
        </ListContainer>
      </PageSection>
    </PageSection>
  );
}
