import { ApiServer } from './api/ApiServer'
import { createFrontendMiddleware } from './api/middleware/FrontendMiddleware'
import { createFrontendRouter } from './api/routers/FrontendRouter'
import { createStatusRouter } from './api/routers/StatusRouter'
import { Config } from './config'
import { StatusService } from './core/StatusService'
import { DatabaseService } from './peripherals/database/DatabaseService'
import { PositionUpdateRepository } from './peripherals/database/PositionUpdateRepository'
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

    // @todo unused for now
    new PositionUpdateRepository(knex, logger)

    // #endregion peripherals
    // #region core

    const statusService = new StatusService({
      databaseService,
    })

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

      logger.for(this).info('Started')
    }

    // #endregion start
  }
}
