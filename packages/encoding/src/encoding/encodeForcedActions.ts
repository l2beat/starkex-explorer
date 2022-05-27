import { OnChainData } from '../OnChainData'
import { ByteWriter } from './ByteWriter'
import { encodeAssetId } from './encodeAssetId'

export function encodeForcedActions(data: OnChainData) {
  const writer = new ByteWriter()
  writer.writeNumber(data.forcedActions.length, 32)
  for (const action of data.forcedActions) {
    if (action.type === 'withdrawal') {
      writer.write(action.publicKey.toString(), 32)
      writer.writeNumber(action.positionId, 32)
      writer.writeNumber(action.amount, 32)
    } else if (action.type === 'trade') {
      writer.write(action.publicKeyA.toString(), 32)
      writer.write(action.publicKeyB.toString(), 32)
      writer.writeNumber(action.positionIdA, 32)
      writer.writeNumber(action.positionIdB, 32)
      writer.writePadding(17)
      writer.write(encodeAssetId(action.syntheticAssetId), 15)
      writer.writeNumber(action.collateralAmount, 32)
      writer.writeNumber(action.syntheticAmount, 32)
      writer.writeNumber(action.isABuyingSynthetic ? 1 : 0, 32)
      writer.writeNumber(action.nonce, 32)
    }
  }
  return writer.getBytes()
}
