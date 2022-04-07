import { ByteReader } from './ByteReader'
import { decodeAssetId } from './decodeAssetId'
import { DecodingError } from './DecodingError'
import { ForcedAction } from './OnChainData'

export function readForcedActions(reader: ByteReader) {
  const count = reader.readNumber(32)
  const forcedActions: ForcedAction[] = []
  for (let i = 0; i < count; i++) {
    const type = reader.readNumber(32)
    if (type === 0) {
      const publicKey = reader.readHex(32)
      const positionId = reader.readBigInt(32)
      const amount = reader.readBigInt(32)
      forcedActions.push({ type: 'withdrawal', publicKey, positionId, amount })
    } else if (type === 1) {
      const publicKeyA = reader.readHex(32)
      const publicKeyB = reader.readHex(32)
      const positionIdA = reader.readBigInt(32)
      const positionIdB = reader.readBigInt(32)
      reader.skip(17)
      const syntheticAssetId = decodeAssetId(reader.read(15))
      const collateralAmount = reader.readBigInt(32)
      const syntheticAmount = reader.readBigInt(32)
      const isABuyingSynthetic = reader.readBigInt(32) != 0n
      const nonce = reader.readBigInt(32)
      forcedActions.push({
        type: 'trade',
        publicKeyA,
        publicKeyB,
        positionIdA,
        positionIdB,
        syntheticAssetId,
        collateralAmount,
        syntheticAmount,
        isABuyingSynthetic,
        nonce,
      })
    } else {
      throw new DecodingError(`Invalid forced action type: ${type}`)
    }
  }
  return forcedActions
}
