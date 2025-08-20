import { Person } from "./types";
import { BudgetPeriodsUtils } from "./lib/utils/budget-periods.utils";
import { DateUtils } from "./lib/utils/date.utils";
export { formatCurrency } from "./lib/utils/currency.utils";

// Avatar predefiniti per il mondo della finanza
export const FINANCE_AVATARS = [
  {
    id: "chart",
    icon: "📊",
  },
  {
    id: "briefcase",
    icon: "💼",
  },
  {
    id: "trending",
    icon: "📈",
  },
  {
    id: "calculator",
    icon: "🧮",
  },
  {
    id: "money",
    icon: "💰",
  },
  {
    id: "target",
    icon: "🎯",
  },
  {
    id: "beach",
    icon: "🏖️",
  },
  {
    id: "clipboard",
    icon: "📋",
  },
  {
    id: "phone",
    icon: "📱",
  },
  {
    id: "graduation",
    icon: "🎓",
  },
] as const;

// Helper per ottenere avatar disponibili (non utilizzati da altre persone)
export const getAvailableAvatars = (people: Person[], currentPersonId?: string) => {
  const usedAvatarIds = people
    .filter((person) => person.id !== currentPersonId) // Escludi la persona corrente se in modifica
    .map((person) => person.avatar)
    .filter((avatar) => FINANCE_AVATARS.some((a) => a.id === avatar)); // Solo avatar predefiniti

  return FINANCE_AVATARS.filter((avatar) => !usedAvatarIds.includes(avatar.id));
};

// Helper per ottenere un avatar per ID
export const getAvatarById = (avatarId: string) => {
  return FINANCE_AVATARS.find((avatar) => avatar.id === avatarId);
};

// Helper per ottenere l'icona dell'avatar di una persona
export const getPersonAvatarIcon = (person: Person) => {
  // Se l'avatar è un ID predefinito, restituisci l'icona dell'avatar
  const predefinedAvatar = getAvatarById(person.avatar);
  if (predefinedAvatar) {
    return predefinedAvatar.icon;
  }
  // Altrimenti restituisci la prima lettera del nome
  return person.name.charAt(0).toUpperCase();
};

// Helper per verificare se un avatar è predefinito
export const isPredefinedAvatar = (avatar: string) => {
  return FINANCE_AVATARS.some((a) => a.id === avatar);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("it-IT", { year: "numeric", month: "short", day: "numeric" });
};

// Helper function to calculate the current budget period for a person
export const getCurrentBudgetPeriod = (person: Person) => {
  // Prova prima a usare i periodi salvati nel database
  const currentPeriod = BudgetPeriodsUtils.getCurrentPeriod(person);

  if (currentPeriod) {
    // Se esiste un periodo corrente salvato, utilizzalo
    const periodStart = new Date(currentPeriod.startDate);

    let periodEnd: Date;
    if (currentPeriod.endDate) {
      // Se il periodo è completato, usa la data di fine salvata
      periodEnd = new Date(currentPeriod.endDate);
    } else {
      // Se il periodo è in corso, calcola la data di fine presunta
      const endDateString = BudgetPeriodsUtils.calculatePeriodEndDate(person, currentPeriod.startDate);
      periodEnd = new Date(endDateString);
    }

    return { periodStart, periodEnd };
  }

  // Fallback al calcolo tradizionale se non ci sono periodi salvati
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
    periodStart = DateUtils.moveToPreviousWorkingDay(periodStart);

    // Calculate end date (day before next period start)
    const nextPeriodStart = new Date(currentYear, currentMonth + 1, budgetStartDay);
    // La data di fine è il giorno prima dell'inizio del periodo successivo
    periodEnd = new Date(nextPeriodStart.getTime() - 24 * 60 * 60 * 1000);
    // Aggiusta solo se la data di fine cade in un festivo/weekend
    periodEnd = DateUtils.moveToPreviousWorkingDay(periodEnd);
  } else {
    // We're still in the previous budget period
    periodStart = new Date(currentYear, currentMonth - 1, budgetStartDay);
    periodStart = DateUtils.moveToPreviousWorkingDay(periodStart);

    // End date is day before current period start
    const currentPeriodStart = new Date(currentYear, currentMonth, budgetStartDay);
    // La data di fine è il giorno prima dell'inizio del periodo corrente
    periodEnd = new Date(currentPeriodStart.getTime() - 24 * 60 * 60 * 1000);
    // Aggiusta solo se la data di fine cade in un festivo/weekend
    periodEnd = DateUtils.moveToPreviousWorkingDay(periodEnd);
  }

  return { periodStart, periodEnd };
};

// Helper function to format date without timezone issues
export const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getInitialDateRange = (selectedPersonId: string, people: Person[]) => {
  const isAllView = selectedPersonId === "all";

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
    // For single person view, use their current budget period from database
    const selectedPerson = people.find((p) => p.id === selectedPersonId);
    if (selectedPerson && selectedPerson.budgetStartDate) {
      const currentPeriod = BudgetPeriodsUtils.getCurrentPeriod(selectedPerson);

      if (currentPeriod) {
        const startDate = formatDateLocal(new Date(currentPeriod.startDate));

        let endDate: string;
        if (currentPeriod.endDate) {
          // Periodo completato, usa la data di fine salvata
          endDate = formatDateLocal(new Date(currentPeriod.endDate));
        } else {
          // Periodo in corso, calcola la data di fine presunta con utility centralizzata
          endDate = BudgetPeriodsUtils.calculatePeriodEndDate(selectedPerson, currentPeriod.startDate);
        }

        return { startDate, endDate };
      } else {
        // Fallback al calcolo tradizionale se non ci sono periodi salvati
        const { periodStart, periodEnd } = getCurrentBudgetPeriod(selectedPerson);
        return {
          startDate: formatDateLocal(periodStart),
          endDate: formatDateLocal(periodEnd),
        };
      }
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
