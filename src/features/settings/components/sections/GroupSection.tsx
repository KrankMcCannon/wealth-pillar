
import { SectionHeader } from "@/components/layout";
import { ListContainer, PageSection, RowCard } from "@/components/ui/layout";
import { RoleBadge } from "@/features/permissions";
import { ChevronRight, CreditCard, Plus, Users } from "lucide-react";
import { User } from "@/lib/types";

interface GroupSectionProps {
  groupUsers: User[];
  isAdmin: boolean;
  onInviteMember: () => void;
  onManageSubscription: () => void;
}

export function GroupSection({
  groupUsers,
  isAdmin,
  onInviteMember,
  onManageSubscription,
}: GroupSectionProps) {
  if (!isAdmin) return null;

  return (
    <PageSection>
      <SectionHeader title="Gestione Gruppo" icon={Users} iconClassName="text-primary" />

      {/* Group Members List */}
      <PageSection variant="card" padding="sm">
        <SectionHeader
          title="Membri del Gruppo"
          subtitle={`${groupUsers.length} ${groupUsers.length === 1 ? "membro visibile" : "membri visibili"}`}
          titleClassName="text-sm font-semibold text-primary"
          subtitleClassName="text-xs text-primary/70"
        />
        <ListContainer divided className="divide-primary/20 space-y-0">
          {groupUsers.map((member) => {
            const memberInitials = member.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase();

            return (
              <RowCard
                key={member.id}
                title={member.name}
                subtitle={member.email}
                icon={
                  <div
                    className="size-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-md"
                    style={{ backgroundColor: (member.theme_color || "#000000") as string }}
                  >
                    {memberInitials}
                  </div>
                }
                actions={
                  <div className="text-right">
                    <RoleBadge
                      role={
                        (member.role === "superadmin" || member.role === "admin")
                          ? "admin"
                          : ((member.role || "member") as "admin" | "member")
                      }
                      size="sm"
                      variant="subtle"
                    />
                    <p className="text-xs text-primary/50 mt-0.5">
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString("it-IT")
                        : "-"}
                    </p>
                  </div>
                }
              />
            );
          })}
        </ListContainer>
      </PageSection>

      {/* Group Actions */}
      <PageSection variant="card" padding="sm">
        <ListContainer divided className="divide-primary/20 space-y-0">
          <RowCard
            title="Invita Membro"
            subtitle="Invia invito per unirsi al gruppo"
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
            title="Impostazioni Abbonamento"
            subtitle="Gestisci fatturazione e abbonamento gruppo"
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
