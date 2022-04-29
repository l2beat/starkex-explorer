import { AssetBalance } from '@explorer/encoding'
import {
  ForcedTransactionsIndexProps,
  renderForcedTransactionsIndexPage,
  renderHomePage,
  renderPositionAtUpdatePage,
  renderPositionDetailsPage,
  renderStateUpdateDetailsPage,
  renderStateUpdatesIndexPage,
} from '@explorer/frontend'
import { AssetId, EthereumAddress, PedersenHash } from '@explorer/types'
import { omit } from 'lodash'

import { getAssetPriceUSDCents } from '../../core/getAssetPriceUSDCents'
import { getAssetValueUSDCents } from '../../core/getAssetValueUSDCents'
import {
  ForcedTransaction,
  ForcedTransactionsRepository,
} from '../../peripherals/database/ForcedTransactionsRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'

const buildViewAssets = (
  balances: readonly AssetBalance[],
  collateralBalance: bigint,
  prices: { price: bigint; assetId: AssetId }[]
) => {
  const assets: {
    assetId: AssetId
    balance: bigint
    totalUSDCents: bigint
    price?: bigint
  }[] = balances.map(({ balance, assetId }) => {
    const price = prices.find((p) => p.assetId === assetId)?.price
    const totalUSDCents = price ? getAssetValueUSDCents(balance, price) : 0n
    const priceUSDCents = price ? getAssetPriceUSDCents(price, assetId) : 0n
    return {
      assetId,
      balance,
      price: priceUSDCents,
      totalUSDCents,
    }
  })
  assets.push({
    assetId: AssetId('USDC-1'),
    balance: collateralBalance,
    totalUSDCents: collateralBalance / 1000n,
    price: 1n,
  })
  return assets
}

const countDifferentAssets = (
  prev: readonly AssetBalance[],
  current: readonly AssetBalance[]
) => {
  return current.reduce((updates, balance) => {
    const prevBalance = prev.find((b) => b.assetId === balance.assetId)
    const updated = !prevBalance || prevBalance.balance !== balance.balance
    return updated ? updates + 1 : updates
  }, 0)
}

const buildViewTransaction = (
  t: ForcedTransaction
): ForcedTransactionsIndexProps['transactions'][number] => ({
  type:
    t.type === 'withdrawal' ? 'exit' : t.isABuyingSynthetic ? 'buy' : 'sell',
  status: t.status === 'mined' ? 'waiting to be included' : 'completed',
  hash: t.hash,
  lastUpdate: t.lastUpdate,
  amount: t.type === 'trade' ? t.syntheticAmount : t.amount,
  assetId: t.type === 'trade' ? t.syntheticAssetId : AssetId('USDC-1'),
  positionId: t.type === 'trade' ? t.positionIdA : t.positionId,
})

export type ControllerResult =
  | {
      status: 200 | 404
      html: string
    }
  | {
      status: 302
      url: string
    }

export class FrontendController {
  constructor(
    private stateUpdateRepository: StateUpdateRepository,
    private userRegistrationEventRepository: UserRegistrationEventRepository,
    private forcedTransactionsRepository: ForcedTransactionsRepository
  ) {}
  async getHomePage(account: EthereumAddress | undefined): Promise<string> {
    const offset = 0
    const limit = 5
    const [stateUpdates, totalUpdates, totalPositions, transactions] =
      await Promise.all([
        this.stateUpdateRepository.getStateUpdateList({
          offset,
          limit,
        }),
        this.stateUpdateRepository.countStateUpdates(),
        this.stateUpdateRepository.countPositions(),
        this.forcedTransactionsRepository.getLatest({ limit, offset }),
      ])

    return renderHomePage({
      account,
      stateUpdates: stateUpdates.map((x) => ({
        id: x.id,
        hash: x.rootHash,
        timestamp: x.timestamp,
        positionCount: x.positionCount,
      })),
      forcedTransactions: transactions.map(buildViewTransaction),
      totalUpdates,
      totalPositions,
    })
  }

  async getForcedTransactionsPage(
    page: number,
    perPage: number
  ): Promise<string> {
    const limit = perPage
    const offset = (page - 1) * perPage
    const [transactions, fullCount] = await Promise.all([
      this.forcedTransactionsRepository.getLatest({ limit, offset }),
      this.forcedTransactionsRepository.countAll(),
    ])

    return renderForcedTransactionsIndexPage({
      transactions: transactions.map(buildViewTransaction),
      fullCount,
      params: { page, perPage },
    })
  }

  async getStateUpdatesPage(
    page: number,
    perPage: number,
    account: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const stateUpdates = await this.stateUpdateRepository.getStateUpdateList({
      offset: (page - 1) * perPage,
      limit: perPage,
    })
    const fullCount = await this.stateUpdateRepository.getStateUpdateCount()

    return {
      status: 200,
      html: renderStateUpdatesIndexPage({
        account,
        stateUpdates: stateUpdates.map((update) => ({
          id: update.id,
          hash: update.rootHash,
          timestamp: update.timestamp,
          positionCount: update.positionCount,
        })),
        fullCount: Number(fullCount),
        params: {
          page,
          perPage,
        },
      }),
    }
  }

