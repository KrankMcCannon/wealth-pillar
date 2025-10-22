"use client";

import { Card } from "@/components/ui/card";
import { IconContainer, Text, Amount } from "@/components/ui/primitives";
import { Building2 } from "lucide-react";
import { Account, AccountTypeMap } from "@/lib/types";

interface BankAccountCardProps {
  account: Account;
  accountBalance: number;
  onClick: () => void;
}

export function BankAccountCard({ account, accountBalance, onClick }: BankAccountCardProps) {
  return (
    <Card
      className="px-3 py-2 min-w-[180px] flex-shrink-0 bg-card border border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all duration-200 cursor-pointer shadow-sm"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        {/* Left - Icon */}
        <IconContainer size="md" color="primary" className="rounded-full">
          <Building2 className="h-5 w-5" />
        </IconContainer>

        {/* Center - Title and Type */}
        <div className="flex flex-col flex-1 mx-3">
          <Text
            variant="emphasis"
            size="sm"
            as="h3"
            className="truncate max-w-[140px] sm:max-w-[160px]"
          >
            {account.name}
          </Text>
          <Text variant="muted" size="xs">
            {AccountTypeMap[account.type] || account.type}
          </Text>
        </div>

        {/* Right - Amount */}
        <div className="flex flex-col text-right">
          <Amount
            type={accountBalance < 0 ? 'expense' : 'income'}
            size="sm"
            emphasis="strong"
          >
            {Math.abs(accountBalance)}
          </Amount>
          {accountBalance < 0 && (
            <Text variant="muted" size="xs" className="text-destructive/80 font-medium">
              DEBITO
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
}
