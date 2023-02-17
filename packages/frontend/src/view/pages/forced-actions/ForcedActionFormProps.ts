import {
  AccountDetails,
  stringAs,
  stringAsBigInt,
  toJsonWithoutBigInts,
} from '@explorer/shared'
import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'
import { z } from 'zod'

export type ForcedActionFormProps = z.infer<typeof ForcedActionFormProps>
export const ForcedActionFormProps = z.object({
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

export function serializeForcedActionsFormProps(props: ForcedActionFormProps) {
  return toJsonWithoutBigInts(props)
}
