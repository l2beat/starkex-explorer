import {
  HomeProps,
  renderHomePage,
} from '@explorer/frontend'

import { StateUpdateRepository } from "../../peripherals/database/StateUpdateRepository";

export class FrontendController {
  constructor(private stateUpdateRepository: StateUpdateRepository) {
    this.stateUpdateRepository = stateUpdateRepository
  }
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
}