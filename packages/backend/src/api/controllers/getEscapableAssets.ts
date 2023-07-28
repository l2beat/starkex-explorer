import { EscapableAssetEntry } from '@explorer/frontend'
import { CollateralAsset, PageContext } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import uniqBy from 'lodash/uniqBy'

import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { WithdrawableAssetRepository } from '../../peripherals/database/WithdrawableAssetRepository'
import { getCollateralAssetDetails } from './getCollateralAssetDetails'

export async function getEscapableAssets(
  userTransactionRepository: UserTransactionRepository,
  withdrawableAssetRepository: WithdrawableAssetRepository,
  context: PageContext,
  starkKey: StarkKey,
  collateralAsset?: CollateralAsset
): Promise<{
  finalizable: EscapableAssetEntry[]
  allCount: number
}> {
  if (
    context.freezeStatus !== 'frozen' ||
    context.tradingMode !== 'perpetual' ||
    collateralAsset === undefined
  ) {
    return { finalizable: [], allCount: 0 }
  }
  const allEscapeVerifiedTransactions =
    await userTransactionRepository.getByStarkKey(starkKey, ['EscapeVerified'])

  if (allEscapeVerifiedTransactions.length === 0) {
    return { finalizable: [], allCount: 0 }
  }

  const uniqueEscapeVerifiedTransactions = uniqBy(
    allEscapeVerifiedTransactions,
    (t) => t.data.positionId
  )
  const oldestBlockNumber = Math.min(
    ...uniqueEscapeVerifiedTransactions.map((t) => t.blockNumber)
  )
  const withdrawalEventsFromBlockNumber =
    await withdrawableAssetRepository.getByStarkKeyFromBlockNumber(
      starkKey,
      oldestBlockNumber
    )
  // For each transaction in uniqueEscapeVerifiedTransactions check if there is a corresponding withdrawal event
  // in withdrawalEventsFromBlockNumber where asset and amount match.
  // If found, remove the transaction from the uniqueEscapeVerifiedTransactions.
  // This is the only way to find out if an escape has been finalized.
  // Since the exchange is frozen, there can be no new other withdrawal events.
  const notFinalizedEscapableTransactions =
    uniqueEscapeVerifiedTransactions.filter((t) => {
      const correspondingWithdrawalEvent = withdrawalEventsFromBlockNumber.find(
        (w) => {
          return (
            w.data.type === 'WithdrawalAllowed' &&
            w.assetHash === collateralAsset.assetHash &&
            w.data.quantizedAmount === t.data.withdrawalAmount
          )
        }
      )
      return correspondingWithdrawalEvent === undefined
    })

  const finalizable = notFinalizedEscapableTransactions.map((t) => ({
    asset: {
      hashOrId: collateralAsset.assetId,
      details: getCollateralAssetDetails(collateralAsset),
    },
    ownerStarkKey: t.data.starkKey,
    positionOrVaultId: t.data.positionId,
    amount: t.data.withdrawalAmount,
  }))

  return {
    finalizable,
    allCount: allEscapeVerifiedTransactions.length,
  }
}
