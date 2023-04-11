import { z } from 'zod'
import { InstanceName } from './InstanceName'
import { TradingMode } from './TradingMode'
import { UserDetails } from './UserDetails'

export type PageContext = z.infer<typeof PageContext>
export const PageContext = z.object({
  user: UserDetails.optional(),
  instanceName: InstanceName,
  tradingMode: TradingMode,
})

export type PageContextWithUser = z.infer<typeof PageContextWithUser>
export const PageContextWithUser = PageContext.extend({
  user: UserDetails,
})

export function isPageContextUserDefined(
  context: PageContext
): context is PageContextWithUser {
  return context.user !== undefined
}
