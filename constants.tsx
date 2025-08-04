import { Person } from "./types";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('it-IT', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Helper function to get the previous working day if the date falls on weekend
export const getPreviousWorkingDay = (date: Date): Date => {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0) { // Sunday
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - 2); // Go to Friday
    return newDate;
  } else if (day === 6) { // Saturday
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - 1); // Go to Friday
    return newDate;
  }
  return date; // It's already a working day
};

// Helper function to calculate the current budget period for a person
export const getCurrentBudgetPeriod = (person: Person) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const budgetStartDay = parseInt(person.budgetStartDate);
  const currentDay = today.getDate();

  let periodStart: Date;
  let periodEnd: Date;

  if (currentDay >= budgetStartDay) {
    // We're in the current budget period
    periodStart = new Date(currentYear, currentMonth, budgetStartDay);
    periodStart = getPreviousWorkingDay(periodStart);

    // Calculate end date (day before next period start)
    const nextPeriodStart = new Date(currentYear, currentMonth + 1, budgetStartDay);
    const nextPeriodStartAdjusted = getPreviousWorkingDay(nextPeriodStart);
    periodEnd = new Date(nextPeriodStartAdjusted);
    periodEnd.setDate(periodEnd.getDate() - 1);
  } else {
    // We're still in the previous budget period
    periodStart = new Date(currentYear, currentMonth - 1, budgetStartDay);
    periodStart = getPreviousWorkingDay(periodStart);

    // End date is day before current period start
    const currentPeriodStart = new Date(currentYear, currentMonth, budgetStartDay);
    const currentPeriodStartAdjusted = getPreviousWorkingDay(currentPeriodStart);
    periodEnd = new Date(currentPeriodStartAdjusted);
    periodEnd.setDate(periodEnd.getDate() - 1);
  }

  return { periodStart, periodEnd };
};

export const getPreviewDate = (budgetStartDay: string) => {
  if (!budgetStartDay) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const startDay = parseInt(budgetStartDay);

  // Calculate next budget start date
  let nextStart = new Date(currentYear, currentMonth, startDay);
  if (nextStart <= today) {
    nextStart = new Date(currentYear, currentMonth + 1, startDay);
  }

  const adjustedDate = getPreviousWorkingDay(nextStart);
  return adjustedDate;
};

// Helper function to format date without timezone issues
export const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getInitialDateRange = (selectedPersonId: string, people: Person[]) => {
  const isAllView = selectedPersonId === 'all';

  if (isAllView) {
    // For all view, use the current month (1st to last day)
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month

    return {
      startDate: formatDateLocal(startOfMonth),
      endDate: formatDateLocal(endOfMonth),
    };
  } else {
    // For single person view, use their budget period
    const selectedPerson = people.find(p => p.id === selectedPersonId);
    if (selectedPerson && selectedPerson.budgetStartDate) {
      const { periodStart, periodEnd } = getCurrentBudgetPeriod(selectedPerson);

      return {
        startDate: formatDateLocal(periodStart),
        endDate: formatDateLocal(periodEnd),
      };
    } else {
      // Fallback to month view if no budget start date
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      return {
        startDate: formatDateLocal(startOfMonth),
        endDate: formatDateLocal(endOfMonth),
      };
    }
  }
};