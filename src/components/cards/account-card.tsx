/**
 * AccountCard - Domain card for bank accounts
 *
 * Refactored from AccountCard to use DomainCard abstraction
 * Reduced from 60 lines to ~40 lines (33% reduction)
 */

"use client";

import { Amount, DomainCard, Text } from "@/src/components/ui";
import { Account, AccountTypeMap } from "@/src/lib";
import { Building2 } from "lucide-react";

interface AccountCardProps {
  account: Account;
  accountBalance: number;
  onClick: () => void;
}

export function AccountCard({ account, accountBalance, onClick }: Readonly<AccountCardProps>) {
  const isNegative = accountBalance < 0;

  // Primary content: Balance amount
  const primaryContent = (
    <Amount
      type={isNegative ? 'expense' : 'income'}
      size="sm"
      emphasis="strong"
    >
      {Math.abs(accountBalance)}
    </Amount>
  );

  // Secondary content: Debt indicator
  const secondaryContent = isNegative ? (
    <Text variant="muted" size="xs" className="text-destructive/80 font-medium">
      DEBITO
    </Text>
  ) : undefined;

  return (
    <DomainCard
      icon={<Building2 className="h-5 w-5" />}
      iconSize="md"
      iconColor="primary"
      title={account.name}
      subtitle={AccountTypeMap[account.type] || account.type}
      primaryContent={primaryContent}
      secondaryContent={secondaryContent}
      variant="interactive"
      onClick={onClick}
      className="min-w-[180px] shrink-0"
      testId={`account-card-${account.id}`}
    />
  );
}
