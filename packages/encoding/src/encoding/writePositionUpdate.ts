import { MIN_INT } from '../constants'
import { PositionUpdate } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { encodeAssetId } from './encodeAssetId'

export function writePositionUpdate(writer: ByteWriter, data: PositionUpdate) {
  writer.writeNumber(data.balances.length + 4, 32)
  writer.writeNumber(data.positionId, 32)
  writer.write(data.publicKey.toString(), 32)
  writer.writeNumber(data.collateralBalance - MIN_INT, 32)
  writer.writeNumber(Number(data.fundingTimestamp) / 1000, 32)

  for (const { assetId, balance } of data.balances) {
    writer.writePadding(9)
    writer.write(encodeAssetId(assetId), 15)
    writer.writeNumber(balance - MIN_INT, 8)
  }
}
