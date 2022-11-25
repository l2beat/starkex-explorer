import { ApiServer } from './api/ApiServer'
import { ForcedTradeOfferController } from './api/controllers/ForcedTradeOfferController'
import { ForcedTransactionController } from './api/controllers/ForcedTransactionController'
import { HomeController } from './api/controllers/HomeController'
import { PositionController } from './api/controllers/PositionController'
import { SearchController } from './api/controllers/SearchController'
import { StateUpdateController } from './api/controllers/StateUpdateController'
import { TransactionSubmitController } from './api/controllers/TransactionSubmitController'
import { createFrontendMiddleware } from './api/middleware/FrontendMiddleware'
import { createForcedTransactionRouter } from './api/routers/ForcedTransactionRouter'
import { createFrontendRouter } from './api/routers/FrontendRouter'
import { createStatusRouter } from './api/routers/StatusRouter'
import { Config } from './config'
import { AccountService } from './core/AccountService'
import { FinalizeExitEventsCollector } from './core/collectors/FinalizeExitEventsCollector'
import { ForcedEventsCollector } from './core/collectors/ForcedEventsCollector'
import { PageCollector } from './core/collectors/PageCollector'
import { PageMappingCollector } from './core/collectors/PageMappingCollector'
import { StateTransitionCollector } from './core/collectors/StateTransitionCollector'
import { UserRegistrationCollector } from './core/collectors/UserRegistrationCollector'
import { VerifierCollector } from './core/collectors/VerifierCollector'
import { DataSyncService } from './core/DataSyncService'
import { StateUpdater } from './core/StateUpdater'
import { StatusService } from './core/StatusService'
import { BlockDownloader } from './core/sync/BlockDownloader'
import { SyncScheduler } from './core/sync/SyncScheduler'
import { TransactionStatusMonitor } from './core/TransactionStatusMonitor'
import { TransactionStatusService } from './core/TransactionStatusService'
import { BlockRepository } from './peripherals/database/BlockRepository'
import { ForcedTradeOfferRepository } from './peripherals/database/ForcedTradeOfferRepository'
import { ForcedTransactionsRepository } from './peripherals/database/ForcedTransactionsRepository'
import { KeyValueStore } from './peripherals/database/KeyValueStore'
import { PageMappingRepository } from './peripherals/database/PageMappingRepository'
import { PageRepository } from './peripherals/database/PageRepository'
import { PositionRepository } from './peripherals/database/PositionRepository'
import { RollupStateRepository } from './peripherals/database/RollupStateRepository'
import { Database } from './peripherals/database/shared/Database'
import { StateTransitionRepository } from './peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from './peripherals/database/StateUpdateRepository'
import { SyncStatusRepository } from './peripherals/database/SyncStatusRepository'
import { TransactionStatusRepository } from './peripherals/database/TransactionStatusRepository'
import { UserRegistrationEventRepository } from './peripherals/database/UserRegistrationEventRepository'
import { VerifierEventRepository } from './peripherals/database/VerifierEventRepository'
import { EthereumClient } from './peripherals/ethereum/EthereumClient'
import { handleServerError, reportError } from './tools/ErrorReporter'
import { Logger } from './tools/Logger'

export class Application {
  start: () => Promise<void>

  constructor(config: Config) {
    // #region tools

    if (config.starkex.dataAvailabilityMode === 'validium') {
      throw new Error('Validium is not yet supported')
    }

    const logger = new Logger({
      ...config.logger,
      reportError,
    })

    // #endregion tools
    // #region peripherals

    const database = new Database(config.databaseConnection, logger)

    const kvStore = new KeyValueStore(database, logger)
    const syncStatusRepository = new SyncStatusRepository(kvStore, logger)
    const verifierEventRepository = new VerifierEventRepository(
      database,
      logger
    )
    const pageMappingRepository = new PageMappingRepository(database, logger)
    const pageRepository = new PageRepository(database, logger)
    const stateTransitionRepository = new StateTransitionRepository(
      database,
      logger
    )
    const blockRepository = new BlockRepository(database, logger)
    const rollupStateRepository = new RollupStateRepository(database, logger)
    const stateUpdateRepository = new StateUpdateRepository(database, logger)
    const positionRepository = new PositionRepository(database, logger)
    const userRegistrationEventRepository = new UserRegistrationEventRepository(
      database,
      logger
    )
    const forcedTransactionsRepository = new ForcedTransactionsRepository(
      database,
      logger
    )
    const forcedTradeOfferRepository = new ForcedTradeOfferRepository(
      database,
      logger
    )
    const transactionStatusRepository = new TransactionStatusRepository(
      database,
      logger
    )
    const ethereumClient = new EthereumClient(
      config.starkex.blockchain.jsonRpcUrl,
      config.starkex.blockchain.safeBlockDistance
    )

    // #endregion peripherals
    // #region core

    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger,
      config.starkex.blockchain.safeBlockDistance
    )

