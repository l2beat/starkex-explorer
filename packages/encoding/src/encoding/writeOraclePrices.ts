import { State } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { encodeAssetId } from './encodeAssetId'

export function writeOraclePrices(writer: ByteWriter, data: State) {
  writer.writeNumber(data.oraclePrices.length, 32)
  for (const { assetId, price } of data.oraclePrices) {
    writer.writePadding(17)
    writer.write(encodeAssetId(assetId), 15)
    writer.writeNumber(price, 32)
  }
}
