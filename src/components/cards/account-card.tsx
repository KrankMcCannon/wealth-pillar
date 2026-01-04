"use client";

import { memo } from "react";
import { Building2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { truncateText } from "@/lib/utils";
import { Account, AccountTypeMap } from "@/lib/types";
import { DomainCard } from "@/src/components/ui/layout/domain-card";
import { Amount, Text } from "@/src/components/ui/primitives";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button
} from "@/components/ui";

interface AccountCardProps {
  account: Account;
  accountBalance: number;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const AccountCard = memo(function AccountCard({ account, accountBalance, onClick, onEdit, onDelete }: Readonly<AccountCardProps>) {
  const isNegative = accountBalance < 0;

  // Primary content: Balance amount
  const primaryContent = (
    <Amount
      type={isNegative ? 'expense' : 'income'}
      size="md"
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

  const actions = (onEdit || onDelete) ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Modifica</span>
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Elimina</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : undefined;

  return (
    <DomainCard
      icon={<Building2 className="h-5 w-5" />}
      iconSize="md"
      iconColor="primary"
      title={truncateText(account.name, 20)}
      subtitle={AccountTypeMap[account.type] || account.type}
      primaryContent={primaryContent}
      secondaryContent={secondaryContent}
      variant="interactive"
      onClick={onClick}
      className="min-w-[180px] shrink-0"
      testId={`account-card-${account.id}`}
      actions={actions}
    />
  );
});
