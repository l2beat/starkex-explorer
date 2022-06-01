import { stringAs } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import { z } from 'zod'

export type AccountDetails = z.infer<typeof AccountDetails>
export const AccountDetails = z.object({
  address: stringAs(EthereumAddress),
  positionId: z.bigint().optional(),
  hasUpdates: z.boolean(),
})
