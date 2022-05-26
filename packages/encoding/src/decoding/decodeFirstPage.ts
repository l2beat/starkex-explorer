import { ByteReader } from './ByteReader'
import { readAssetConfigHashes } from './readAssetConfigHashes'
import { readConditions } from './readConditions'
import { readForcedActions } from './readForcedActions'
import { readModifications } from './readModifications'
import { readState } from './readState'

export function decodeFirstPage(data: string) {
  const reader = new ByteReader(data)

  const configurationHash = reader.readHex(32)
  const assetConfigHashes = readAssetConfigHashes(reader)
  const oldState = readState(reader)
  const newState = readState(reader)

  const minimumExpirationTimestamp = reader.readBigInt(32)
  const modifications = readModifications(reader)
  reader.skip(32) // Total size of forced actions data. Not needed
  const forcedActions = readForcedActions(reader)
  const conditions = readConditions(reader)

  reader.assertEnd()

  return {
    configurationHash,
    assetConfigHashes,
    oldState,
    newState,
    minimumExpirationTimestamp,
    modifications,
    forcedActions,
    conditions,
  }
}
