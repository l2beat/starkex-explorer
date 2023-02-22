import {
  AssetHash,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { providers } from 'ethers'

import { BlockRange } from '../../model/BlockRange'
import { WithdrawableAssetRepository } from '../../peripherals/database/WithdrawableAssetRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { assertUnreachable } from '../../utils/assertUnreachable'
import {
  LogAssetWithdrawalAllowed,
  LogMintableWithdrawalAllowed,
  LogMintWithdrawalPerformed,
  LogWithdrawalAllowed,
  LogWithdrawalPerformed,
  LogWithdrawalWithTokenIdPerformed,
} from './events'

export class WithdrawableAssetCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly withdrawableAssetRepository: WithdrawableAssetRepository,
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
          // Assets being moved to withdrawal area:
          LogWithdrawalAllowed.topic,
          LogMintableWithdrawalAllowed.topic,
          LogAssetWithdrawalAllowed.topic,

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
      LogWithdrawalAllowed.safeParseLog(log) ??
      LogMintableWithdrawalAllowed.safeParseLog(log) ??
      LogAssetWithdrawalAllowed.safeParseLog(log) ??
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

    switch (event.name) {
      case 'LogWithdrawalAllowed':
        return this.withdrawableAssetRepository.add({
          ...base,
          data: {
            event: 'LogWithdrawalAllowed',
            starkKey: StarkKey.from(event.args.starkKey),
            assetType: AssetHash.from(event.args.assetType),
            nonQuantizedAmount: event.args.nonQuantizedAmount.toBigInt(),
            quantizedAmount: event.args.quantizedAmount.toBigInt(),
          },
        })
      case 'LogMintableWithdrawalAllowed':
        return this.withdrawableAssetRepository.add({
          ...base,
          data: {
            event: 'LogMintableWithdrawalAllowed',
            starkKey: StarkKey.from(event.args.starkKey),
            assetId: AssetHash.from(event.args.assetId),
            quantizedAmount: event.args.quantizedAmount.toBigInt(),
          },
        })
      case 'LogAssetWithdrawalAllowed':
        return this.withdrawableAssetRepository.add({
          ...base,
          data: {
            event: 'LogAssetWithdrawalAllowed',
            starkKey: StarkKey.from(event.args.starkKey),
            assetId: AssetHash.from(event.args.assetId),
            quantizedAmount: event.args.quantizedAmount.toBigInt(),
          },
        })
      case 'LogWithdrawalPerformed':
        return this.withdrawableAssetRepository.add({
          ...base,
          data: {
            event: 'LogWithdrawalPerformed',
            starkKey: StarkKey.from(event.args.starkKey),
            assetType: AssetHash.from(event.args.assetType),
            nonQuantizedAmount: event.args.nonQuantizedAmount.toBigInt(),
            quantizedAmount: event.args.quantizedAmount.toBigInt(),
            recipient: EthereumAddress(event.args.recipient),
          },
        })
      case 'LogWithdrawalWithTokenIdPerformed':
        return this.withdrawableAssetRepository.add({
          ...base,
          data: {
            event: 'LogWithdrawalWithTokenIdPerformed',
            starkKey: StarkKey.from(event.args.starkKey),
            assetType: AssetHash.from(event.args.assetType),
            tokenId: event.args.tokenId.toBigInt(),
            assetId: AssetHash.from(event.args.assetId),
            nonQuantizedAmount: event.args.nonQuantizedAmount.toBigInt(),
            quantizedAmount: event.args.quantizedAmount.toBigInt(),
            recipient: EthereumAddress(event.args.recipient),
          },
        })
      case 'LogMintWithdrawalPerformed':
        return this.withdrawableAssetRepository.add({
          ...base,
          data: {
            event: 'LogMintWithdrawalPerformed',
            starkKey: StarkKey.from(event.args.starkKey),
            assetType: AssetHash.from(event.args.assetType),
            nonQuantizedAmount: event.args.nonQuantizedAmount.toBigInt(),
            quantizedAmount: event.args.quantizedAmount.toBigInt(),
            assetId: AssetHash.from(event.args.assetId),
          },
        })
      default:
        assertUnreachable(event)
    }
  }

  async discardAfter(blockNumber: number) {
    await this.withdrawableAssetRepository.deleteAfter(blockNumber)
  }
}

function toBatches<T>(array: T[], batchSize: number) {
  const batches: T[][] = []
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize))
  }
  return batches
}
