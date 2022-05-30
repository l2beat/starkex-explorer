import { PedersenHash, Timestamp } from '@explorer/types'

import { State } from '../OnChainData'
import { ByteReader } from './ByteReader'
import { readFundingIndices } from './readFundingIndices'
import { readOraclePrices } from './readOraclePrices'

export function decodeState(data: string): State {
  const reader = new ByteReader(data)

  const positionRoot = PedersenHash(reader.readHex(32))
  const positionHeight = reader.readNumber(32)
  const orderRoot = PedersenHash(reader.readHex(32))
  const orderHeight = reader.readNumber(32)
  const indices = readFundingIndices(reader)
  const timestamp = Timestamp.fromSeconds(reader.readNumber(32))
  const oraclePrices = readOraclePrices(reader)
  const systemTime = Timestamp.fromSeconds(reader.readNumber(32))

  reader.assertEnd()

  return {
    positionRoot,
    positionHeight,
    orderRoot,
    orderHeight,
    indices,
    timestamp,
    oraclePrices,
    systemTime,
  }
}
