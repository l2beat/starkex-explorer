import { decodeAssetId } from '@explorer/encoding'
import {
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { utils } from 'ethers'

import { BlockRange } from '../model/BlockRange'
import { ForcedTransactionsRepository } from '../peripherals/database/ForcedTransactionsRepository'
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

export interface WithdrawalAction {
  starkKey: StarkKey
  assetType: AssetId
  nonQuantizedAmount: bigint
  quantizedAmount: bigint
  recipient: EthereumAddress
}

type MinedTransaction = {
  hash: Hash256
  data: WithdrawalAction
  blockNumber: number
  minedAt: Timestamp
}

export class WithdrawalEventsCollector {
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
      transactions.map(async ({ hash, minedAt, blockNumber }) => {
        const transaction =
          await this.forcedTransactionsRepository.findByFinalizeHash(hash)
        if (!transaction) {
          // TODO: figure out how to find transaction when we didn't track the finalization
          return 'ignored'
        }
        if (getTransactionStatus(transaction) === 'sent') {
          await this.transactionStatusRepository.updateIfWaitingToBeMined({
            hash,
            mined: {
              blockNumber,
              at: minedAt,
            },
          })
          return 'updated'
        }
        return 'ignored'
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

        if (!(event.name === 'LogWithdrawalPerformed')) {
          throw new Error('Unknown event!')
        }

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
