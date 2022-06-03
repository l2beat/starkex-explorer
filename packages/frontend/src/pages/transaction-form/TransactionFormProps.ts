import {
  stringAs,
  stringAsBigInt,
  toJsonWithoutBigInts,
} from '@explorer/shared'
import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'
import { z } from 'zod'

import { AccountDetails } from '../common/AccountDetails'

export type TransactionFormProps = z.infer<typeof TransactionFormProps>
export const TransactionFormProps = z.object({
  account: AccountDetails,
  perpetualAddress: stringAs(EthereumAddress),
  selectedAsset: stringAs(AssetId),
  positionId: stringAsBigInt(),
  starkKey: stringAs(StarkKey),
  assets: z.array(
    z.object({
      assetId: stringAs(AssetId),
      balance: stringAsBigInt(),
      totalUSDCents: stringAsBigInt(),
      priceUSDCents: stringAsBigInt(),
    })
  ),
})

export function serializeTransactionFormProps(props: TransactionFormProps) {
  return toJsonWithoutBigInts(props)
}
