export const dataTableTypography = {
  headerText: 'text-xs md:text-sm font-mono font-semibold uppercase tracking-wide',
  cellText: 'text-sm lg:text-data font-mono leading-snug',
  badgeText: 'text-xs md:text-sm font-mono',
  chromeText: 'text-sm font-mono',
  emptyMessage: 'text-sm',
} as const;

export const dataTableLayout = {
  semanticColumn: 'min-w-72',
  semanticContent: 'line-clamp-2 break-words',
  nowrap: 'whitespace-nowrap',
  touchControl: 'min-h-11 md:min-h-9',
  touchIconButton: 'min-h-11 min-w-11 md:min-h-8 md:min-w-8',
  search: 'w-full md:w-80 lg:w-96',
  filterGrid: 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap',
} as const;
