import { decodeAssetId } from '@explorer/encoding'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'

import { BlockRange } from '../../model/BlockRange'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import {
  LogForcedTradeRequest,
  LogForcedWithdrawalRequest,
  LogWithdrawalPerformed,
} from './events'

export class UserTransactionCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly perpetualAddress: EthereumAddress
  ) {}

  async collect(blockRange: BlockRange) {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetualAddress.toString(),
      topics: [
        [
          LogWithdrawalPerformed.topic,
          LogForcedWithdrawalRequest.topic,
          LogForcedTradeRequest.topic,
        ],
      ],
    })
    return Promise.all(
      logs.map(async (log) => {
        const event =
          LogWithdrawalPerformed.safeParseLog(log) ??
          LogForcedWithdrawalRequest.safeParseLog(log) ??
          LogForcedTradeRequest.parseLog(log)

        const block = await this.ethereumClient.getBlock(log.blockNumber)
        const base = {
          blockNumber: log.blockNumber,
          transactionHash: Hash256(log.transactionHash),
          timestamp: Timestamp.fromSeconds(block.timestamp),
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
                collateralAssetId: decodeAssetId(event.args.collateralAssetId),
                syntheticAmount: event.args.syntheticAmount.toBigInt(),
                syntheticAssetId: decodeAssetId(event.args.syntheticAssetId),
                isABuyingSynthetic: event.args.isABuyingSynthetic,
                nonce: event.args.nonce.toBigInt(),
              },
            })
        }
      })
    )
  }

  async discardAfter(blockNumber: number) {
    await this.userTransactionRepository.deleteAfter(blockNumber)
  }
}
