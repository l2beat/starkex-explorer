import { AssetId } from '@explorer/types'

import { OnChainData } from '../OnChainData'
import { decodePerpetualCairoOutput } from './decodePerpetualCairoOutput'
import { decodeUpdates } from './decodeUpdates'
import { DecodingError } from './DecodingError'

export function decodeOnChainData(
  pages: string[],
  collateralAssetId: AssetId
): OnChainData {
  const [first, ...rest] = pages
  if (!first) {
    throw new DecodingError('Missing first page of data')
  }
  const perpetualCairoOutput = decodePerpetualCairoOutput(
    first,
    collateralAssetId
  )
  const updates = decodeUpdates(rest.join(''), collateralAssetId)
  return { ...perpetualCairoOutput, ...updates }
}
