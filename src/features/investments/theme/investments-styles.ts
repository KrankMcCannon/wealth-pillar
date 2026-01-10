import { coreTokens } from "@/styles/core-tokens";

export const investmentsStyles = {
  page: {
    container: "bg-[#F8FAFC]",
    content: "flex-1",
  },
  header: {
    container: "shadow-sm",
  },
  main: {
    container: "p-4 pb-14",
  },
  overview: {
    container: "flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 mb-6",
    card: "flex w-64 shrink-0 flex-col rounded-2xl bg-card p-4 shadow-sm",
    cardHeader: "flex items-start justify-between",
    title: "text-base font-bold",
    value: "mt-2 text-2xl font-bold",
    delta: "mt-4",
    deltaRow: "flex justify-between text-sm font-medium",
    deltaPositive: `text-[${coreTokens.color.primary}]`,
  },
  holdings: {
    sectionHeader: "px-4 pb-3 pt-5",
    icon: `text-[${coreTokens.color.primary}]`,
    list: "space-y-3",
    item: "flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-sm",
    itemRow: "flex items-center gap-4",
    itemContent: "flex-1",
    itemHeader: "mb-1 flex items-center justify-between",
    itemSymbol: "text-base font-medium",
    itemValue: "text-sm font-medium",
  },
};
