import { decodeAssetId } from '@explorer/encoding'
import {
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { providers } from 'ethers'

import { BlockRange } from '../../model/BlockRange'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import {
  LogForcedTradeRequest,
  LogForcedWithdrawalRequest,
  LogFullWithdrawalRequest,
  LogWithdrawalPerformed,
} from './events'

export class UserTransactionCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly perpetualAddress: EthereumAddress
  ) {}

  async collect(
    blockRange: BlockRange,
    knownBlockTimestamps?: Map<number, number>
  ) {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetualAddress.toString(),
      topics: [
        [
          LogWithdrawalPerformed.topic,
          LogForcedWithdrawalRequest.topic,
          LogForcedTradeRequest.topic,
          LogFullWithdrawalRequest.topic,
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
      LogWithdrawalPerformed.safeParseLog(log) ??
      LogForcedWithdrawalRequest.safeParseLog(log) ??
      LogFullWithdrawalRequest.safeParseLog(log) ??
      LogForcedTradeRequest.parseLog(log)

    const timestamp =
      knownBlockTimestamps?.get(log.blockNumber) ??
      (await this.ethereumClient.getBlockTimestamp(log.blockNumber))
    const base = {
      blockNumber: log.blockNumber,
      transactionHash: Hash256(log.transactionHash),
      timestamp: Timestamp.fromSeconds(timestamp),
    }

    switch (event.name) {
      case 'LogWithdrawalPerformed':
        return this.userTransactionRepository.add({
          ...base,
          data: {
            type: 'Withdraw',
            starkKey: StarkKey.from(event.args.starkKey),
            // TODO: decode and use asset type
            assetType: event.args.assetType.toHexString(),
            nonQuantizedAmount: event.args.nonQuantizedAmount.toBigInt(),
            quantizedAmount: event.args.quantizedAmount.toBigInt(),
            recipient: EthereumAddress(event.args.recipient),
          },
        })
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
        return this.userTransactionRepository.add({
          ...base,
          data: {
            type: 'ForcedTrade',
            starkKeyA: StarkKey.from(event.args.starkKeyA),
            starkKeyB: StarkKey.from(event.args.starkKeyB),
            positionIdA: event.args.positionIdA.toBigInt(),
            positionIdB: event.args.positionIdB.toBigInt(),
            collateralAmount: event.args.collateralAmount.toBigInt(),
            // TODO: respect system native asset type
            collateralAssetId: AssetId.USDC,
            syntheticAmount: event.args.syntheticAmount.toBigInt(),
            syntheticAssetId: decodeAssetId(event.args.syntheticAssetId),
            isABuyingSynthetic: event.args.isABuyingSynthetic,
            nonce: event.args.nonce.toBigInt(),
          },
        })
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
