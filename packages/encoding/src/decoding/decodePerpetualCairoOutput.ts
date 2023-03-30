import { AssetId, Hash256 } from '@explorer/types'

import { PerpetualCairoOutput } from '../OnChainData'
import { ByteReader } from './ByteReader'
import { readAssetConfigHashes } from './readAssetConfigHashes'
import { readConditions } from './readConditions'
import { readForcedActions } from './readForcedActions'
import { readModifications } from './readModifications'
import { readState } from './readState'

export function decodePerpetualCairoOutput(
  data: string,
  collateralAssetId?: AssetId
): PerpetualCairoOutput {
  const reader = new ByteReader(data)

  const configurationHash = Hash256(reader.readHex(32))
  const assetConfigHashes = readAssetConfigHashes(reader, collateralAssetId)
  const oldState = readState(reader, collateralAssetId)
  const newState = readState(reader, collateralAssetId)

  const minimumExpirationTimestamp = reader.readBigInt(32)
  const modifications = readModifications(reader)
  reader.skip(32) // Total size of forced actions data. Not needed
  const forcedActions = readForcedActions(reader, collateralAssetId)
  const conditions = readConditions(reader)

  const validiumObject = {
    configurationHash,
    assetConfigHashes,
    oldState,
    newState,
    minimumExpirationTimestamp,
    modifications,
    forcedActions,
    conditions,
  }

  if (!reader.isAtEnd()) {
    // https://github.com/starkware-libs/starkex-contracts/blob/75c3a2a8dfff70604d851fc6b1a2bc8bc1a3964b/scalable-dex/contracts/src/components/OnchainDataFactTreeEncoder.sol#L12
    // When reading calldata from updateState two new values are appended
    const onChainDataHash = Hash256(reader.readHex(32))
    const onChainDataSize = reader.readBigInt(32)
    reader.assertEnd()

    return {
      ...validiumObject,
      onChainDataHash,
      onChainDataSize,
    }
  }

  reader.assertEnd()

  return validiumObject
}
