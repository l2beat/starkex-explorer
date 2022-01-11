import { ApiServer } from './api/ApiServer'
import { createFrontendMiddleware } from './api/middleware/FrontendMiddleware'
import { createFrontendRouter } from './api/routers/FrontendRouter'
import { createStatusRouter } from './api/routers/StatusRouter'
import { Config } from './config'
import { DataSyncService } from './core/DataSyncService'
import { SafeBlockService } from './core/SafeBlockService'
import { StatusService } from './core/StatusService'
import { SyncScheduler } from './core/SyncScheduler'
import { DatabaseService } from './peripherals/database/DatabaseService'
import { KeyValueStore } from './peripherals/database/KeyValueStore'
import { PositionUpdateRepository } from './peripherals/database/PositionUpdateRepository'
import { EthereumClient } from './peripherals/ethereum/EthereumClient'
import { Logger } from './tools/Logger'

export class Application {
  start: () => Promise<void>

  constructor(config: Config) {
    // #region tools

    const logger = new Logger(config.logger)

    // #endregion tools
    // #region peripherals

    const knex = DatabaseService.createKnexInstance(config.databaseUrl)
    const databaseService = new DatabaseService(knex, logger)

    const kvStore = new KeyValueStore(knex, logger)
    // @todo unused for now
    new PositionUpdateRepository(knex, logger)
    const ethereumClient = new EthereumClient(config.jsonRpcUrl)

    // #endregion peripherals
    // #region core

    const safeBlockService = new SafeBlockService(
      config.core.safeBlock.refreshIntervalMs,
      config.core.safeBlock.blockOffset,
      ethereumClient,
      logger
    )

    const statusService = new StatusService({
      databaseService,
      safeBlockService,
    })

    const dataSyncService = new DataSyncService()
    const syncScheduler = new SyncScheduler(
      kvStore,
      safeBlockService,
      dataSyncService,
      logger
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

      await databaseService.migrateToLatest()

      await apiServer.listen()
      await syncScheduler.start()

      logger.for(this).info('Started')
    }

    // #endregion start
  }
}
