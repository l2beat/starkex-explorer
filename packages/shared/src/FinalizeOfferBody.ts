import { Hash256 } from '@explorer/types'
import { z } from 'zod'

import { toJsonWithoutBigInts } from './serialize'
import { stringAs } from './types'

export const FinalizeOfferBody = z.object({
  offerId: z.number(),
  hash: stringAs(Hash256),
})

export type FinalizeOfferBody = z.infer<typeof FinalizeOfferBody>

export function serializeFinalizeOfferBody(data: FinalizeOfferBody) {
  return toJsonWithoutBigInts(data)
}
