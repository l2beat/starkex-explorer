import { PedersenHash } from '@explorer/types'

import { StarkExDexOutput } from '../OnChainData'
import { ByteReader } from './ByteReader'

export function decodeDexOutput(data: string): StarkExDexOutput {
  const reader = new ByteReader(data)

  const configCode = reader.readBigInt(32)
  const initialValidiumVaultRoot = PedersenHash(reader.readHex(32))
  const finalValidiumVaultRoot = PedersenHash(reader.readHex(32))
  const initialRollupVaultRoot = PedersenHash(reader.readHex(32))
  const finalRollupVaultRoot = PedersenHash(reader.readHex(32))
  const initialOrderRoot = PedersenHash(reader.readHex(32))
  const finalOrderRoot = PedersenHash(reader.readHex(32))
  const globalExpirationTimestamp = reader.readNumber(32)
  const validiumVaultTreeHeight = reader.readNumber(32)
  const rollupVaultTreeHeight = reader.readNumber(32)
  const orderTreeHeight = reader.readNumber(32)
  const modificationCount = reader.readNumber(32)
  const conditionalTransferCount = reader.readNumber(32)
  const l1VaultUpdateCount = reader.readNumber(32)
  const l1OrderMessageCount = reader.readNumber(32)

  reader.assertEnd()

  return {
    configCode,
    initialValidiumVaultRoot,
    finalValidiumVaultRoot,
    initialRollupVaultRoot,
    finalRollupVaultRoot,
    initialOrderRoot,
    finalOrderRoot,
    globalExpirationTimestamp,
    validiumVaultTreeHeight,
    rollupVaultTreeHeight,
    orderTreeHeight,
    modificationCount,
    conditionalTransferCount,
    l1VaultUpdateCount,
    l1OrderMessageCount,
  }
}
