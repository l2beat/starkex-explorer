import { OraclePrice } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { encodeAssetId } from './encodeAssetId'

export function writeOraclePrices(
  writer: ByteWriter,
  oraclePrices: OraclePrice[]
) {
  writer.writeNumber(oraclePrices.length, 32)
  for (const { assetId, price } of oraclePrices) {
    writer.writePadding(17)
    writer.write(encodeAssetId(assetId), 15)
    writer.writeNumber(price, 32)
  }
}
