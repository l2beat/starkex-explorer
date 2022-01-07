import { ApiServer } from './api/ApiServer'
import { createFrontendMiddleware } from './api/middleware/FrontendMiddleware'
import { createFrontendRouter } from './api/routers/FrontendRouter'
import { createStatusRouter } from './api/routers/StatusRouter'
import { Config } from './config'
import { DatabaseService } from './peripherals/database/DatabaseService'
import { PositionUpdateRepository } from './peripherals/database/PositionUpdateRepository'
import { OnChainDataClient } from './peripherals/onchain/OnChainDataClient'
import { Logger } from './tools/Logger'

export class Application {
  start: () => Promise<void>

  constructor(config: Config) {
    /* - - - - - TOOLS - - - - - */

    const logger = new Logger(config.logger)

    /* - - - - - PERIPHERALS - - - - - */

    const knex = DatabaseService.createKnexInstance(config.databaseUrl)
    const databaseService = new DatabaseService(knex, logger)

    const positionUpdateRepository = new PositionUpdateRepository(knex, logger)

    // @todo should this be moved to /core?
    const onChainDataClient = new OnChainDataClient(
      positionUpdateRepository,
      logger
    )

    /* - - - - - API - - - - - */

    const apiServer = new ApiServer(config.port, logger, {
      routers: [createStatusRouter(), createFrontendRouter()],
      middleware: [createFrontendMiddleware()],
    })

    /* - - - - - START - - - - - */

    this.start = async () => {
      logger.for(this).info('Starting')

      await databaseService.migrateToLatest()
      await onChainDataClient.savePositionsToDatabase()

      await apiServer.listen()

      logger.for(this).info('Started')
    }
  }
}
