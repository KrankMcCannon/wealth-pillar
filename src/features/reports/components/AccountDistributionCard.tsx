"use client";

import React from "react";
import { Card } from "@/src/components/ui";
import { Wallet, PiggyBank, Banknote, TrendingUp } from "lucide-react";
import { reportsStyles } from "@/features/reports";
import type { AccountMetrics } from "@/features/reports/services";

/**
 * Account Distribution Card
 * Shows how funds are distributed across different account types
 */

export interface AccountDistributionProps {
  accounts: AccountMetrics[];
  isLoading?: boolean;
}

const ACCOUNT_ICONS: Record<string, React.ReactNode> = {
  payroll: <Wallet className="h-5 w-5" />,
  savings: <PiggyBank className="h-5 w-5" />,
  cash: <Banknote className="h-5 w-5" />,
  investments: <TrendingUp className="h-5 w-5" />,
};

const ACCOUNT_LABELS: Record<string, string> = {
  payroll: "Stipendio",
  savings: "Risparmio",
  cash: "Contanti",
  investments: "Investimenti",
};

export function AccountDistributionCard({ accounts, isLoading = false }: Readonly<AccountDistributionProps>) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className={reportsStyles.card.container}>
        <div className={reportsStyles.accountDistribution.container}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`${reportsStyles.skeleton.base} h-12`}></div>
          ))}
        </div>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className={reportsStyles.card.container}>
        <div className={reportsStyles.emptyState.container}>
          <p className={reportsStyles.emptyState.title}>Nessun conto</p>
          <p className={reportsStyles.emptyState.description}>Aggiungi conti per visualizzare la loro distribuzione</p>
        </div>
      </Card>
    );
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <Card className={reportsStyles.card.container}>
      <div className={reportsStyles.accountDistribution.container}>
        {accounts.map((account, index) => (
          <div key={account.accountId} className={reportsStyles.accountDistribution.item}>
            <div className={reportsStyles.accountDistribution.accountInfo}>
              <div
                className={reportsStyles.accountDistribution.accountIcon}
                style={{
                  backgroundColor: ['bg-blue-100', 'bg-green-100', 'bg-amber-100', 'bg-purple-100'][
                    index % 4
                  ],
                }}
              >
                <div
                  style={{
                    color: ['text-blue-600', 'text-green-600', 'text-amber-600', 'text-purple-600'][
                      index % 4
                    ],
                  }}
                >
                  {ACCOUNT_ICONS[account.accountType] || <Wallet className="h-5 w-5" />}
                </div>
              </div>
              <div className={reportsStyles.accountDistribution.accountDetails}>
                <h4 className={reportsStyles.accountDistribution.accountName}>
                  {account.accountName}
                </h4>
                <p className={reportsStyles.accountDistribution.accountType}>
                  {ACCOUNT_LABELS[account.accountType] || account.accountType}
                </p>
              </div>
            </div>
            <div className={reportsStyles.accountDistribution.accountValue}>
              <p className={reportsStyles.accountDistribution.accountAmount}>
                {formatCurrency(account.balance)}
              </p>
              <p className={reportsStyles.accountDistribution.accountPercent}>
                {account.percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
        {totalBalance > 0 && (
          <div className="border-t border-primary/10 mt-3 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-black">Totale</span>
              <span className="text-sm font-bold text-primary">
                {formatCurrency(totalBalance)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
