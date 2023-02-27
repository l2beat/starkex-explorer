import { PositionLeaf, VaultLeaf } from '@explorer/state'
import { AssetHash, AssetId } from '@explorer/types'

import { ApiServer } from './api/ApiServer'
import { ForcedTradeOfferController } from './api/controllers/ForcedTradeOfferController'
import { ForcedTransactionController } from './api/controllers/ForcedTransactionController'
import { HomeController } from './api/controllers/HomeController'
import { OldHomeController } from './api/controllers/OldHomeController'
import { OldStateUpdateController } from './api/controllers/OldStateUpdateController'
import { PositionController } from './api/controllers/PositionController'
import { SearchController } from './api/controllers/SearchController'
import { StateUpdateController } from './api/controllers/StateUpdateController'
import { TransactionSubmitController } from './api/controllers/TransactionSubmitController'
import { UserController } from './api/controllers/UserController'
import { createFrontendMiddleware } from './api/middleware/FrontendMiddleware'
import { createForcedTransactionRouter } from './api/routers/ForcedTransactionRouter'
import { createFrontendRouter } from './api/routers/FrontendRouter'
import { createOldFrontendRouter } from './api/routers/OldFrontendRouter'
import { createStatusRouter } from './api/routers/StatusRouter'
import { Config } from './config'
import { AccountService } from './core/AccountService'
import { AssetRegistrationCollector } from './core/collectors/AssetRegistrationCollector'
import { DepositWithTokenIdCollector } from './core/collectors/DepositWithTokenIdCollector'
import { PageCollector } from './core/collectors/PageCollector'
import { PageMappingCollector } from './core/collectors/PageMappingCollector'
import { PerpetualCairoOutputCollector } from './core/collectors/PerpetualCairoOutputCollector'
import { PerpetualRollupStateTransitionCollector } from './core/collectors/PerpetualRollupStateTransitionCollector'
import { SpotCairoOutputCollector } from './core/collectors/SpotCairoOutputCollector'
import { UserRegistrationCollector } from './core/collectors/UserRegistrationCollector'
import { UserTransactionCollector } from './core/collectors/UserTransactionCollector'
import {
  PerpetualValidiumStateTransitionCollector,
  SpotValidiumStateTransitionCollector,
} from './core/collectors/ValidiumStateTransitionCollector'
import { VerifierCollector } from './core/collectors/VerifierCollector'
import { WithdrawalAllowedCollector } from './core/collectors/WithdrawalAllowedCollector'
import { UserTransactionMigrator } from './core/migrations/UserTransactionMigrator'
import { WithdrawableAssetMigrator } from './core/migrations/WithdrawableAssetMigrator'
import { PerpetualRollupSyncService } from './core/PerpetualRollupSyncService'
import { PerpetualRollupUpdater } from './core/PerpetualRollupUpdater'
import { PerpetualValidiumSyncService } from './core/PerpetualValidiumSyncService'
import { PerpetualValidiumUpdater } from './core/PerpetualValidiumUpdater'
import { PerpetualHistoryPreprocessor } from './core/preprocessing/PerpetualHistoryPreprocessor'
import { Preprocessor } from './core/preprocessing/Preprocessor'
import { SpotHistoryPreprocessor } from './core/preprocessing/SpotHistoryPreprocessor'
import { SpotValidiumSyncService } from './core/SpotValidiumSyncService'
import { SpotValidiumUpdater } from './core/SpotValidiumUpdater'
import { StatusService } from './core/StatusService'
import { BlockDownloader } from './core/sync/BlockDownloader'
import { SyncScheduler } from './core/sync/SyncScheduler'
import { TransactionStatusService } from './core/TransactionStatusService'
import { UserService } from './core/UserService'
import { AssetRepository } from './peripherals/database/AssetRepository'
import { BlockRepository } from './peripherals/database/BlockRepository'
import { ForcedTradeOfferRepository } from './peripherals/database/ForcedTradeOfferRepository'
import { KeyValueStore } from './peripherals/database/KeyValueStore'
import { MerkleTreeRepository } from './peripherals/database/MerkleTreeRepository'
import { PageMappingRepository } from './peripherals/database/PageMappingRepository'
import { PageRepository } from './peripherals/database/PageRepository'
import { PositionRepository } from './peripherals/database/PositionRepository'
import { PreprocessedAssetHistoryRepository } from './peripherals/database/PreprocessedAssetHistoryRepository'
import { PreprocessedStateUpdateRepository } from './peripherals/database/PreprocessedStateUpdateRepository'
import { Database } from './peripherals/database/shared/Database'
import { SoftwareMigrationRepository } from './peripherals/database/SoftwareMigrationRepository'
import { StateTransitionRepository } from './peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from './peripherals/database/StateUpdateRepository'
import { SyncStatusRepository } from './peripherals/database/SyncStatusRepository'
import { SentTransactionRepository } from './peripherals/database/transactions/SentTransactionRepository'
import { UserTransactionRepository } from './peripherals/database/transactions/UserTransactionRepository'
import { UserRegistrationEventRepository } from './peripherals/database/UserRegistrationEventRepository'
import { VaultRepository } from './peripherals/database/VaultRepository'
import { VerifierEventRepository } from './peripherals/database/VerifierEventRepository'
import { WithdrawableAssetRepository } from './peripherals/database/WithdrawableAssetRepository'
import { EthereumClient } from './peripherals/ethereum/EthereumClient'
import { TokenInspector } from './peripherals/ethereum/TokenInspector'
import { AvailabilityGatewayClient } from './peripherals/starkware/AvailabilityGatewayClient'
import { handleServerError, reportError } from './tools/ErrorReporter'
import { Logger } from './tools/Logger'