  async getStateUpdateDetailsPage(
    id: number,
    account: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [stateUpdate, transactions] = await Promise.all([
      this.stateUpdateRepository.getStateUpdateById(id),
      this.forcedTransactionsRepository.getIncludedInStateUpdate(id),
    ])

    if (!stateUpdate) {
      return {
        status: 404,
        html: 'State update not found',
      }
    }

    const previousPositions =
      await this.stateUpdateRepository.getPositionsPreviousState(
        stateUpdate.positions.map((p) => p.positionId),
        id
      )

    return {
      html: renderStateUpdateDetailsPage({
        account,
        id: stateUpdate.id,
        hash: stateUpdate.hash,
        rootHash: stateUpdate.rootHash,
        blockNumber: stateUpdate.blockNumber,
        timestamp: stateUpdate.timestamp,
        positions: stateUpdate.positions.map((pos) => {
          const assets = buildViewAssets(
            pos.balances,
            pos.collateralBalance,
            pos.prices
          )
          const totalUSDCents = assets.reduce(
            (total, { totalUSDCents }) => totalUSDCents + total,
            0n
          )
          const previousPos = previousPositions.find(
            (p) => p.positionId === pos.positionId
          )
          const previousAssets =
            previousPos &&
            buildViewAssets(
              previousPos.balances,
              previousPos.collateralBalance,
              previousPos.prices
            )
          const previousTotalUSDCents = previousAssets?.reduce(
            (total, { totalUSDCents }) => totalUSDCents + total,
            0n
          )
          const assetsUpdated = previousPos
            ? countDifferentAssets(previousPos.balances, pos.balances)
            : 0

          return {
            publicKey: pos.publicKey,
            positionId: pos.positionId,
            totalUSDCents,
            previousTotalUSDCents,
            assetsUpdated,
          }
        }),
        transactions: transactions
          .map(buildViewTransaction)
          .map((t) => omit(t, 'status')),
      }),
      status: 200,
    }
  }

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
      const assets = buildViewAssets(
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
            ? countDifferentAssets(previousUpdate.balances, update.balances)
            : 0
          return {
            stateUpdateId: update.stateUpdateId,
            totalUSDCents: update.totalUSDCents,
            assetsUpdated,
          }
        }),
        transactions: transactions
          .map(buildViewTransaction)
          .map((t) => omit(t, 'positionId')),
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
          .map(buildViewTransaction)
          .map((t) => omit(t, 'positionId', 'status', '')),
      }),
      status: 200,
    }
  }

  async getSearchRedirect(query: string): Promise<ControllerResult> {
    const parsed = parseSearchQuery(query)

    let response: ControllerResult | undefined

    if (!response && parsed.ethereumAddress) {
      response = await this.searchForEthereumAddress(parsed.ethereumAddress)
    }

    if (!response && parsed.stateTreeHash) {
      response = await this.searchForRootHash(parsed.stateTreeHash)
    }

    if (!response && parsed.starkKey) {
      response = await this.searchForStarkKey(parsed.starkKey)
    }

    if (!response) {
      return {
        status: 404,
        html: "Search query couldn't be found",
      }
    }

    return response
  }

  private async searchForEthereumAddress(
    ethereumAddr: EthereumAddress
  ): Promise<ControllerResult | undefined> {
    const userRegistrationEvent =
      await this.userRegistrationEventRepository.findByEthereumAddress(
        ethereumAddr
      )
    if (userRegistrationEvent === undefined) {
      return
    }

    const positionId =
      await this.stateUpdateRepository.getPositionIdByPublicKey(
        userRegistrationEvent.starkKey
      )
    if (positionId === undefined) {
      return
    }

    return {
      status: 302,
      url: `/positions/${positionId}`,
    }
  }

  private async searchForRootHash(
    hash: PedersenHash
  ): Promise<ControllerResult | undefined> {
    const positionId = await this.stateUpdateRepository.getPositionIdByRootHash(
      hash
    )
    if (positionId === undefined) {
      return
    }

    return {
      status: 302,
      url: `/state-updates/${positionId}`,
    }
  }

  private async searchForStarkKey(
    starkKey: string
  ): Promise<ControllerResult | undefined> {
    const userRegistrationEvent =
      await this.userRegistrationEventRepository.findByStarkKey(starkKey)
    if (userRegistrationEvent === undefined) {
      return
    }

    const positionId =
      await this.stateUpdateRepository.getPositionIdByPublicKey(
        userRegistrationEvent.starkKey
      )
    if (positionId === undefined) {
      return
    }

    return {
      status: 302,
      url: `/positions/${positionId}`,
    }
  }
}

interface ParsedQuery {
  ethereumAddress?: EthereumAddress
  stateTreeHash?: PedersenHash
  starkKey?: string
}

export function parseSearchQuery(query: string): ParsedQuery {
  if (query.startsWith('0x') && query.length === 66) {
    return {
      stateTreeHash: PedersenHash(query),
      starkKey: query,
    }
  }
  if (query.startsWith('0x') && query.length === 42) {
    return {
      ethereumAddress: EthereumAddress(query),
    }
  }

  return {}
}
