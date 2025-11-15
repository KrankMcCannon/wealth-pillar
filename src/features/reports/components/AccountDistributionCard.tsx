"use client";

import React from "react";
import { Card } from "@/src/components/ui";
import { Wallet } from "lucide-react";
import { reportsStyles } from "@/features/reports";

/**
 * Account Distribution Card
 * Shows how funds are distributed across different account types
 */

export interface AccountDistributionProps {
  accounts: null[];
  isLoading?: boolean;
}

// const ACCOUNT_ICONS: Record<string, React.ReactNode> = {
//   payroll: <Wallet className="h-5 w-5" />,
//   savings: <PiggyBank className="h-5 w-5" />,
//   cash: <Banknote className="h-5 w-5" />,
//   investments: <TrendingUp className="h-5 w-5" />,
// };

// const ACCOUNT_LABELS: Record<string, string> = {
//   payroll: "Stipendio",
//   savings: "Risparmio",
//   cash: "Contanti",
//   investments: "Investimenti",
// };

export function AccountDistributionCard({ accounts, isLoading = false }: Readonly<AccountDistributionProps>) {
  if (isLoading) {
    return (
      <Card className={reportsStyles.card.container}>
        <div className={reportsStyles.accountDistribution.container}>
          {[1, 2, 3, 4].map((i) => (
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

  return (
    <Card className={reportsStyles.card.container}>
      <div className={reportsStyles.accountDistribution.container}>
        {accounts.map((account, index) => (
          <div key={index} className={reportsStyles.accountDistribution.item}>
            <div className={reportsStyles.accountDistribution.accountInfo}>
              <div
                className={reportsStyles.accountDistribution.accountIcon}
                style={{
                  backgroundColor: ["bg-blue-100", "bg-green-100", "bg-amber-100", "bg-purple-100"][index % 4],
                }}
              >
                <div
                  style={{
                    color: ["text-blue-600", "text-green-600", "text-amber-600", "text-purple-600"][index % 4],
                  }}
                >
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
              <div className={reportsStyles.accountDistribution.accountDetails}>
                <h4 className={reportsStyles.accountDistribution.accountName}>Account {index + 1}</h4>
                <p className={reportsStyles.accountDistribution.accountType}>Type</p>
              </div>
            </div>
            <div className={reportsStyles.accountDistribution.accountValue}>
              <p className={reportsStyles.accountDistribution.accountAmount}>€0</p>
              <p className={reportsStyles.accountDistribution.accountPercent}>0%</p>
            </div>
          </div>
        ))}
        {accounts.length > 0 && (
          <div className="border-t border-primary/10 mt-3 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-black">Totale</span>
              <span className="text-sm font-bold text-primary">€0</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
