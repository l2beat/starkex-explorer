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

const PERPETUAL_ABI = new utils.Interface([
  `event LogWithdrawalPerformed(
    uint256 starkKey,
    uint256 assetType,
    uint256 nonQuantizedAmount,
    uint256 quantizedAmount,
    address recipient
);`,
])

const LogWithdrawalPerformed = PERPETUAL_ABI.getEventTopic(
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
    private readonly perpetualAddress: EthereumAddress,
    readonly _getMinedTransactions?: (
      blockRange: BlockRange
    ) => Promise<MinedTransaction[]>
  ) {
    this.getMinedTransactions =
      _getMinedTransactions || this.getMinedTransactions
  }

  async collect(
    blockRange: BlockRange
  ): Promise<{ added: number; updated: number; ignored: number }> {
    const transactions = await this.getMinedTransactions(blockRange)
    const results = await Promise.all(
      transactions.map(async ({ hash, data, minedAt, blockNumber }) => {
        const transaction =
          await this.forcedTransactionsRepository.findByFinalizeHash(hash)

        if (transaction && getTransactionStatus(transaction) === 'sent') {
          await this.transactionStatusRepository.updateIfWaitingToBeMined({
            hash,
            mined: {
              blockNumber,
              at: minedAt,
            },
          })
          return 'updated'
        }

        if (transaction) {
          return 'ignored'
        }

        const exitTransaction =
          await this.forcedTransactionsRepository.findByFinalizeData(data)

        if (!exitTransaction) {
          return 'ignored'
        }

        await this.forcedTransactionsRepository.saveFinalize(
          exitTransaction.hash,
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

  private async getMinedTransactions(
    blockRange: BlockRange
  ): Promise<MinedTransaction[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetualAddress.toString(),
      topics: [[LogWithdrawalPerformed]],
    })
    return Promise.all(
      logs.map(async (log) => {
        const event = PERPETUAL_ABI.parseLog(log)
        const block = await this.ethereumClient.getBlock(log.blockNumber)
        const blockNumber = log.blockNumber
        const hash = Hash256(log.transactionHash)
        const minedAt = Timestamp.fromSeconds(block.timestamp)
        const base = { hash, blockNumber, minedAt }

        return {
          ...base,
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
