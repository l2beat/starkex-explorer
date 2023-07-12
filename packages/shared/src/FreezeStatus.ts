export const FreezeStatuses = ['not-frozen', 'freezable', 'frozen'] as const
export type FreezeStatus = typeof FreezeStatuses[number]
