import { BlockRange } from '../model'
import { BlockRepository } from '../peripherals/database/BlockRepository'
import { SyncStatusRepository } from '../peripherals/database/SyncStatusRepository'
import { BlockNumber } from '../peripherals/ethereum/types'
import { getBatches } from '../tools/getBatches'
import { JobQueue } from '../tools/JobQueue'
import { Logger } from '../tools/Logger'
import { BlockDownloader } from './BlockDownloader'
import { DataSyncService } from './DataSyncService'

export class SyncScheduler {
  constructor(
    private readonly statusRepository: SyncStatusRepository,
    private readonly blockDownloader: BlockDownloader,
    private readonly dataSyncService: DataSyncService,
    private readonly logger: Logger,
    private readonly batchSize: number
  ) {
    this.logger = logger.for(this)
  }

  private readonly jobQueue: JobQueue = new JobQueue(
    { maxConcurrentJobs: 1 },
    this.logger
  )

  async start() {
    let lastSynced = await this.statusRepository.getLastBlockNumberSynced()
    await this.dataSyncService.discardAfter(lastSynced)

    this.logger.info('start', { lastSynced })

    this.blockDownloader.onNewBlocks(lastSynced + 1, async (newBlockRange) => {
      lastSynced = newBlockRange.to
      this.scheduleSync(newBlockRange)
    })

    this.blockDownloader.onReorg(({ firstChangedBlock }) => {
      lastSynced = firstChangedBlock - 1
      this.scheduleDiscard(firstChangedBlock)
    })
  }

  private scheduleDiscard(from: BlockNumber) {
    this.jobQueue.add({
      name: `discard-${from}`,
      execute: () => this.dataSyncService.discardAfter(from),
    })
  }

  private scheduleSync(blockRange: BlockRange) {
    for (const [from, to] of getBatches(
      blockRange.from,
      blockRange.to,
      this.batchSize
    )) {
      this.jobQueue.add({
        name: `sync-${from}-${to}`,
        execute: () => this.sync(new BlockRange(blockRange, from, to)),
      })
    }
  }

  private async sync(blockRange: BlockRange) {
    try {
      this.logger.info({
        method: 'sync',
        from: blockRange.from,
        to: blockRange.to,
      })
      await this.dataSyncService.sync(blockRange)
      await this.statusRepository.setLastBlockNumberSynced(blockRange.to)
    } catch (err) {
      await this.dataSyncService.discardAfter(blockRange.from)
      throw err
    }
  }
}
