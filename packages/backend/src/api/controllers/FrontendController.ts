import { PedersenHash } from '@explorer/crypto'
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

  async getStateChangeDetailsPage(hash: PedersenHash): Promise<string> {
    const stateChange =
      await this.stateUpdateRepository.getStateChangeByRootHash(hash)

    return renderStateChangeDetailsPage({
      hash,
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
    const history = await this.stateUpdateRepository.getPositionById(positionId)

    return renderPositionDetailsPage({
      positionId,
      history: history.map((pos) => ({
        ...pos,
        balances: pos.balances.map((balance) => ({
          assetId: balance.assetId.toString(),
          balance: balance.balance,
        })),
      })),
    })
  }
}
