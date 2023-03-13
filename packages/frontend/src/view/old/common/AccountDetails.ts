import { stringAs, stringAsBigInt } from '@explorer/shared'
import { EthereumAddress , IsWalletConnect} from '@explorer/types'
import { z } from 'zod'

export type AccountDetails = z.infer<typeof AccountDetails>
export const AccountDetails = z.object({
  address: stringAs(EthereumAddress),
  positionId: stringAsBigInt().optional(),
  hasUpdates: z.boolean().optional(),
  is_wallet_connect: stringAs(IsWalletConnect)
})
