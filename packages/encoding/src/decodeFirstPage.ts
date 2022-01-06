import { ByteReader } from './ByteReader'
import { decodeState } from './decodeState'
import { readAssetDataHashes } from './readAssetDataHashes'

export const MIN_INT = -(2n ** 63n)

export function decodeFirstPage(data: string) {
  const reader = new ByteReader(data)

  const configurationHash = reader.readHex(32)
  const assetDataHashes = readAssetDataHashes(reader)

  const oldStateSize = reader.readNumber(32)
  const oldStateData = reader.read(oldStateSize * 32)
  const oldState = decodeState(oldStateData)

  const newStateSize = reader.readNumber(32)
  const newStateData = reader.read(newStateSize * 32)
  const newState = decodeState(newStateData)

  // TODO: what's next?

  return { configurationHash, assetDataHashes, oldState, newState }
}
