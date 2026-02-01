import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { AccountTypeSummary } from "@/server/services/reports.service";
import { reportsStyles } from "@/features/reports/theme/reports-styles";
import {
  Landmark,
  Wallet,
  TrendingUp,
  PiggyBank,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";

interface SummarySectionProps {
  data: AccountTypeSummary[];
}

const getAccountIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'payroll': return <Landmark className={reportsStyles.summary.cardIcon} />;
    case 'savings': return <PiggyBank className={reportsStyles.summary.cardIcon} />;
    case 'investments': return <TrendingUp className={reportsStyles.summary.cardIcon} />;
    case 'cash': return <Wallet className={reportsStyles.summary.cardIcon} />;
    default: return <CreditCard className={reportsStyles.summary.cardIcon} />;
  }
};

export function SummarySection({ data }: SummarySectionProps) {
  return (
    <div className="space-y-4">
      <h3 className={reportsStyles.periods.sectionTitle}>Summary</h3>
      <div className={reportsStyles.summary.grid}>
        {data.map((item) => (
          <div key={item.type} className={reportsStyles.summary.card}>
            <div className={reportsStyles.summary.gradientBg} style={{ background: 'radial-gradient(circle, rgba(var(--primary-rgb), 0.15) 0%, transparent 70%)' }}></div>
            <CardHeader className={reportsStyles.summary.cardHeader}>
              <CardTitle className={reportsStyles.summary.cardTitle}>
                {item.type}
              </CardTitle>
              {getAccountIcon(item.type)}
            </CardHeader>
            <CardContent className={reportsStyles.summary.cardContent}>
              <div className={reportsStyles.summary.balance}>{formatCurrency(item.totalBalance)}</div>

              <div className={reportsStyles.summary.metricsGrid}>
                <div className={reportsStyles.summary.metricRow}>
                  <span className={reportsStyles.summary.metricLabel}>Income</span>
                  <div className="flex items-center gap-1">
                    <ArrowUpCircle className="w-3 h-3 text-emerald-500" />
                    <span className={reportsStyles.summary.metricValueIncome}>+{formatCurrency(item.totalEarned)}</span>
                  </div>
                </div>
                <div className={reportsStyles.summary.metricRow}>
                  <span className={reportsStyles.summary.metricLabel}>Expenses</span>
                  <div className="flex items-center gap-1">
                    <ArrowDownCircle className="w-3 h-3 text-red-500" />
                    <span className={reportsStyles.summary.metricValueExpense}>-{formatCurrency(item.totalSpent)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-primary/60 col-span-full text-center py-8">No summary data available.</p>
        )}
      </div>
    </div>
  );
}
