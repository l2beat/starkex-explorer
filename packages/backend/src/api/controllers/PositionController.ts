import {
  ForcedTransactionEntry,
  renderNotFoundPage,
  renderPositionAtUpdatePage,
  renderPositionDetailsPage,
} from '@explorer/frontend'
import { AssetId, EthereumAddress } from '@explorer/types'

import { AccountService } from '../../core/AccountService'
import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import {
  SentTransactionRecord,
  SentTransactionRepository,
} from '../../peripherals/database/transactions/SentTransactionRepository'
import {
  UserTransactionRecord,
  UserTransactionRepository,
} from '../../peripherals/database/transactions/UserTransactionRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { ControllerResult } from './ControllerResult'
import { countUpdatedAssets } from './utils/countUpdatedAssets'
import { toForcedTransactionEntry } from './utils/toForcedTransactionEntry'
import { toPositionAssetEntries } from './utils/toPositionAssetEntries'

export class PositionController {
  constructor(
    private accountService: AccountService,
    private stateUpdateRepository: StateUpdateRepository,
    private positionRepository: PositionRepository,
    private userRegistrationEventRepository: UserRegistrationEventRepository,
    private sentTransactionRepository: SentTransactionRepository,
    private userTransactionRepository: UserTransactionRepository,
    private forcedTradeOfferRepository: ForcedTradeOfferRepository
  ) {}

  async getPositionDetailsPage(
    positionId: bigint,
    address: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [account, history, sentTransactions, userTransactions, offers] =
      await Promise.all([
        this.accountService.getAccount(address),
        this.positionRepository.getHistoryById(positionId),
        this.sentTransactionRepository.getByPositionId(positionId),
        this.userTransactionRepository.getByPositionId(positionId, [
          'ForcedTrade',
          'ForcedWithdrawal',
        ]),
        this.forcedTradeOfferRepository.getByPositionId(positionId),
      ])

    const historyWithAssets = history.map((update) => {
      const assets = toPositionAssetEntries(
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
    if (!current) {
      const content = 'Position not found'
      return { type: 'not found', content }
    }

    const [ownerEvent] = await Promise.all([
      this.userRegistrationEventRepository.findByStarkKey(current.starkKey),
    ])

    const content = renderPositionDetailsPage({
      account,
      positionId,
      starkKey: current.starkKey,
      ethAddress: ownerEvent?.ethAddress,
      stateUpdateId: current.stateUpdateId,
      lastUpdateTimestamp: current.timestamp,
      ownedByYou: account?.positionId === positionId,
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
      transactions: toTransactionHistory(sentTransactions, userTransactions),
      offers: offers.map((offer) => ({
        ...offer,
        type: offer.isABuyingSynthetic ? 'buy' : 'sell',
        role: offer.positionIdA === positionId ? 'maker' : 'taker',
      })),
    })
    return { type: 'success', content }
  }

  async getPositionUpdatePage(
    positionId: bigint,
    stateUpdateId: number,
    address: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [account, history, update, transactions] = await Promise.all([
      this.accountService.getAccount(address),
      this.positionRepository.getHistoryById(positionId),
      this.stateUpdateRepository.findByIdWithPositions(stateUpdateId),
      this.userTransactionRepository.getByStateUpdateIdAndPositionId(
        stateUpdateId,
        positionId,
        ['ForcedTrade', 'ForcedWithdrawal']
      ),
    ])
    const updateIndex = history.findIndex(
      (p) => p.stateUpdateId === stateUpdateId
    )
    if (updateIndex === -1 || !update) {
      const content = 'Update not found'
      return { type: 'not found', content }
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const position = history[updateIndex]!
    const previousPosition = history[updateIndex + 1]
    const assetChanges = position.balances.map((balance) => {
      const previousBalance =
        previousPosition?.balances.find((b) => b.assetId === balance.assetId)
          ?.balance ?? 0n
      const currentBalance = balance.balance
      return {
        assetId: balance.assetId,
        previousBalance,
        currentBalance,
        balanceDiff: currentBalance - previousBalance,
      }
    })

    const content = renderPositionAtUpdatePage({
      account,
      stateUpdateId,
      positionId,
      lastUpdateTimestamp: update.timestamp,
      previousStarkKey: previousPosition?.starkKey,
      starkKey: position.starkKey,
      assetChanges,
      transactions: transactions.map(toForcedTransactionEntry),
    })
    return { type: 'success', content }
  }

  async getPositionNotFoundPage(
    address: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const account = await this.accountService.getAccount(address)
    return {
      type: 'not found',
      content: renderNotFoundPage({
        path: '/positions/not-found',
        account,
        text: address
          ? `Position for ${address.toString()} not found`
          : 'Position not found',
      }),
    }
  }
}

function toTransactionHistory(
  sentTransactions: SentTransactionRecord[],
  userTransactions: UserTransactionRecord<'ForcedTrade' | 'ForcedWithdrawal'>[]
) {
  const sentEntries: ForcedTransactionEntry[] = []
  for (const sentTransaction of sentTransactions) {
    if (
      sentTransaction.data.type === 'Withdraw' ||
      sentTransaction.mined?.reverted === false
    ) {
      continue
    }
    sentEntries.push({
      type:
        sentTransaction.data.type === 'ForcedWithdrawal'
          ? 'exit'
          : sentTransaction.data.isABuyingSynthetic
          ? 'buy'
          : 'sell',
      status: sentTransaction.mined?.reverted ? 'reverted' : 'sent',
      hash: sentTransaction.transactionHash,
      lastUpdate: sentTransaction.sentTimestamp,
      amount:
        sentTransaction.data.type === 'ForcedTrade'
          ? sentTransaction.data.syntheticAmount
          : sentTransaction.data.quantizedAmount,
      assetId:
        sentTransaction.data.type === 'ForcedTrade'
          ? sentTransaction.data.syntheticAssetId
          : AssetId.USDC,
      positionId:
        sentTransaction.data.type === 'ForcedTrade'
          ? sentTransaction.data.positionIdA
          : sentTransaction.data.positionId,
    })
  }
  const userEntries = userTransactions.map(toForcedTransactionEntry)
  return [...sentEntries, ...userEntries].sort(
    (a, b) => Number(b.lastUpdate) - Number(a.lastUpdate)
  )
}
