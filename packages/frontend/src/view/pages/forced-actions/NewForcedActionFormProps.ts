import {
  CollateralAsset,
  stringAs,
  stringAsBigInt,
  toJsonWithoutBigInts,
} from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import { z } from 'zod'

import { Asset } from '../../../utils/assets'

export type NewForcedActionFormAsset = z.infer<typeof NewForcedActionFormAsset>
export const NewForcedActionFormAsset = Asset.extend({
  balance: stringAsBigInt(),
  priceUSDCents: stringAsBigInt(),
})

export type NewSpotForcedActionFormProps = z.infer<
  typeof NewSpotForcedActionFormProps
>
export const NewSpotForcedActionFormProps = z.object({
  starkExAddress: stringAs(EthereumAddress),
  positionOrVaultId: stringAsBigInt(),
  starkKey: stringAs(StarkKey),
  asset: NewForcedActionFormAsset,
})

export type NewPerpetualForcedActionFormProps = z.infer<
  typeof NewPerpetualForcedActionFormProps
>
export const NewPerpetualForcedActionFormProps = z.object({
  starkExAddress: stringAs(EthereumAddress),
  positionOrVaultId: stringAsBigInt(),
  starkKey: stringAs(StarkKey),
  asset: NewForcedActionFormAsset,
  collateralAsset: CollateralAsset,
})

export function serializeForcedActionsFormProps(
  props: NewSpotForcedActionFormProps | NewPerpetualForcedActionFormProps
) {
  return toJsonWithoutBigInts(props)
}
