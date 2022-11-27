import { Hash256 } from '@explorer/types'

import { ByteReader } from './ByteReader'
import { readAssetConfigHashes } from './readAssetConfigHashes'
import { readConditions } from './readConditions'
import { readForcedActions } from './readForcedActions'
import { readModifications } from './readModifications'
import { readState } from './readState'

export function decodeFirstPage(data: string) {
  const reader = new ByteReader(data)

  const configurationHash = Hash256(reader.readHex(32))
  const assetConfigHashes = readAssetConfigHashes(reader)
  const oldState = readState(reader)
  const newState = readState(reader)

  const minimumExpirationTimestamp = reader.readBigInt(32)
  const modifications = readModifications(reader)
  reader.skip(32) // Total size of forced actions data. Not needed
  const forcedActions = readForcedActions(reader)
  const conditions = readConditions(reader)

  if (!reader.isAtEnd()) {
    // https://github.com/starkware-libs/starkex-contracts/blob/75c3a2a8dfff70604d851fc6b1a2bc8bc1a3964b/scalable-dex/contracts/src/components/OnchainDataFactTreeEncoder.sol#L12
    // When reading calldata from updateState two new values are appended
    reader.skip(64)
  }

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
