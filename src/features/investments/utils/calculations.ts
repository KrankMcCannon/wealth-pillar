import type { Investment } from '@/components/investments/personal-investment-tab';

export function calculateInvestmentMetrics(investments: Investment[]) {
  return investments.map((inv) => {
    const totalPaid = inv.totalPaid ?? inv.totalCost ?? (Number(inv.amount) + (Number(inv.tax_paid) || 0));
    const currentValue = Number(inv.currentValue || 0);
    const totalGain = inv.totalGain ?? (currentValue - totalPaid);

    return {
      ...inv,
      totalPaid,
      totalGain,
      currentValue,
    };
  });
}
