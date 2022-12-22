import {
  EthereumAddress,
  Hash256,
  PedersenHash,
  StarkKey,
} from '@explorer/types'

import {
  OrderMessage,
  SpotModification,
  StarkExDexOutput,
  VaultUpdate,
} from '../OnChainData'
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

  const modifications: SpotModification[] = []
  for (let i = 0; i < modificationCount; i++) {
    const starkKey = StarkKey(reader.readHex(32))
    const assetId = reader.readBigInt(32)
    const difference =
      (reader.readBigInt(32) & ((1n << 64n) - 1n)) - (1n << 63n)
    modifications.push({ starkKey, assetId, difference })
  }

  const conditionalTransfers: Hash256[] = []
  for (let i = 0; i < conditionalTransferCount; i++) {
    conditionalTransfers.push(Hash256(reader.readHex(32)))
  }

  const l1VaultUpdates: VaultUpdate[] = []
  for (let i = 0; i < l1VaultUpdateCount; i++) {
    const address = EthereumAddress(reader.readHex(32))
    const assetId = reader.readBigInt(32)
    const difference =
      (reader.readBigInt(32) & ((1n << 64n) - 1n)) - (1n << 63n)
    l1VaultUpdates.push({ address, assetId, difference })
  }

  const l1OrderMessages: OrderMessage[] = []
  for (let i = 0; i < l1OrderMessageCount; i++) {
    const sender = EthereumAddress(reader.readHex(32))
    const blobCount = reader.readNumber(32)
    const orderHash = Hash256(reader.readHex(blobCount * 32))
    l1OrderMessages.push({ sender, orderHash })
  }

  const onChainDataHash = Hash256(reader.readHex(32))
  const onChainDataSize = reader.readBigInt(32)

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
    modifications,
    conditionalTransfers,
    l1VaultUpdates,
    l1OrderMessages,
    onChainDataHash,
    onChainDataSize,
  }
}
