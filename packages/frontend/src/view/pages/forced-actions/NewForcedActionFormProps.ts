import {
  AccountDetails,
  stringAs,
  stringAsBigInt,
  toJsonWithoutBigInts,
} from '@explorer/shared'
import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'
import { z } from 'zod'

export type NewForcedActionFormProps = z.infer<typeof NewForcedActionFormProps>
export const NewForcedActionFormProps = z.object({
  user: AccountDetails,
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

export function serializeForcedActionsFormProps(
  props: NewForcedActionFormProps
) {
  return toJsonWithoutBigInts(props)
}
