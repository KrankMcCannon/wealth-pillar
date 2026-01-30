
import { SectionHeader } from "@/components/layout";
import { ListContainer, PageSection, SettingsItem } from "@/components/ui/layout";
import { Loader2, LogOut, Shield } from "lucide-react";

interface SecuritySectionProps {
  isSigningOut: boolean;
  onSignOut: () => void;
  onNavigateTo2FA: () => void;
}

export function SecuritySection({
  isSigningOut,
  onSignOut,
  onNavigateTo2FA,
}: Readonly<SecuritySectionProps>) {
  return (
    <PageSection>
      <SectionHeader title="Sicurezza" icon={Shield} iconClassName="text-primary" />
      <PageSection variant="card" padding="sm">
        <ListContainer divided className="space-y-0">
          <SettingsItem
            icon={<Shield className="h-4 w-4 text-primary" />}
            label="Autenticazione a Due Fattori"
            description="Aggiungi sicurezza extra"
            actionType="navigation"
            onPress={onNavigateTo2FA}
          />

          <SettingsItem
            icon={
              isSigningOut ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 text-primary" />
              )
            }
            label={isSigningOut ? "Disconnessione in corso..." : "Esci dall'Account"}
            description={isSigningOut ? "Attendere prego" : "Disconnetti dal tuo account"}
            actionType={isSigningOut ? "custom" : "navigation"}
            onPress={onSignOut}
            disabled={isSigningOut}
          />
        </ListContainer>
      </PageSection>
    </PageSection>
  );
}
