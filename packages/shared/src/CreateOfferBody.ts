import { AssetId, StarkKey } from '@explorer/types'
import { z } from 'zod'

import { toJsonWithoutBigInts } from './serialize'
import { stringAs, stringAsBigInt } from './types'

export type CreateOfferBody = z.infer<typeof CreateOfferBody>
export const CreateOfferBody = z.object({
  offer: z.object({
    starkKeyA: stringAs(StarkKey),
    positionIdA: stringAsBigInt(),
    syntheticAssetId: stringAs(AssetId),
    amountCollateral: stringAsBigInt(),
    amountSynthetic: stringAsBigInt(),
    aIsBuyingSynthetic: z.boolean(),
  }),
  signature: z.string(),
})

export function serializeCreateOfferBody(body: CreateOfferBody) {
  return toJsonWithoutBigInts(body)
}
