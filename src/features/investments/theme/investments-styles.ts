export const investmentsStyles = {
  container: 'space-y-5 sm:space-y-8 pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom)))]',
  card: {
    root: 'rounded-2xl border border-[#3359c5]/20 bg-[#0b1f4f]/90 shadow-[0_16px_36px_rgba(0,7,30,0.28)] overflow-hidden backdrop-blur-[24px]',
    header: 'px-4 pt-4 sm:px-5 sm:pt-5',
    headerWithBorder: 'px-4 pt-4 sm:px-5 sm:pt-5 border-b border-[#3359c5]/25 bg-[#11295f]/40',
    content: 'p-4 sm:p-5',
    contentNoPadding: 'p-0',
    title: 'text-lg sm:text-xl font-semibold text-[#8fb0ff]',
    description: 'text-[#8fa2dd] text-sm sm:text-base',
  },
  charts: {
    grid: 'grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 min-w-0 min-h-[260px]',
    container:
      'h-[220px] min-h-[220px] w-full min-w-0 shrink-0 sm:h-[300px] sm:min-h-[300px] relative',
    sandboxContainer:
      'h-[280px] min-h-[200px] w-full min-w-0 shrink-0 sm:h-[360px] sm:min-h-[280px]',
    fallback:
      'flex h-[220px] min-h-[180px] sm:h-[300px] sm:min-h-[260px] items-center justify-center text-[#9fb0d7] bg-[#11295f]/60 rounded-xl px-3 text-center text-sm border border-white/[0.08]',
  },
  list: {
    item: 'flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 px-4 hover:bg-[#17336f] transition-colors duration-200 border-b border-[#3359c5]/15 last:border-0',
    itemContent: 'mb-2 sm:mb-0 min-w-0 flex-1',
    itemTitle: 'font-semibold text-[15px] text-[#e6ecff] truncate',
    badgeWrapper: 'flex items-center gap-2 mt-1',
    badge:
      'inline-flex items-center rounded-md bg-[#183166] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9fb9ff] ring-1 ring-inset ring-[#8fb0ff]/25',
    separator: 'text-[11px] text-[#6f8dd5]',
    sharesText: 'text-[12px] text-[#9fb0d7]',
    valueContainer:
      'text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 bg-[#11295f]/60 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-white/[0.04] sm:border-0',
    valuePrimary: 'font-bold text-lg text-[#e6ecff] tabular-nums',
    valueDetails: 'flex flex-row sm:flex-col justify-between sm:items-end gap-x-4',
    valueLabel: 'text-[10px] font-semibold uppercase tracking-wide text-[#9fb0d7] mt-1',
    valueGain: (isPositive: boolean) =>
      `text-sm font-medium mt-0.5 tabular-nums ${isPositive ? 'text-[#8fe2b4]' : 'text-[#f0a6a6]'}`,
  },
  sandbox: {
    grid: 'grid gap-4 sm:gap-6 md:grid-cols-3 p-4 sm:p-8 bg-[#0b1f4f]/95 rounded-2xl border border-[#3359c5]/25 shadow-xl',
    inputGroup: 'space-y-2',
    label: 'text-[11px] font-semibold uppercase tracking-wider text-[#9fb0d7]',
    input:
      'font-medium text-lg h-12 bg-[#11295f]/80 border-[#3359c5]/35 text-[#e6ecff] focus:ring-[#6b9fff]/35 focus:border-[#5c77cc]/55 rounded-xl',
    chartSection: 'p-4 sm:p-6 border-t border-[#3359c5]/25 bg-[#0b1f4f]/80 rounded-b-2xl',
  },
  selector: {
    trigger:
      'flex h-11 w-full items-center justify-between rounded-xl border border-[#3359c5]/35 bg-[#11295f]/80 px-4 py-2 text-sm font-medium text-[#e6ecff] transition-all hover:bg-[#183166] hover:border-[#5c77cc]/55 focus:outline-none focus:ring-2 focus:ring-[#6b9fff]/35 focus:border-[#5c77cc]/55',
    triggerLabel: 'truncate text-[#e6ecff]',
    triggerIcon: 'h-4 w-4 text-[#8fb0ff] shrink-0',
    content:
      'z-[160] min-w-[280px] overflow-hidden rounded-2xl border border-[#3359c5]/40 bg-[#0b1f4f]/95 text-[#e6ecff] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200',
    searchWrap: 'border-b border-[#3359c5]/25 p-3 bg-[#0b1f4f]/40',
    searchFieldWrap: 'relative flex items-center',
    searchIcon: 'absolute left-3 h-4 w-4 text-[#8fb0ff]/60 pointer-events-none',
    searchInput:
      'h-10 w-full rounded-lg border border-[#3359c5]/25 bg-[#11295f]/60 pl-10 pr-4 text-sm text-[#e6ecff] placeholder:text-[#9fb0d7]/40 focus:outline-none focus:ring-2 focus:ring-[#6b9fff]/35 focus:border-[#5c77cc]/55 transition-all',
    viewport: 'max-h-[320px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#3359c5]/30',
    groupHeader: 'px-2 py-2 mb-1',
    groupTitle: 'text-[10px] font-bold uppercase tracking-widest text-[#8fa2dd]',
    item: 'relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors hover:bg-[#183166] focus:bg-[#183166] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:bg-[#3359c5]/30 data-[state=checked]:text-[#8fb0ff]',
    itemLabel: 'block truncate',
    itemSublabel: 'text-[11px] text-[#9fb0d7]/70 mt-0.5',
    empty: 'py-8 text-center text-sm text-[#9fb0d7]/50',
    assetTypeButton: (isActive: boolean) =>
      `px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all ${
        isActive
          ? 'bg-[#3359c5] border-[#5c77cc] text-white shadow-[0_0_12px_rgba(51,89,197,0.3)]'
          : 'bg-[#11295f]/40 border-[#3359c5]/25 text-[#9fb0d7] hover:border-[#3359c5]/50'
      }`,
  },
  pagination: {
    wrapper:
      'border-t border-[#3359c5]/10 px-4 py-3.5 flex items-center justify-between gap-3 bg-[#11295f]/20',
    info: 'text-[11px] text-[#9fb0d7]/60 tabular-nums font-medium',
    infoHighlight: 'text-[#8fb0ff] font-semibold',
    controls: 'flex items-center gap-1',
    button:
      'inline-flex items-center justify-center h-8 min-w-[2rem] px-2.5 rounded-full text-[13px] font-medium transition-all duration-150 border border-[#3359c5]/20 bg-[#11295f]/40 text-[#8fb0ff]/70 hover:bg-[#183166] hover:text-[#8fb0ff] hover:border-[#5c77cc]/50 disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/30',
    buttonActive:
      'bg-[#3359c5] text-white border-[#5c77cc] shadow-[0_0_15px_rgba(51,89,197,0.3)] hover:bg-[#3359c5]/90 hover:text-white hover:border-[#5c77cc]',
    buttonIcon: 'h-3.5 w-3.5',
    ellipsis:
      'inline-flex items-center justify-center h-8 min-w-[2rem] text-xs text-[#9fb0d7]/40 select-none',
    loadingSpinner:
      'h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#8fb0ff] border-t-transparent',
    perPageWrapper: 'flex items-center gap-1.5 shrink-0',
    perPageLabel: 'text-[11px] text-[#9fb0d7]/50 font-medium hidden sm:block',
    perPageSelect:
      'h-8 rounded-full border border-[#3359c5]/20 bg-[#11295f]/40 text-[13px] font-medium text-[#8fb0ff]/80 px-2.5 pr-6 appearance-none cursor-pointer hover:border-[#5c77cc]/50 hover:bg-[#183166] focus:outline-none focus:ring-2 focus:ring-[#6b9fff]/30 transition-all duration-150',
    perPageChevron: 'text-[#8fb0ff]/50',
    mobileIndicator: 'sm:hidden px-3 text-[13px] font-semibold text-[#8fb0ff] tabular-nums',
  },
  skeletons: {
    header:
      'h-48 rounded-2xl bg-[#11295f]/40 animate-pulse border border-[#3359c5]/20 flex flex-col items-center justify-center space-y-4',
    allocation:
      'min-h-[400px] lg:min-h-[360px] rounded-2xl bg-[#11295f]/40 animate-pulse border border-[#3359c5]/20 p-6 flex flex-col lg:flex-row gap-8 items-center',
    donut:
      'relative h-[225px] w-[225px] lg:h-[280px] lg:w-[280px] rounded-full border-[24px] border-[#3359c5]/20 flex items-center justify-center',
    legend: 'flex-1 w-full space-y-3',
    legendItem:
      'h-16 rounded-2xl bg-[#11295f]/60 border border-white/[0.04] px-4 flex items-center justify-between',
    chart: 'h-[300px] rounded-2xl bg-[#11295f]/40 animate-pulse border border-[#3359c5]/20',
    list: 'space-y-3 mt-8',
    listItem:
      'h-20 rounded-2xl bg-[#11295f]/30 animate-pulse border border-[#3359c5]/15 px-4 flex items-center justify-between',
    itemPrimary: 'h-4 w-32 rounded bg-[#3359c5]/20 mb-2',
    itemSecondary: 'h-3 w-20 rounded bg-[#3359c5]/10',
    itemAmount: 'h-5 w-24 rounded bg-[#3359c5]/20',
  },
};
