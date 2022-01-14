import { BlockNumber, BlockRange } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'
import { VerifierCollector } from './VerifierCollector'

export class DataSyncService {
  constructor(
    private readonly verifierCollector: VerifierCollector,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async sync(blockRange: BlockRange) {
    const verifiers = await this.verifierCollector.collect(blockRange)

    this.logger.info({
      method: 'sync',
      blockRange,
      verifiers: verifiers.map(String),
    })
  }

  async revert(_blockNumber: BlockNumber) {
    this.logger.error(`Method .revert() not implemented`)
  }
}
