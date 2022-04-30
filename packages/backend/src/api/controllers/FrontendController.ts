import {
  renderPositionAtUpdatePage,
  renderPositionDetailsPage,
} from '@explorer/frontend'
import { EthereumAddress } from '@explorer/types'

import { ForcedTransactionsRepository } from '../../peripherals/database/ForcedTransactionsRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { applyAssetPrices } from './utils/applyAssetPrices'
import { countUpdatedAssets } from './utils/countUpdatedAssets'
import { toForcedTransactionEntry } from './utils/toForcedTransactionEntry'

type ControllerResult = {
  html: string
  status: 200 | 404
}

export class FrontendController {
  constructor(
    private stateUpdateRepository: StateUpdateRepository,
    private userRegistrationEventRepository: UserRegistrationEventRepository,
    private forcedTransactionsRepository: ForcedTransactionsRepository
  ) {}

  async getPositionDetailsPage(
    positionId: bigint,
    account: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [history, transactions] = await Promise.all([
      this.stateUpdateRepository.getPositionHistoryById(positionId),
      this.forcedTransactionsRepository.getAffectingPosition(positionId),
    ])

    if (!history[0]) {
      return {
        status: 404,
        html: 'Position not found',
      }
    }

    const historyWithAssets = history.map((update) => {
      const assets = applyAssetPrices(
        update.balances,
        update.collateralBalance,
        update.prices
      )
      const totalUSDCents = assets.reduce(
        (total, { totalUSDCents }) => totalUSDCents + total,
        0n
      )
      return {
        ...update,
        assets,
        totalUSDCents,
      }
    })

    const current = historyWithAssets[0]

    const lastUserRegistrationEvent =
      await this.userRegistrationEventRepository.findByStarkKey(
        current.publicKey
      )

    return {
      status: 200,
      html: renderPositionDetailsPage({
        account,
        positionId,
        publicKey: current.publicKey,
        ethAddress: lastUserRegistrationEvent?.ethAddress.toString(),
        stateUpdateId: current.stateUpdateId,
        lastUpdateTimestamp: current.timestamp,
        assets: current.assets,
        history: historyWithAssets.map((update, i) => {
          const previousUpdate = historyWithAssets[i + 1]
          const assetsUpdated = previousUpdate
            ? countUpdatedAssets(previousUpdate.balances, update.balances)
            : 0
          return {
            stateUpdateId: update.stateUpdateId,
            totalUSDCents: update.totalUSDCents,
            assetsUpdated,
          }
        }),
        transactions: transactions.map(toForcedTransactionEntry),
      }),
    }
  }

  async getPositionUpdatePage(
    positionId: bigint,
    stateUpdateId: number,
    account: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [history, update, transactions] = await Promise.all([
      this.stateUpdateRepository.getPositionHistoryById(positionId),
      this.stateUpdateRepository.getStateUpdateById(stateUpdateId),
      this.forcedTransactionsRepository.getIncludedInStateUpdate(stateUpdateId),
    ])
    const updateIndex = history.findIndex(
      (p) => p.stateUpdateId === stateUpdateId
    )
    if (updateIndex === -1 || !update) {
      return {
        html: 'Update not found',
        status: 404,
      }
    }
    const position = history[updateIndex]
    const previousPosition = history[updateIndex + 1]
    const assetChanges = position.balances.map((balance) => {
      const previousBalance =
        previousPosition?.balances.find((b) => b.assetId === balance.assetId)
          ?.balance || 0n
      const currentBalance = balance.balance
      return {
        assetId: balance.assetId,
        previousBalance,
        currentBalance,
        balanceDiff: currentBalance - previousBalance,
      }
    })

    return {
      html: renderPositionAtUpdatePage({
        account,
        stateUpdateId,
        positionId,
        lastUpdateTimestamp: update.timestamp,
        previousPublicKey: previousPosition?.publicKey,
        publicKey: position.publicKey,
        assetChanges,
        transactions: transactions
          .filter((t) => {
            return t.type === 'trade'
              ? [t.positionIdA, t.positionIdB].includes(positionId)
              : t.positionId === positionId
          })
          .map(toForcedTransactionEntry),
      }),
      status: 200,
    }
  }
}
