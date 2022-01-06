import { ByteReader } from './ByteReader'
import { readFundingIndices } from './readFundingIndices'
import { readOraclePrices } from './readOraclePrices'

export function decodeState(data: string) {
  const reader = new ByteReader(data)

  const positionRoot = reader.readHex(32)
  const positionHeight = reader.readNumber(32)
  const orderRoot = reader.readHex(32)
  const orderHeight = reader.readNumber(32)
  const indices = readFundingIndices(reader)
  const timestamp = reader.readBigInt(32)
  const oraclePrices = readOraclePrices(reader)
  const systemTime = reader.readBigInt(32)

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