export class Application {
  start: () => Promise<void>

  constructor(config: Config) {
    // #region tools

    const logger = new Logger({
      ...config.logger,
      reportError,
    })

    // #endregion tools
    // #region peripherals

    const database = new Database(config.databaseConnection, logger)

    const kvStore = new KeyValueStore(database, logger)
    const syncStatusRepository = new SyncStatusRepository(kvStore, logger)
    const softwareMigrationRepository = new SoftwareMigrationRepository(
      kvStore,
      logger
    )

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
    const stateUpdateRepository = new StateUpdateRepository(database, logger)
    const positionRepository = new PositionRepository(database, logger)
    const userRegistrationEventRepository = new UserRegistrationEventRepository(
      database,
      logger
    )
    const forcedTradeOfferRepository = new ForcedTradeOfferRepository(
      database,
      logger
    )
    const sentTransactionRepository = new SentTransactionRepository(
      database,
      logger
    )
    const userTransactionRepository = new UserTransactionRepository(
      database,
      logger
    )
    const assetRepository = new AssetRepository(database, logger)
    const withdrawableAssetRepository = new WithdrawableAssetRepository(
      database,
      logger
    )

    const ethereumClient = new EthereumClient(
      config.starkex.blockchain.jsonRpcUrl,
      config.starkex.blockchain.safeBlockDistance
    )

    const tokenInspector = new TokenInspector(ethereumClient)

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
    const userRegistrationCollector = new UserRegistrationCollector(
      ethereumClient,
      userRegistrationEventRepository,
      config.starkex.contracts.perpetual
    )
    const userTransactionCollector = new UserTransactionCollector(
      ethereumClient,
      userTransactionRepository,
      withdrawableAssetRepository,
      config.starkex.contracts.perpetual,
      config.starkex.tradingMode === 'perpetual'
        ? config.starkex.collateralAsset
        : undefined
    )

    const tokenRegistrationCollector = new AssetRegistrationCollector(
      ethereumClient,
      config.starkex.contracts.perpetual,
      assetRepository,
      tokenInspector
    )
    const depositWithTokenIdCollector = new DepositWithTokenIdCollector(
      ethereumClient,
      config.starkex.contracts.perpetual,
      assetRepository,
      tokenInspector
    )
    const withdrawalAllowedCollector = new WithdrawalAllowedCollector(
      ethereumClient,
      withdrawableAssetRepository,
      config.starkex.contracts.perpetual
    )

    let syncService

    if (config.starkex.dataAvailabilityMode === 'validium') {
      const availabilityGatewayClient = new AvailabilityGatewayClient(
        config.starkex.availabilityGateway
      )

      if (config.starkex.tradingMode === 'perpetual') {
        const perpetualValidiumStateTransitionCollector =
          new PerpetualValidiumStateTransitionCollector(
            ethereumClient,
            stateTransitionRepository,
            config.starkex.contracts.perpetual
          )
        const perpetualCairoOutputCollector = new PerpetualCairoOutputCollector(
          ethereumClient
        )
        const rollupStateRepository = new MerkleTreeRepository(
          database,
          logger,
          PositionLeaf
        )
        const perpetualValidiumUpdater = new PerpetualValidiumUpdater(
          stateUpdateRepository,
          rollupStateRepository,
          ethereumClient,
          userTransactionRepository,
          logger
        )
        syncService = new PerpetualValidiumSyncService(
          availabilityGatewayClient,
          perpetualValidiumStateTransitionCollector,
          userRegistrationCollector,
          userTransactionCollector,
          perpetualCairoOutputCollector,
          perpetualValidiumUpdater,
          withdrawalAllowedCollector,
          logger
        )
      } else {
        const spotValidiumStateTransitionCollector =
          new SpotValidiumStateTransitionCollector(
            ethereumClient,
            stateTransitionRepository,
            config.starkex.contracts.perpetual
          )
        const spotCairoOutputCollector = new SpotCairoOutputCollector(
          ethereumClient
        )
        const spotStateRepository = new MerkleTreeRepository(
          database,
          logger,
          VaultLeaf
        )
        const spotValidiumUpdater = new SpotValidiumUpdater(
          stateUpdateRepository,
          spotStateRepository,
          ethereumClient,
          userTransactionRepository,
          logger
        )

        syncService = new SpotValidiumSyncService(
          availabilityGatewayClient,
          spotValidiumStateTransitionCollector,
          userRegistrationCollector,
          userTransactionCollector,
          spotCairoOutputCollector,
          spotValidiumUpdater,
          tokenRegistrationCollector,
          depositWithTokenIdCollector,
          withdrawalAllowedCollector,
          logger
        )
      }
    } else {
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
      const stateTransitionCollector =
        new PerpetualRollupStateTransitionCollector(
          ethereumClient,
          stateTransitionRepository,
          config.starkex.contracts.perpetual
        )
      const rollupStateRepository = new MerkleTreeRepository(
        database,
        logger,
        PositionLeaf
      )
      const perpetualRollupUpdater = new PerpetualRollupUpdater(
        pageRepository,
        stateUpdateRepository,
        rollupStateRepository,
        ethereumClient,
        userTransactionRepository,
        logger
      )
      syncService = new PerpetualRollupSyncService(
        verifierCollector,
        pageMappingCollector,
        pageCollector,
        stateTransitionCollector,
        perpetualRollupUpdater,
        userRegistrationCollector,
        userTransactionCollector,
        withdrawalAllowedCollector,
        logger
      )
    }

    const transactionStatusService = new TransactionStatusService(
      sentTransactionRepository,
      ethereumClient,
      logger
    )
    const accountService = new AccountService(
      positionRepository,
      forcedTradeOfferRepository,
      sentTransactionRepository
    )
    const userService = new UserService(userRegistrationEventRepository)

    const userTransactionMigrator = new UserTransactionMigrator(
      database,
      softwareMigrationRepository,
      syncStatusRepository,
      userTransactionRepository,
      sentTransactionRepository,
      userTransactionCollector,
      ethereumClient,
      logger
    )
    const withdrawableAssetMigrator = new WithdrawableAssetMigrator(
      softwareMigrationRepository,
      syncStatusRepository,
      withdrawableAssetRepository,
      withdrawalAllowedCollector,
      logger
    )

    const preprocessedStateUpdateRepository =
      new PreprocessedStateUpdateRepository(database, logger)

    let preprocessor: Preprocessor<AssetHash> | Preprocessor<AssetId>
    const isPreprocessorEnabled = config.enablePreprocessing

    let preprocessedAssetHistoryRepository
    if (config.starkex.tradingMode === 'perpetual') {
      preprocessedAssetHistoryRepository =
        new PreprocessedAssetHistoryRepository(database, AssetId, logger)

      const perpetualHistoryPreprocessor = new PerpetualHistoryPreprocessor(
        config.starkex.collateralAsset,
        preprocessedAssetHistoryRepository,
        stateUpdateRepository,
        positionRepository,
        logger
      )

      preprocessor = new Preprocessor(
        preprocessedStateUpdateRepository,
        syncStatusRepository,
        stateUpdateRepository,
        perpetualHistoryPreprocessor,
        logger,
        isPreprocessorEnabled
      )
    } else {
      preprocessedAssetHistoryRepository =
        new PreprocessedAssetHistoryRepository(database, AssetHash, logger)

      const vaultRepository = new VaultRepository(database, logger)

      const spotHistoryPreprocessor = new SpotHistoryPreprocessor(
        preprocessedAssetHistoryRepository,
        vaultRepository,
        logger
      )

      preprocessor = new Preprocessor(
        preprocessedStateUpdateRepository,
        syncStatusRepository,
        stateUpdateRepository,
        spotHistoryPreprocessor,
        logger,
        isPreprocessorEnabled
      )
    }

    const syncScheduler = new SyncScheduler(
      syncStatusRepository,
      blockDownloader,
      syncService,
      preprocessor,
      logger,
      {
        earliestBlock: config.starkex.blockchain.minBlockNumber,
        maxBlockNumber: config.starkex.blockchain.maxBlockNumber,
      }
    )

    // #endregion core
    // #region api

    const positionController = new PositionController(
      accountService,
      stateUpdateRepository,
      positionRepository,
      userRegistrationEventRepository,
      sentTransactionRepository,
      userTransactionRepository,
      forcedTradeOfferRepository
    )
    const homeController = new HomeController(
      userService,
      stateUpdateRepository,
      userTransactionRepository
    )
    const userController = new UserController(
      userService,
      preprocessedAssetHistoryRepository,
      userTransactionRepository,
      config.starkex.tradingMode,
      config.starkex.tradingMode === 'perpetual'
        ? config.starkex.collateralAsset
        : undefined
    )
    const stateUpdateController = new StateUpdateController(
      userService,
      stateUpdateRepository,
      preprocessedAssetHistoryRepository,
      config.starkex.tradingMode
    )

    const oldHomeController = new OldHomeController(
      accountService,
      stateUpdateRepository,
      positionRepository,
      userTransactionRepository,
      forcedTradeOfferRepository
    )
    const forcedTransactionController = new ForcedTransactionController(
      accountService,
      userRegistrationEventRepository,
      positionRepository,
      userTransactionRepository,
      sentTransactionRepository,
      forcedTradeOfferRepository,
      config.starkex.contracts.perpetual
    )
    const oldStateUpdateController = new OldStateUpdateController(
      accountService,
      stateUpdateRepository,
      userTransactionRepository
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
      sentTransactionRepository,
      forcedTradeOfferRepository,
      config.starkex.contracts.perpetual
    )

    const apiServer = new ApiServer(config.port, logger, {
      routers: [
        createStatusRouter(statusService),
        config.useOldFrontend
          ? createOldFrontendRouter(
              positionController,
              oldHomeController,
              forcedTradeOfferController,
              forcedTransactionController,
              oldStateUpdateController,
              searchController
            )
          : createFrontendRouter(
              homeController,
              userController,
              stateUpdateController
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

      await ethereumClient.assertChainId(config.starkex.blockchain.chainId)

      await userTransactionMigrator.migrate()
      await withdrawableAssetMigrator.migrate()

      if (config.enableSync) {
        transactionStatusService.start()
        await syncScheduler.start()
        await blockDownloader.start()
      }

      logger.for(this).info('Started')
    }

    // #endregion start
  }
}
