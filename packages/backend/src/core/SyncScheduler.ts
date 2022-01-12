import { SyncStatusRepository } from '../peripherals/database/SyncStatusRepository'
import { BlockRange } from '../peripherals/ethereum/types'
import { getBatches } from '../tools/getBatches'
import { JobQueue } from '../tools/JobQueue'
import { Logger } from '../tools/Logger'
import { DataSyncService } from './DataSyncService'
import { SafeBlockService } from './SafeBlockService'

/** max synced blockRange length */
const BATCH_SIZE = 500

export class SyncScheduler {
  constructor(
    private readonly statusRepository: SyncStatusRepository,
    private readonly safeBlockService: SafeBlockService,
    private readonly dataSyncService: DataSyncService,
    private readonly logger: Logger,
    private readonly batchSize = BATCH_SIZE
  ) {
    this.logger = logger.for(this)
  }

  private readonly jobQueue: JobQueue = new JobQueue(
    { maxConcurrentJobs: 1 },
    this.logger
  )

  async start() {
    let last = await this.statusRepository.getLastBlockNumberSynced()

    this.logger.info('Last block number synced', { last })

    await this.dataSyncService.revert()

    this.safeBlockService.onNewSafeBlock(({ blockNumber }) => {
      if (blockNumber > last) {
        this.schedule({ from: last + 1, to: blockNumber })
        last = blockNumber
      }
    })

    // @todo handle reverts
    // this.safeBlockNumber.onRevert(async (blockNumber) => {
    //   await this.jobQueue.finishCurrentAndClear()
    //   this.dataSyncService.revert()
    //   last = await this.getLastBlockNumberSynced()
    //   this.schedule({ from: last + 1, to: blockNumber })
    //   last = blockNumber
    // })
    //
  }

  private async schedule(blockRange: BlockRange) {
    for (const [from, to] of getBatches(
      blockRange.from,
      blockRange.to,
      this.batchSize
    )) {
      this.jobQueue.add({
        name: `sync-${from}-${to}`,
        execute: () => this.sync({ from, to }),
      })
    }
  }

  private async sync(blockRange: BlockRange) {
    this.logger.info({ method: 'sync', blockRange })
    await this.dataSyncService.sync(blockRange)
    await this.statusRepository.setLastBlockNumberSynced(blockRange.to)
  }
}
