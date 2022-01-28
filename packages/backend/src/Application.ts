import { ApiServer } from './api/ApiServer'
import { createFrontendMiddleware } from './api/middleware/FrontendMiddleware'
import { createFrontendRouter } from './api/routers/FrontendRouter'
import { createStatusRouter } from './api/routers/StatusRouter'
import { Config } from './config'
import { BlockDownloader } from './core/BlockDownloader'
import { DataSyncService } from './core/DataSyncService'
import { MemoryHashEventCollector } from './core/MemoryHashEventCollector'
import { PageCollector } from './core/PageCollector'
import { StateTransitionFactCollector } from './core/StateTransitionFactCollector'
import { StatusService } from './core/StatusService'
import { SyncScheduler } from './core/SyncScheduler'
import { VerifierCollector } from './core/VerifierCollector'
import { BlockRepository } from './peripherals/database/BlockRepository'
import { DatabaseService } from './peripherals/database/DatabaseService'
import { FactToPageRepository } from './peripherals/database/FactToPageRepository'
import { KeyValueStore } from './peripherals/database/KeyValueStore'
import { PageRepository } from './peripherals/database/PageRepository'
import { PositionUpdateRepository } from './peripherals/database/PositionUpdateRepository'
import { StateTransitionFactRepository } from './peripherals/database/StateTransitionFactsRepository'
import { SyncStatusRepository } from './peripherals/database/SyncStatusRepository'
import { VerifierEventRepository } from './peripherals/database/VerifierEventRepository'
import { EthereumClient } from './peripherals/ethereum/EthereumClient'
import { Logger } from './tools/Logger'

export class Application {
  start: () => Promise<void>

  constructor(config: Config) {
    // #region tools

    const logger = new Logger(config.logger)

    // #endregion tools
    // #region peripherals

    const knex = DatabaseService.createKnexInstance(config.databaseConnection)
    const databaseService = new DatabaseService(knex, logger)

    const kvStore = new KeyValueStore(knex, logger)
    const syncStatusRepository = new SyncStatusRepository(kvStore)
    const positionUpdateRepository = new PositionUpdateRepository(knex, logger)
    const verifierEventRepository = new VerifierEventRepository(knex, logger)
    const factToPageRepository = new FactToPageRepository(knex, logger)
    const pageRepository = new PageRepository(knex, logger)
    const stateTransitionFactRepository = new StateTransitionFactRepository(
      knex,
      logger
    )
    const blockRepository = new BlockRepository(knex, logger)

    const ethereumClient = new EthereumClient(config.jsonRpcUrl)

    // #endregion peripherals
    // #region core

    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    const statusService = new StatusService({
      databaseService,
      blockDownloader,
    })

    const verifierCollector = new VerifierCollector(
      ethereumClient,
      verifierEventRepository
    )
    const memoryHashEventCollector = new MemoryHashEventCollector(
      ethereumClient,
      factToPageRepository
    )
    const pageCollector = new PageCollector(ethereumClient, pageRepository)
    const stateTransitionFactCollector = new StateTransitionFactCollector(
      ethereumClient,
      stateTransitionFactRepository
    )

    const dataSyncService = new DataSyncService(
      verifierCollector,
      memoryHashEventCollector,
      pageCollector,
      stateTransitionFactCollector,
      pageRepository,
      positionUpdateRepository,
      logger
    )
    const syncScheduler = new SyncScheduler(
      syncStatusRepository,
      blockDownloader,
      dataSyncService,
      logger,
      config.core.syncBatchSize
    )

    // #endregion core
    // #region api

    const apiServer = new ApiServer(config.port, logger, {
      routers: [createStatusRouter(statusService), createFrontendRouter()],
      middleware: [createFrontendMiddleware()],
    })

    // #endregion api
    // #region start

    this.start = async () => {
      logger.for(this).info('Starting')

      if (config.freshStart) await databaseService.rollbackAll()
      await databaseService.migrateToLatest()

      await apiServer.listen()
      await blockDownloader.start()
      await syncScheduler.start()

      logger.for(this).info('Started')
    }

    // #endregion start
  }
}
