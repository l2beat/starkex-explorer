import { decodeAssetId } from '@explorer/encoding'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { utils } from 'ethers'

import { BlockRange } from '../model/BlockRange'
import {
  FinalizeExitAction,
  ForcedTransactionsRepository,
} from '../peripherals/database/ForcedTransactionsRepository'
import { TransactionStatusRepository } from '../peripherals/database/TransactionStatusRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { getTransactionStatus } from './getForcedTransactionStatus'

export const PERPETUAL_ABI = new utils.Interface([
  `event LogWithdrawalPerformed(
    uint256 starkKey,
    uint256 assetType,
    uint256 nonQuantizedAmount,
    uint256 quantizedAmount,
    address recipient
);`,
])

export const LogWithdrawalPerformed = PERPETUAL_ABI.getEventTopic(
  'LogWithdrawalPerformed'
)

type MinedTransaction = {
  hash: Hash256
  data: FinalizeExitAction
  blockNumber: number
  minedAt: Timestamp
}

export class FinalizeExitEventsCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly forcedTransactionsRepository: ForcedTransactionsRepository,
    private readonly transactionStatusRepository: TransactionStatusRepository,
    private readonly perpetualAddress: EthereumAddress
  ) {}

  async collect(
    blockRange: BlockRange
  ): Promise<{ added: number; updated: number; ignored: number }> {
    const minedFinalizes = await this.getMinedFinalizes(blockRange)
    const results = await Promise.all(
      minedFinalizes.map(async ({ hash, data, minedAt, blockNumber }) => {
        const connectedExit =
          await this.forcedTransactionsRepository.findByFinalizeHash(hash)

        if (
          connectedExit &&
          getTransactionStatus(connectedExit) === 'finalize sent'
        ) {
          await this.transactionStatusRepository.updateIfWaitingToBeMined({
            hash,
            mined: {
              blockNumber,
              at: minedAt,
            },
          })
          return 'updated'
        }

        if (connectedExit) {
          // This should never happen
          return 'ignored'
        }

        const disconnectedExit =
          await this.forcedTransactionsRepository.findWithdrawalForFinalize(
            data.starkKey,
            minedAt
          )

        if (!disconnectedExit) {
          // Someone did a regular withdraw that wasn't for a forced exit
          return 'ignored'
        }

        await this.forcedTransactionsRepository.saveFinalize(
          disconnectedExit.hash,
          hash,
          null,
          minedAt,
          blockNumber
        )
        return 'added'
      })
    )
    return results.reduce(
      (acc, result) => ({ ...acc, [result]: acc[result] + 1 }),
      { added: 0, updated: 0, ignored: 0 }
    )
  }

  private async getMinedFinalizes(
    blockRange: BlockRange
  ): Promise<MinedTransaction[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetualAddress.toString(),
      topics: [[LogWithdrawalPerformed]],
    })
    return Promise.all(
      logs.map(async (log) => {
        const event = PERPETUAL_ABI.parseLog(log)
        const blockNumber = log.blockNumber
        const block = await this.ethereumClient.getBlock(blockNumber)
        const hash = Hash256(log.transactionHash)
        const minedAt = Timestamp.fromSeconds(block.timestamp)

        return {
          blockNumber,
          hash,
          minedAt,
          data: {
            starkKey: StarkKey.from(event.args.starkKey),
            assetType: decodeAssetId(
              event.args.assetType.toHexString().slice(2)
            ),
            nonQuantizedAmount: BigInt(event.args.nonQuantizedAmount),
            quantizedAmount: BigInt(event.args.quantizedAmount),
            recipient: EthereumAddress(event.args.recipient),
          },
        }
      })
    )
  }
}
