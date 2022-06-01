import { z } from 'zod'

import { AcceptOfferBody } from './AcceptOfferBody'
import { CreateOfferData } from './CreateOfferData'
import { toJsonWithoutBigInts } from './serialize'

export const FinalizeOfferData = CreateOfferData.merge(AcceptOfferBody)

export type FinalizeOfferData = z.infer<typeof FinalizeOfferData>

export function serializeFinalizeOfferData(data: FinalizeOfferData) {
  return toJsonWithoutBigInts(data)
}

export function deserializeFinalizeOfferData(text: string): FinalizeOfferData {
  return FinalizeOfferData.parse(JSON.parse(text))
}
