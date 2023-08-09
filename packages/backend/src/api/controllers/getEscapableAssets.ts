import {
  assertUnreachable,
  CollateralAsset,
  PageContext,
} from '@explorer/shared'
import { AssetHash, StarkKey } from '@explorer/types'

import { SentTransactionRepository } from '../../peripherals/database/transactions/SentTransactionRepository'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { VaultRepository } from '../../peripherals/database/VaultRepository'

export type EscapableMap = Record<
  string, // positionOrVaultId as string
  { assetHash: AssetHash; amount: bigint }
>

export async function getPerpetualEscapables(
  userTransactionRepository: UserTransactionRepository,
  starkKey: StarkKey,
  collateralAsset: CollateralAsset
): Promise<EscapableMap> {
  // We rely on the fact that all StarkEx perpetual deployments
  // use single position for a single user, so we can just check
  // if VerifyEscape and FinalizeEscape events came.
  // If we ever need to support multiple positions per user
  // we would need to use the same solution as for spot
  // (look at transactions sent from the explorer)
  // because there is no way to match FinalizeEscape with
  // VerifyEscape due to lack of positionId in VerifyEscape event.
  const [verified, finalized] = await Promise.all([
    userTransactionRepository.getByStarkKey(starkKey, ['VerifyEscape']),
    userTransactionRepository.getByStarkKey(starkKey, ['FinalizeEscape']),
  ])

  const result: EscapableMap = {}

  if (verified[0] !== undefined) {
    const positionId = verified[0].data.positionId
    result[positionId.toString()] =
      finalized.length === 0
        ? {
            assetHash: collateralAsset.assetHash,
            amount: verified[0].data.withdrawalAmount,
          }
        : {
            assetHash: collateralAsset.assetHash,
            amount: 0n,
          }
  }

  return result
}

export async function getSpotEscapables(
  sentTransactionRepository: SentTransactionRepository,
  vaultRepository: VaultRepository,
  starkKey: StarkKey
): Promise<EscapableMap> {
  // Unfortunatelly there's no event emitted on Spot StarkEx
  // when user verifies an escape. Because of that we only
  // support escapes that were initiated from our explorer
  // (we look into our SentTransactionsRepository):
  const result: EscapableMap = {}

  const [verified, finalized] = await Promise.all([
    sentTransactionRepository.getByStarkKey(starkKey, ['VerifyEscape']),
    sentTransactionRepository.getByStarkKey(starkKey, ['FinalizeEscape']),
  ])

  for (const tx of verified) {
    if (tx.mined && !tx.mined.reverted) {
      const vault = await vaultRepository.findById(tx.data.positionOrVaultId)
      if (vault !== undefined && vault.balance > 0n) {
        result[vault.vaultId.toString()] = {
          assetHash: vault.assetHash,
          amount: vault.balance,
        }
      }
    }
  }

  // Unfortunatelly there is no proper event on Spot StarkEx
  // when escape is finalized. There is only a WithdrawalAllowed event
  // which doesn't contain vaultId so we can't match it to VerifyEscapes.
  // So we again rely on data in our sentTransactionsRepository:
  for (const tx of finalized) {
    if (tx.mined && !tx.mined.reverted) {
      const entry = result[tx.data.positionOrVaultId.toString()]
      if (entry !== undefined) {
        entry.amount = 0n
      }
    }
  }

  return result
}

export async function getEscapableAssets(
  userTransactionRepository: UserTransactionRepository,
  sentTransactionRepository: SentTransactionRepository,
  vaultRepository: VaultRepository,
  context: PageContext,
  starkKey: StarkKey,
  collateralAsset?: CollateralAsset
): Promise<EscapableMap> {
  if (context.freezeStatus !== 'frozen') {
    return {}
  }
  const tradingMode = context.tradingMode
  switch (tradingMode) {
    case 'perpetual':
      if (!collateralAsset) {
        throw new Error(
          'Missing collateral data for perpetual StarkEx escape calulcations'
        )
      }
      return await getPerpetualEscapables(
        userTransactionRepository,
        starkKey,
        collateralAsset
      )
    case 'spot':
      return await getSpotEscapables(
        sentTransactionRepository,
        vaultRepository,
        starkKey
      )
    default:
      assertUnreachable(tradingMode)
  }
}
