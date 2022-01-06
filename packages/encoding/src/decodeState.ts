import { decodeAssetId } from './assetId'
import { ByteReader } from './ByteReader'
import { readFundingIndices } from './readFundingIndices'

export function decodeState(data: string) {
  const reader = new ByteReader(data)

  const positionRoot = reader.readHex(32)
  const positionHeight = reader.readNumber(32)
  const orderRoot = reader.readHex(32)
  const orderHeight = reader.readNumber(32)

  const indices = readFundingIndices(reader)
  const timestamp = reader.readBigInt(32)

  const oraclePricesLength = reader.readNumber(32)
  const oraclePrices: { assetId: string; price: bigint }[] = []
  for (let i = 0; i < oraclePricesLength; i++) {
    reader.skip(17)
    const assetId = decodeAssetId(reader.read(15))
    const price = reader.readBigInt(32)
    oraclePrices.push({ assetId, price })
  }

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
