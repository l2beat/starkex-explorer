import { decodeAssetId } from '@explorer/encoding'
import {
  assertUnreachable,
  CollateralAsset,
  getCollateralAssetIdFromHash,
} from '@explorer/shared'
import {
  AssetHash,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { providers } from 'ethers'

import { BlockRange } from '../../model/BlockRange'
import {
  MintWithdrawData,
  WithdrawalPerformedData,
  WithdrawWithTokenIdData,
} from '../../peripherals/database/transactions/UserTransaction'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { WithdrawableAssetRepository } from '../../peripherals/database/WithdrawableAssetRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import {
  LogForcedTradeRequest,
  LogForcedWithdrawalRequest,
  LogFullWithdrawalRequest,
  LogMintWithdrawalPerformed,
  LogWithdrawalPerformed,
  LogWithdrawalWithTokenIdPerformed,
} from './events'

export class UserTransactionCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly withdrawableAssetRepository: WithdrawableAssetRepository,
    private readonly perpetualAddress: EthereumAddress,
    private readonly collateralAsset?: CollateralAsset
  ) {}

  async collect(
    blockRange: BlockRange,
    knownBlockTimestamps?: Map<number, number>
  ) {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetualAddress.toString(),
      topics: [
        [
          // Forced Actions:
          LogForcedWithdrawalRequest.topic,
          LogForcedTradeRequest.topic,
          LogFullWithdrawalRequest.topic,

          // Assets being withdrawn from L2:
          LogWithdrawalPerformed.topic,
          LogWithdrawalWithTokenIdPerformed.topic,
          LogMintWithdrawalPerformed.topic,
        ],
      ],
    })

    // we need to batch because of UserTransactionMigrator that collects all logs at once
    const batches = toBatches(logs, 20)

    for (const batch of batches) {
      await Promise.all(
        batch.map((log) => this.processLog(log, knownBlockTimestamps))
      )
    }
  }

  private async processLog(
    log: providers.Log,
    knownBlockTimestamps?: Map<number, number>
  ) {
    const event =
      LogForcedWithdrawalRequest.safeParseLog(log) ??
      LogFullWithdrawalRequest.safeParseLog(log) ??
      LogForcedTradeRequest.safeParseLog(log) ??
      LogWithdrawalPerformed.safeParseLog(log) ??
      LogWithdrawalWithTokenIdPerformed.safeParseLog(log) ??
      LogMintWithdrawalPerformed.parseLog(log)

    const timestamp =
      knownBlockTimestamps?.get(log.blockNumber) ??
      (await this.ethereumClient.getBlockTimestamp(log.blockNumber))
    const base = {
      blockNumber: log.blockNumber,
      transactionHash: Hash256(log.transactionHash),
      timestamp: Timestamp.fromSeconds(timestamp),
    }

    let record
    switch (event.name) {
      case 'LogForcedWithdrawalRequest':
        return this.userTransactionRepository.add({
          ...base,
          data: {
            type: 'ForcedWithdrawal',
            starkKey: StarkKey.from(event.args.starkKey),
            positionId: event.args.positionId.toBigInt(),
            quantizedAmount: event.args.quantizedAmount.toBigInt(),
          },
        })
      case 'LogFullWithdrawalRequest':
        return this.userTransactionRepository.add({
          ...base,
          data: {
            type: 'FullWithdrawal',
            starkKey: StarkKey.from(event.args.starkKey),
            vaultId: event.args.vaultId.toBigInt(),
          },
        })
      case 'LogForcedTradeRequest':
        if (this.collateralAsset === undefined) {
          throw new Error('Collateral asset is not configured')
        }
        console.log('LogForcedTradeRequest', event.args.collateralAssetId)

        return this.userTransactionRepository.add({
          ...base,
          data: {
            type: 'ForcedTrade',
            starkKeyA: StarkKey.from(event.args.starkKeyA),
            starkKeyB: StarkKey.from(event.args.starkKeyB),
            positionIdA: event.args.positionIdA.toBigInt(),
            positionIdB: event.args.positionIdB.toBigInt(),
            collateralAmount: event.args.collateralAmount.toBigInt(),
            collateralAssetId: getCollateralAssetIdFromHash(
              event.args.collateralAssetId.toHexString(),
              this.collateralAsset
            ),
            syntheticAmount: event.args.syntheticAmount.toBigInt(),
            syntheticAssetId: decodeAssetId(event.args.syntheticAssetId),
            isABuyingSynthetic: event.args.isABuyingSynthetic,
            nonce: event.args.nonce.toBigInt(),
          },
        })
      case 'LogWithdrawalPerformed':
        record = {
          ...base,
          data: {
            type: 'Withdraw',
            starkKey: StarkKey.from(event.args.starkKey),
            assetType: AssetHash.from(event.args.assetType),
            nonQuantizedAmount: event.args.nonQuantizedAmount.toBigInt(),
            quantizedAmount: event.args.quantizedAmount.toBigInt(),
            recipient: EthereumAddress(event.args.recipient),
          } as WithdrawalPerformedData,
        }
        await this.withdrawableAssetRepository.add(record)
        return this.userTransactionRepository.add(record)
      case 'LogWithdrawalWithTokenIdPerformed':
        record = {
          ...base,
          data: {
            type: 'WithdrawWithTokenId',
            starkKey: StarkKey.from(event.args.starkKey),
            assetType: AssetHash.from(event.args.assetType),
            tokenId: event.args.tokenId.toBigInt(),
            assetId: AssetHash.from(event.args.assetId),
            nonQuantizedAmount: event.args.nonQuantizedAmount.toBigInt(),
            quantizedAmount: event.args.quantizedAmount.toBigInt(),
            recipient: EthereumAddress(event.args.recipient),
          } as WithdrawWithTokenIdData,
        }
        await this.withdrawableAssetRepository.add(record)
        return this.userTransactionRepository.add(record)
      case 'LogMintWithdrawalPerformed':
        record = {
          ...base,
          data: {
            type: 'MintWithdraw',
            starkKey: StarkKey.from(event.args.starkKey),
            assetType: AssetHash.from(event.args.assetType),
            nonQuantizedAmount: event.args.nonQuantizedAmount.toBigInt(),
            quantizedAmount: event.args.quantizedAmount.toBigInt(),
            assetId: AssetHash.from(event.args.assetId),
          } as MintWithdrawData,
        }
        await this.withdrawableAssetRepository.add(record)
        return this.userTransactionRepository.add(record)
      default:
        assertUnreachable(event)
    }
  }

  async discardAfter(blockNumber: number) {
    await this.userTransactionRepository.deleteAfter(blockNumber)
  }
}

function toBatches<T>(array: T[], batchSize: number) {
  const batches: T[][] = []
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize))
  }
  return batches
}
