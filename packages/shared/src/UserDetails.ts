import { EthereumAddress, StarkKey } from '@explorer/types'
import { z } from 'zod'

import { stringAs } from './types'

export type UserDetails = z.infer<typeof UserDetails>
export const UserDetails = z.object({
  address: stringAs(EthereumAddress),
  starkKey: z.optional(stringAs(StarkKey)),
})
