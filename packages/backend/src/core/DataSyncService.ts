import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { IDataCollector } from './DataCollector'
import { StateUpdater } from './StateUpdater'

export class DataSyncService {
  constructor(
    private readonly dataCollector: IDataCollector,
    private readonly stateUpdater: StateUpdater
  ) {}

  async sync(blockRange: BlockRange) {
    const stateTransitions = await this.dataCollector.collect(blockRange)

    for (const stateTransition of stateTransitions) {
      await this.stateUpdater.processStateTransition(stateTransition)
    }
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.dataCollector.discardAfter(blockNumber)
  }
}
