import { StarkKey } from '@explorer/types'
import { z } from 'zod'

import { toJsonWithoutBigInts } from './serialize'
import { stringAs, stringAsBigInt } from './types'

export type AcceptOfferBody = z.infer<typeof AcceptOfferBody>
export const AcceptOfferBody = z.object({
  starkKeyB: stringAs(StarkKey),
  positionIdB: stringAsBigInt(),
  submissionExpirationTime: stringAsBigInt(),
  nonce: stringAsBigInt(),
  signature: z.string(),
  premiumCost: z.boolean(),
})

export function serializeAcceptOfferBody(body: AcceptOfferBody) {
  return toJsonWithoutBigInts(body)
}
