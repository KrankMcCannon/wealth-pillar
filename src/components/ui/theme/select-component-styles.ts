export const selectComponentStyles = {
  scrollButton: 'flex cursor-default items-center justify-center py-1',
  scrollIcon: 'h-4 w-4',
  contentOffset:
    'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
  viewportPopper: 'h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)',
  itemCheckIcon: 'h-4 w-4',
} as const;
