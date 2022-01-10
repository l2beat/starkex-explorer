import { ApiServer } from './api/ApiServer'
import { createFrontendMiddleware } from './api/middleware/FrontendMiddleware'
import { createFrontendRouter } from './api/routers/FrontendRouter'
import { createStatusRouter } from './api/routers/StatusRouter'
import { Config } from './config'
import { OnChainDataClient } from './core/OnChainDataClient'
import { SafeBlockService } from './core/SafeBlockService'
import { StatusService } from './core/StatusService'
import { DatabaseService } from './peripherals/database/DatabaseService'
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

    const positionUpdateRepository = new PositionUpdateRepository(knex, logger)

    const onChainDataClient = new OnChainDataClient(
      positionUpdateRepository,
      logger
    )

    const ethereumClient = new EthereumClient()

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

    // #endregion peripherals
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
      await onChainDataClient.savePositionsToDatabase()

      await apiServer.listen()

      logger.for(this).info('Started')
    }

    // #endregion start
  }
}
