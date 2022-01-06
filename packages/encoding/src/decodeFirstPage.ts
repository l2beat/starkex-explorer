import { ByteReader } from './ByteReader'
import { readAssetDataHashes } from './readAssetDataHashes'
import { readState } from './readState'

export function decodeFirstPage(data: string) {
  const reader = new ByteReader(data)

  const configurationHash = reader.readHex(32)
  // We don't know what those values are
  const assetDataHashes = readAssetDataHashes(reader)
  const oldState = readState(reader)
  const newState = readState(reader)

  // There is more data in the first page, but we don't know the schema

  return { configurationHash, assetDataHashes, oldState, newState }
}
