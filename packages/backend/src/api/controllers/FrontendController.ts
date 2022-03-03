import { AssetId } from '@explorer/encoding'
import {
  HomeProps,
  renderHomePage,
  renderPositionDetailsPage,
  renderStateChangeDetailsPage,
  renderStateChangesIndexPage,
} from '@explorer/frontend'

import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'

export class FrontendController {
  constructor(private stateUpdateRepository: StateUpdateRepository) {}

  async getHomePage(): Promise<string> {
    const stateUpdates = await this.stateUpdateRepository.getStateChangeList({
      offset: 0,
      limit: 20,
    })

    return renderHomePage({
      forcedTransaction: [],
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

  async getStateChangesPage(page: number, perPage: number): Promise<string> {
    const stateUpdates = await this.stateUpdateRepository.getStateChangeList({
      offset: (page - 1) * perPage,
      limit: perPage,
    })
    const fullCount = await this.stateUpdateRepository.getStateChangeCount()

    return renderStateChangesIndexPage({
      stateUpdates: stateUpdates.map((update) => ({
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

  async getStateChangeDetailsPage(id: number): Promise<string> {
    const stateChange = await this.stateUpdateRepository.getStateChangeById(id)

    return renderStateChangeDetailsPage({
      id: stateChange.id,
      hash: stateChange.hash,
      timestamp: stateChange.timestamp,
      positions: stateChange.positions.map((pos) => ({
        ...pos,
        balances: pos.balances.map((balance) => ({
          assetId: balance.assetId.toString(), // <- this is less than ideal
          balance: balance.balance,
        })),
      })),
    })
  }

  async getPositionDetailsPage(positionId: bigint): Promise<string> {
    const [history, prices] = await Promise.all([
      this.stateUpdateRepository.getPositionHistoryById(positionId),
      this.stateUpdateRepository.getLatestAssetPrices(),
    ])
    const current = history[0]
    const assets: {
      assetId: string
      balance: bigint
      totalUSDCents: bigint
      price?: bigint
    }[] = current.balances.map(({ balance, assetId }) => {
      const price = prices.find((p) => p.assetId === assetId)?.price
      const totalUSDCents = price
        ? (balance * price * 10n ** BigInt(AssetId.decimals(assetId))) /
          2n ** 32n /
          1000n
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
      balance: current.collateralBalance,
      totalUSDCents: current.collateralBalance / 1000n,
      price: 1n,
    })
    const totalUSDCents = assets.reduce(
      (total, { totalUSDCents }) => totalUSDCents + total,
      0n
    )

    return renderPositionDetailsPage({
      positionId,
      publicKey: current.publicKey,
      totalUSDCents,
      assets,
      history: history.map((pos) => ({
        ...pos,
        balances: pos.balances.map((balance) => ({
          assetId: balance.assetId.toString(),
          balance: balance.balance,
        })),
      })),
    })
  }

  async getPositionUpdatePage(
    positionId: bigint,
    stateUpdateId: number
  ): Promise<string> {
    const [history, update] = await Promise.all([
      this.stateUpdateRepository.getPositionHistoryById(positionId),
      this.stateUpdateRepository.getStateChangeById(stateUpdateId),
    ])
    const updateIndex = history.findIndex(
      (p) => p.stateUpdateId === stateUpdateId
    )
    if (!updateIndex) {
      throw new Error('Cannot find update for position with id ' + positionId)
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

    return toReturn.toString()
  }
}
