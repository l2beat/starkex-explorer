import { OnChainData } from '../OnChainData'
import { decodePerpetualCairoOutput } from './decodePerpetualCairoOutput'
import { decodeUpdates } from './decodeUpdates'
import { DecodingError } from './DecodingError'

export function decodeOnChainData(pages: string[]): OnChainData {
  const [first, ...rest] = pages
  if (!first) {
    throw new DecodingError('Missing first page of data')
  }
  const perpetualCairoOutput = decodePerpetualCairoOutput(first)
  const updates = decodeUpdates(rest.join(''))
  return { ...perpetualCairoOutput, ...updates }
}
