import { AssetBalance } from '@explorer/encoding'
import {
  HomeProps,
  renderHomePage,
  renderPositionAtUpdatePage,
  renderPositionDetailsPage,
  renderStateUpdateDetailsPage,
  renderStateUpdatesIndexPage,
} from '@explorer/frontend'
import { AssetId } from '@explorer/types'

import { getAssetPriceUSDCents } from '../../core/getAssetPriceUSDCents'
import { getAssetValueUSDCents } from '../../core/getAssetValueUSDCents'
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

type ControllerResult = {
  html: string
  status: 200 | 404
}

export class FrontendController {
  constructor(
    private stateUpdateRepository: StateUpdateRepository,
    private userRegistrationEventRepository: UserRegistrationEventRepository
  ) {}

  async getHomePage(): Promise<string> {
    const [stateUpdates, totalUpdates, totalPositions] = await Promise.all([
      this.stateUpdateRepository.getStateUpdateList({
        offset: 0,
        limit: 20,
      }),
      this.stateUpdateRepository.countStateUpdates(),
      this.stateUpdateRepository.countPositions(),
    ])

    return renderHomePage({
      stateUpdates: stateUpdates.map(
        (x): HomeProps['stateUpdates'][number] => ({
          id: x.id,
          hash: x.rootHash,
          timestamp: x.timestamp,
          positionCount: x.positionCount,
        })
      ),
      totalUpdates,
      totalPositions,
    })
  }

  async getStateUpdatesPage(page: number, perPage: number): Promise<string> {
    const stateUpdates = await this.stateUpdateRepository.getStateUpdateList({
      offset: (page - 1) * perPage,
      limit: perPage,
    })
    const fullCount = await this.stateUpdateRepository.getStateUpdateCount()

    return renderStateUpdatesIndexPage({
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
    })
  }

  async getStateUpdateDetailsPage(id: number): Promise<ControllerResult> {
    const stateUpdate = await this.stateUpdateRepository.getStateUpdateById(id)

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
      }),
      status: 200,
    }
  }

  async getPositionDetailsPage(positionId: bigint): Promise<ControllerResult> {
    const history = await this.stateUpdateRepository.getPositionHistoryById(
      positionId
    )

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
      }),
    }
  }

  async getPositionUpdatePage(
    positionId: bigint,
    stateUpdateId: number
  ): Promise<ControllerResult> {
    const [history, update] = await Promise.all([
      this.stateUpdateRepository.getPositionHistoryById(positionId),
      this.stateUpdateRepository.getStateUpdateById(stateUpdateId),
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
        stateUpdateId,
        positionId,
        lastUpdateTimestamp: update.timestamp,
        previousPublicKey: previousPosition?.publicKey,
        publicKey: position.publicKey,
        assetChanges,
      }),
      status: 200,
    }
  }
}