    const statusService = new StatusService({
      blockDownloader,
    })

    const verifierCollector = new VerifierCollector(
      ethereumClient,
      verifierEventRepository,
      config.starkex.contracts.proxy,
      config.starkex.contracts.verifiers
    )
    const pageMappingCollector = new PageMappingCollector(
      ethereumClient,
      pageMappingRepository
    )
    const pageCollector = new PageCollector(
      ethereumClient,
      pageRepository,
      config.starkex.contracts.registry
    )
    const stateTransitionCollector = new StateTransitionCollector(
      ethereumClient,
      stateTransitionRepository,
      config.starkex.contracts.perpetual
    )
    const stateUpdater = new StateUpdater(
      pageRepository,
      stateUpdateRepository,
      rollupStateRepository,
      ethereumClient,
      forcedTransactionsRepository,
      logger
    )
    const userRegistrationCollector = new UserRegistrationCollector(
      ethereumClient,
      userRegistrationEventRepository,
      config.starkex.contracts.perpetual
    )
    const forcedEventsCollector = new ForcedEventsCollector(
      ethereumClient,
      forcedTransactionsRepository,
      transactionStatusRepository,
      config.starkex.contracts.perpetual
    )

    const finalizeExitEventsCollector = new FinalizeExitEventsCollector(
      ethereumClient,
      forcedTransactionsRepository,
      transactionStatusRepository,
      config.starkex.contracts.perpetual
    )

    const dataSyncService = new DataSyncService(
      verifierCollector,
      pageMappingCollector,
      pageCollector,
      stateTransitionCollector,
      stateUpdater,
      userRegistrationCollector,
      forcedEventsCollector,
      finalizeExitEventsCollector,
      logger
    )
    const syncScheduler = new SyncScheduler(
      syncStatusRepository,
      blockDownloader,
      dataSyncService,
      logger,
      {
        earliestBlock: config.starkex.blockchain.minBlockNumber,
        maxBlockNumber: config.starkex.blockchain.maxBlockNumber,
      }
    )
    const transactionStatusService = new TransactionStatusService(
      transactionStatusRepository,
      ethereumClient,
      logger
    )
    const transactionStatusMonitor = new TransactionStatusMonitor(
      transactionStatusService
    )
    const accountService = new AccountService(
      positionRepository,
      forcedTradeOfferRepository,
      forcedTransactionsRepository
    )

    // #endregion core
    // #region api

    const positionController = new PositionController(
      accountService,
      stateUpdateRepository,
      positionRepository,
      userRegistrationEventRepository,
      forcedTransactionsRepository,
      forcedTradeOfferRepository
    )
    const homeController = new HomeController(
      accountService,
      stateUpdateRepository,
      positionRepository,
      forcedTransactionsRepository,
      forcedTradeOfferRepository
    )
    const forcedTransactionController = new ForcedTransactionController(
      accountService,
      userRegistrationEventRepository,
      positionRepository,
      forcedTransactionsRepository,
      forcedTradeOfferRepository,
      config.starkex.contracts.perpetual
    )
    const stateUpdateController = new StateUpdateController(
      accountService,
      stateUpdateRepository,
      forcedTransactionsRepository
    )
    const searchController = new SearchController(
      stateUpdateRepository,
      positionRepository,
      userRegistrationEventRepository
    )
    const forcedTradeOfferController = new ForcedTradeOfferController(
      accountService,
      forcedTradeOfferRepository,
      positionRepository,
      userRegistrationEventRepository,
      config.starkex.contracts.perpetual
    )
    const userTransactionController = new TransactionSubmitController(
      ethereumClient,
      forcedTransactionsRepository,
      forcedTradeOfferRepository,
      config.starkex.contracts.perpetual
    )

    const apiServer = new ApiServer(config.port, logger, {
      routers: [
        createStatusRouter(statusService),
        createFrontendRouter(
          positionController,
          homeController,
          forcedTradeOfferController,
          forcedTransactionController,
          stateUpdateController,
          searchController
        ),
        createForcedTransactionRouter(
          forcedTradeOfferController,
          userTransactionController
        ),
      ],
      middleware: [createFrontendMiddleware()],
      forceHttps: config.forceHttps,
      handleServerError,
    })

    // #endregion api
    // #region start

    this.start = async () => {
      logger.for(this).info('Starting')

      await apiServer.listen()
      if (config.freshStart) await database.rollbackAll()
      await database.migrateToLatest()

      if (config.enableSync) {
        transactionStatusMonitor.start()
        await syncScheduler.start()
        await blockDownloader.start()
      }

      logger.for(this).info('Started')
    }

    // #endregion start
  }
}
