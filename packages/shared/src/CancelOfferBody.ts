import { z } from 'zod'

import { toJsonWithoutBigInts } from './serialize'

export type CancelOfferBody = z.infer<typeof CancelOfferBody>
export const CancelOfferBody = z.object({
  signature: z.string(),
})

export function serializeCancelOfferBody(body: CancelOfferBody) {
  return toJsonWithoutBigInts(body)
}
