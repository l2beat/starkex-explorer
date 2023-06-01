import { PositionLeaf, VaultLeaf } from '@explorer/state'
import { AssetHash, AssetId } from '@explorer/types'

import { ApiServer } from './api/ApiServer'
import { ForcedActionController } from './api/controllers/ForcedActionController'
import { ForcedTradeOfferController } from './api/controllers/ForcedTradeOfferController'
import { HomeController } from './api/controllers/HomeController'
import { MerkleProofController } from './api/controllers/MerkleProofController'
import { SearchController } from './api/controllers/SearchController'
import { StateUpdateController } from './api/controllers/StateUpdateController'
import { TransactionController } from './api/controllers/TransactionController'
import { TransactionSubmitController } from './api/controllers/TransactionSubmitController'
import { UserController } from './api/controllers/UserController'
import { createFrontendMiddleware } from './api/middleware/FrontendMiddleware'
import { createTransactionRouter } from './api/routers/ForcedTransactionRouter'
import { createFrontendRouter } from './api/routers/FrontendRouter'
import { createStatusRouter } from './api/routers/StatusRouter'
import { Config } from './config'
import { AssetDetailsService } from './core/AssetDetailsService'
import { AssetRegistrationCollector } from './core/collectors/AssetRegistrationCollector'
import { DepositWithTokenIdCollector } from './core/collectors/DepositWithTokenIdCollector'
import { FeederGatewayCollector } from './core/collectors/FeederGatewayCollector'
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
import { ForcedTradeOfferViewService } from './core/ForcedTradeOfferViewService'
import { IDataSyncService } from './core/IDataSyncService'
import { IStateTransitionCollector } from './core/IStateTransitionCollector'
import { StateUpdateWithBatchIdMigrator } from './core/migrations/StateUpdateWithBatchIdMigrator'
import { UserTransactionMigrator } from './core/migrations/UserTransactionMigrator'
import { WithdrawableAssetMigrator } from './core/migrations/WithdrawableAssetMigrator'
import { PageContextService } from './core/PageContextService'
import { PerpetualRollupSyncService } from './core/PerpetualRollupSyncService'
import { PerpetualRollupUpdater } from './core/PerpetualRollupUpdater'
import { PerpetualValidiumSyncService } from './core/PerpetualValidiumSyncService'
import { PerpetualValidiumUpdater } from './core/PerpetualValidiumUpdater'
import { PerpetualHistoryPreprocessor } from './core/preprocessing/PerpetualHistoryPreprocessor'
import { Preprocessor } from './core/preprocessing/Preprocessor'
import { SpotHistoryPreprocessor } from './core/preprocessing/SpotHistoryPreprocessor'
import { StateDetailsPreprocessor } from './core/preprocessing/StateDetailsPreprocessor'
import { UserStatisticsPreprocessor } from './core/preprocessing/UserStatisticsPreprocessor'
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
import { L2TransactionRepository } from './peripherals/database/L2TransactionRepository'
import { MerkleTreeRepository } from './peripherals/database/MerkleTreeRepository'
import { PageMappingRepository } from './peripherals/database/PageMappingRepository'
import { PageRepository } from './peripherals/database/PageRepository'
import { PositionRepository } from './peripherals/database/PositionRepository'
import { PreprocessedAssetHistoryRepository } from './peripherals/database/PreprocessedAssetHistoryRepository'
import { PreprocessedStateDetailsRepository } from './peripherals/database/PreprocessedStateDetailsRepository'
import { PreprocessedStateUpdateRepository } from './peripherals/database/PreprocessedStateUpdateRepository'
import { PreprocessedUserStatisticsRepository } from './peripherals/database/PreprocessedUserStatisticsRepository'
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
import { FeederGatewayClient } from './peripherals/starkware/FeederGatewayClient'
import { FetchClient } from './peripherals/starkware/FetchClient'
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

    const collateralAsset =
      config.starkex.tradingMode === 'perpetual'
        ? config.starkex.collateralAsset
        : undefined

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
    const vaultRepository = new VaultRepository(database, logger)
    const userRegistrationEventRepository = new UserRegistrationEventRepository(
      database,
      logger
    )
    const userService = new UserService(userRegistrationEventRepository)
    const pageContextService = new PageContextService(config, userService)
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
    const forcedTradeOfferViewService = new ForcedTradeOfferViewService(
      userTransactionRepository,
      sentTransactionRepository
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
    const fetchClient = new FetchClient(logger)

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
      collateralAsset
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

    let syncService: IDataSyncService
    let stateUpdater:
      | SpotValidiumUpdater
      | PerpetualValidiumUpdater
      | PerpetualRollupUpdater
    let stateTransitionCollector: IStateTransitionCollector

    let feederGatewayCollector: FeederGatewayCollector | undefined

    if (config.starkex.dataAvailabilityMode === 'validium') {
      const availabilityGatewayClient = new AvailabilityGatewayClient(
        config.starkex.availabilityGateway,
        fetchClient
      )

      if (config.starkex.tradingMode === 'perpetual') {
        const perpetualValidiumStateTransitionCollector =
          new PerpetualValidiumStateTransitionCollector(
            ethereumClient,
            stateTransitionRepository,
            config.starkex.contracts.perpetual
          )
        stateTransitionCollector = perpetualValidiumStateTransitionCollector
        const transactionRepository = new L2TransactionRepository(
          database,
          logger
        )
        const feederGatewayClient = config.starkex.feederGateway
          ? new FeederGatewayClient(config.starkex.feederGateway, fetchClient)
          : undefined
        feederGatewayCollector = feederGatewayClient
          ? new FeederGatewayCollector(
              feederGatewayClient,
              transactionRepository,
              logger
            )
          : undefined

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
        stateUpdater = perpetualValidiumUpdater

        syncService = new PerpetualValidiumSyncService(
          availabilityGatewayClient,
          perpetualValidiumStateTransitionCollector,
          userRegistrationCollector,
          userTransactionCollector,
          perpetualCairoOutputCollector,
          perpetualValidiumUpdater,
          withdrawalAllowedCollector,
          feederGatewayCollector,
          logger
        )
      } else {
        const spotValidiumStateTransitionCollector =
          new SpotValidiumStateTransitionCollector(
            ethereumClient,
            stateTransitionRepository,
            config.starkex.contracts.perpetual
          )
        stateTransitionCollector = spotValidiumStateTransitionCollector
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
        stateUpdater = spotValidiumUpdater

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
      const perpetualRollupStateTransitionCollector =
        new PerpetualRollupStateTransitionCollector(
          ethereumClient,
          stateTransitionRepository,
          config.starkex.contracts.perpetual
        )
      stateTransitionCollector = perpetualRollupStateTransitionCollector
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
      stateUpdater = perpetualRollupUpdater
      syncService = new PerpetualRollupSyncService(
        verifierCollector,
        pageMappingCollector,
        pageCollector,
        perpetualRollupStateTransitionCollector,
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

    const assetDetailsService = new AssetDetailsService(
      assetRepository,
      config.starkex.tradingMode
    )

    const userTransactionMigrator = new UserTransactionMigrator(
      database,
      softwareMigrationRepository,
      syncStatusRepository,
      userTransactionRepository,
      sentTransactionRepository,
      userTransactionCollector,
      ethereumClient,
      collateralAsset,
      logger
    )

    const withdrawableAssetMigrator = new WithdrawableAssetMigrator(
      softwareMigrationRepository,
      syncStatusRepository,
      withdrawableAssetRepository,
      withdrawalAllowedCollector,
      userTransactionCollector,
      logger
    )

    const stateUpdateWithBatchIdMigrator = new StateUpdateWithBatchIdMigrator(
      softwareMigrationRepository,
      stateUpdateRepository,
      syncStatusRepository,
      stateTransitionCollector,
      logger
    )

    const preprocessedStateUpdateRepository =
      new PreprocessedStateUpdateRepository(database, logger)

    const preprocessedStateDetailsRepository =
      new PreprocessedStateDetailsRepository(database, logger)

    const preprocessedUserStatisticsRepository =
      new PreprocessedUserStatisticsRepository(database, logger)

    let preprocessor: Preprocessor<AssetHash> | Preprocessor<AssetId>
    const isPreprocessorEnabled = config.enablePreprocessing

    let preprocessedAssetHistoryRepository
    let forcedTradeOfferController: ForcedTradeOfferController | undefined
    if (config.starkex.tradingMode === 'perpetual') {
      forcedTradeOfferController = new ForcedTradeOfferController(
        pageContextService,
        forcedTradeOfferRepository,
        positionRepository,
        userRegistrationEventRepository,
        config.starkex.collateralAsset,
        config.starkex.contracts.perpetual
      )
      preprocessedAssetHistoryRepository =
        new PreprocessedAssetHistoryRepository(database, AssetId, logger)

      const perpetualHistoryPreprocessor = new PerpetualHistoryPreprocessor(
        config.starkex.collateralAsset,
        preprocessedAssetHistoryRepository,
        stateUpdateRepository,
        positionRepository,
        logger
      )

      const stateDetailsPreprocessor = new StateDetailsPreprocessor(
        preprocessedStateDetailsRepository,
        preprocessedAssetHistoryRepository,
        userTransactionRepository,
        logger
      )

      const userStatisticsPreprocessor = new UserStatisticsPreprocessor(
        preprocessedUserStatisticsRepository,
        preprocessedAssetHistoryRepository,
        preprocessedStateUpdateRepository,
        stateUpdateRepository,
        kvStore,
        logger
      )

      preprocessor = new Preprocessor(
        preprocessedStateUpdateRepository,
        syncStatusRepository,
        stateUpdateRepository,
        perpetualHistoryPreprocessor,
        stateDetailsPreprocessor,
        userStatisticsPreprocessor,
        logger,
        isPreprocessorEnabled
      )
    } else {
      preprocessedAssetHistoryRepository =
        new PreprocessedAssetHistoryRepository(database, AssetHash, logger)

      const spotHistoryPreprocessor = new SpotHistoryPreprocessor(
        preprocessedAssetHistoryRepository,
        vaultRepository,
        logger
      )

      const stateDetailsPreprocessor = new StateDetailsPreprocessor(
        preprocessedStateDetailsRepository,
        preprocessedAssetHistoryRepository,
        userTransactionRepository,
        logger
      )

      const userStatisticsPreprocessor = new UserStatisticsPreprocessor(
        preprocessedUserStatisticsRepository,
        preprocessedAssetHistoryRepository,
        preprocessedStateUpdateRepository,
        stateUpdateRepository,
        kvStore,
        logger
      )

      preprocessor = new Preprocessor(
        preprocessedStateUpdateRepository,
        syncStatusRepository,
        stateUpdateRepository,
        spotHistoryPreprocessor,
        stateDetailsPreprocessor,
        userStatisticsPreprocessor,
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
    const homeController = new HomeController(
      pageContextService,
      assetDetailsService,
      forcedTradeOfferViewService,
      userTransactionRepository,
      forcedTradeOfferRepository,
      preprocessedStateDetailsRepository
    )

    const userController = new UserController(
      pageContextService,
      assetDetailsService,
      preprocessedAssetHistoryRepository,
      sentTransactionRepository,
      userTransactionRepository,
      forcedTradeOfferRepository,
      userRegistrationEventRepository,
      forcedTradeOfferViewService,
      withdrawableAssetRepository,
      preprocessedUserStatisticsRepository,
      config.starkex.contracts.perpetual,
      collateralAsset
    )
    const stateUpdateController = new StateUpdateController(
      pageContextService,
      assetDetailsService,
      stateUpdateRepository,
      userTransactionRepository,
      preprocessedAssetHistoryRepository
    )
    const transactionController = new TransactionController(
      pageContextService,
      sentTransactionRepository,
      forcedTradeOfferRepository,
      userTransactionRepository,
      userRegistrationEventRepository,
      assetRepository
    )
    const merkleProofController = new MerkleProofController(
      pageContextService,
      stateUpdater
    )

    const searchController = new SearchController(
      stateUpdateRepository,
      config.starkex.tradingMode === 'perpetual'
        ? positionRepository
        : vaultRepository,
      userRegistrationEventRepository,
      preprocessedAssetHistoryRepository
    )

    const userTransactionController = new TransactionSubmitController(
      ethereumClient,
      sentTransactionRepository,
      forcedTradeOfferRepository,
      config.starkex.contracts.perpetual,
      collateralAsset
    )
    const forcedActionsController = new ForcedActionController(
      pageContextService,
      preprocessedAssetHistoryRepository,
      assetRepository,
      config.starkex.contracts.perpetual
    )

    const apiServer = new ApiServer(config.port, logger, {
      routers: [
        createStatusRouter(statusService),
        createFrontendRouter(
          homeController,
          userController,
          stateUpdateController,
          transactionController,
          forcedActionsController,
          forcedTradeOfferController,
          merkleProofController,
          collateralAsset,
          config.starkex.tradingMode,
          searchController
        ),
        createTransactionRouter(
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
      await preprocessor.catchUp()

      await ethereumClient.assertChainId(config.starkex.blockchain.chainId)

      await userTransactionMigrator.migrate()
      await withdrawableAssetMigrator.migrate()
      await stateUpdateWithBatchIdMigrator.migrate()
      await stateUpdater.initTree()

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
