import { AssetId } from '@explorer/types'

import { ByteReader } from './ByteReader'
import { decodeState } from './decodeState'

export function readState(reader: ByteReader, collateralAssetId: AssetId) {
  const stateSize = reader.readNumber(32)
  const stateData = reader.read(stateSize * 32)
  return decodeState(stateData, collateralAssetId)
}
