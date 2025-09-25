"use client";

import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Account, AccountTypeMap } from "@/lib/types";

interface BankAccountCardProps {
  account: Account;
  accountBalance: number;
  onClick: () => void;
}

export function BankAccountCard({ account, accountBalance, onClick }: BankAccountCardProps) {
  return (
    <Card
      className="px-3 py-2 min-w-[180px] flex-shrink-0 bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        {/* Left - Icon */}
        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg">
          <Building2 className="h-5 w-5 budget-icon" />
        </div>

        {/* Center - Title and Type */}
        <div className="flex flex-col flex-1 mx-3">
          <h3 className="font-semibold text-slate-900 text-sm truncate max-w-[140px] sm:max-w-[160px]">
            {account.name}
          </h3>
          <p className="text-xs text-gray-500">{AccountTypeMap[account.type] || account.type}</p>
        </div>

        {/* Right - Amount */}
        <div className="flex flex-col text-right">
          <p className={`text-sm font-bold ${accountBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {accountBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(accountBalance))}
          </p>
          {accountBalance < 0 && (
            <p className="text-xs text-red-500 font-medium">DEBITO</p>
          )}
        </div>
      </div>
    </Card>
  );
}