import { AssetBalance } from '@explorer/encoding'
import {
  HomeProps,
  renderHomePage,
  renderPositionDetailsPage,
  renderStateUpdateDetailsPage,
  renderStateUpdatesIndexPage,
} from '@explorer/frontend'

import { getAssetValueUSDCents } from '../../core/getAssetValueUSDCents'
import {
  StateUpdatePriceRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'

const buildViewAssets = (
  balances: readonly AssetBalance[],
  collateralBalance: bigint,
  prices: StateUpdatePriceRecord[]
) => {
  const assets: {
    assetId: string
    balance: bigint
    totalUSDCents: bigint
    price?: bigint
  }[] = balances.map(({ balance, assetId }) => {
    const price = prices.find((p) => p.assetId === assetId)?.price
    const totalUSDCents = price
      ? getAssetValueUSDCents(balance, price, assetId)
      : 0n
    return {
      assetId: assetId.toString(),
      balance,
      price,
      totalUSDCents,
    }
  })
  assets.push({
    assetId: 'USDC',
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
  constructor(private stateUpdateRepository: StateUpdateRepository) {}

  async getHomePage(): Promise<string> {
    const stateUpdates = await this.stateUpdateRepository.getStateUpdateList({
      offset: 0,
      limit: 20,
    })

    return renderHomePage({
      stateUpdates: stateUpdates.map(
        (x): HomeProps['stateUpdates'][number] => ({
          id: x.id,
          hash: x.rootHash,
          timestamp: x.timestamp,
          positionCount: x.positionCount,
        })
      ),
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
    const [stateUpdate, prices] = await Promise.all([
      this.stateUpdateRepository.getStateUpdateById(id),
      this.stateUpdateRepository.getLatestAssetPrices(),
    ])

    if (!stateUpdate) {
      return {
        status: 404,
        html: 'State update not found',
      }
    }

    return {
      html: renderStateUpdateDetailsPage({
        id: stateUpdate.id,
        hash: stateUpdate.hash,
        timestamp: stateUpdate.timestamp,
        positions: stateUpdate.positions.map((pos) => {
          const assets = buildViewAssets(
            pos.balances,
            pos.collateralBalance,
            prices
          )
          const totalUSDCents = assets.reduce(
            (total, { totalUSDCents }) => totalUSDCents + total,
            0n
          )

          return {
            publicKey: pos.publicKey,
            positionId: pos.positionId,
            totalUSDCents,
          }
        }),
      }),
      status: 200,
    }
  }

  async getPositionDetailsPage(positionId: bigint): Promise<ControllerResult> {
    const [history, prices] = await Promise.all([
      this.stateUpdateRepository.getPositionHistoryById(positionId),
      this.stateUpdateRepository.getLatestAssetPrices(),
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
        prices
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

    return {
      status: 200,
      html: renderPositionDetailsPage({
        positionId,
        publicKey: current.publicKey,
        totalUSDCents: current.totalUSDCents,
        assets: current.assets,
        history: historyWithAssets.map((update, i) => {
          const previousUpdate = historyWithAssets[i + 1]
          if (i === 0) {
            console.log(update, previousUpdate)
          }
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
    if (!updateIndex || !update) {
      return {
        html: 'Update not found',
        status: 404,
      }
    }
    const position = history[updateIndex]
    const previousPosition = history[updateIndex + 1]
    const assetChanges = position.balances.map((balance) => {
      const previous = previousPosition?.balances.find(
        (b) => b.assetId === balance.assetId
      )
      return {
        assetId: balance.assetId,
        previous: previous?.balance || 0n,
        current: balance.balance,
      }
    })

    const toReturn = {
      stateUpdateId,
      hash: update.hash,
      timestamp: update.timestamp,
      positionId,
      publicKey: position.publicKey,
      assetChanges,
    }

    return {
      html: toReturn.toString(),
      status: 200,
    }
  }
}
