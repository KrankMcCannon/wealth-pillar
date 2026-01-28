
import { SectionHeader } from "@/components/layout";
import { PageSection, SettingsItem } from "@/components/ui/layout";
import { Trash2, User as UserIcon } from "lucide-react";

interface AccountSectionProps {
  onDeleteAccount: () => void;
}

export function AccountSection({ onDeleteAccount }: AccountSectionProps) {
  return (
    <PageSection>
      <SectionHeader title="Account" icon={UserIcon} iconClassName="text-destructive" />
      <PageSection variant="card" padding="sm">
        <SettingsItem
          icon={<Trash2 className="h-4 w-4 text-destructive" />}
          label="Elimina Account"
          description="Elimina permanentemente il tuo account"
          actionType="navigation"
          onPress={onDeleteAccount}
          variant="destructive"
        />
      </PageSection>
    </PageSection>
  );
}
