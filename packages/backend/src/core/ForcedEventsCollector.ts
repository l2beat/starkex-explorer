import { decodeAssetId, ForcedAction } from '@explorer/encoding'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { utils } from 'ethers'

import { BlockRange } from '../model/BlockRange'
import { ForcedTransactionsRepository } from '../peripherals/database/ForcedTransactionsRepository'
import { TransactionStatusRepository } from '../peripherals/database/TransactionStatusRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { getTransactionStatus } from './getForcedTransactionStatus'

const PERPETUAL_ABI = new utils.Interface([
  'event LogForcedWithdrawalRequest(uint256 starkKey, uint256 positionId, uint256 quantizedAmount)',
  `event LogForcedTradeRequest(
    uint256 starkKeyA,
    uint256 starkKeyB,
    uint256 positionIdA,
    uint256 positionIdB,
    uint256 collateralAssetId,
    uint256 syntheticAssetId,
    uint256 collateralAmount,
    uint256 syntheticAmount,
    bool isABuyingSynthetic,
    uint256 nonce
  )`,
])

const LogForcedWithdrawalRequest = PERPETUAL_ABI.getEventTopic(
  'LogForcedWithdrawalRequest'
)
const LogForcedTradeRequest = PERPETUAL_ABI.getEventTopic(
  'LogForcedTradeRequest'
)

interface MinedTransaction {
  hash: Hash256
  data: ForcedAction
  blockNumber: number
  minedAt: Timestamp
}

export class ForcedEventsCollector {
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
      // eslint-disable-next-line @typescript-eslint/unbound-method
      _getMinedTransactions ?? this.getMinedTransactions
  }

  async collect(
    blockRange: BlockRange
  ): Promise<{ added: number; updated: number; ignored: number }> {
    const transactions = await this.getMinedTransactions(blockRange)
    const results = await Promise.all(
      transactions.map(async ({ hash, data, minedAt, blockNumber }) => {
        const transaction = await this.forcedTransactionsRepository.findByHash(
          hash
        )
        if (!transaction) {
          await this.forcedTransactionsRepository.add(
            { hash, data },
            null,
            minedAt,
            blockNumber
          )
          return 'added'
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
      topics: [[LogForcedTradeRequest, LogForcedWithdrawalRequest]],
    })
    return Promise.all(
      logs.map(async (log) => {
        const event = PERPETUAL_ABI.parseLog(log)
        const block = await this.ethereumClient.getBlock(log.blockNumber)
        const blockNumber = log.blockNumber
        const hash = Hash256(log.transactionHash)
        const minedAt = Timestamp.fromSeconds(block.timestamp)
        const base = { hash, blockNumber, minedAt }

        /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
        switch (event.name) {
          case 'LogForcedTradeRequest':
            return {
              ...base,
              data: {
                type: 'trade',
                starkKeyA: StarkKey.from(event.args.starkKeyA),
                starkKeyB: StarkKey.from(event.args.starkKeyB),
                positionIdA: BigInt(event.args.positionIdA),
                positionIdB: BigInt(event.args.positionIdB),
                syntheticAssetId: decodeAssetId(
                  event.args.syntheticAssetId.toHexString().slice(2)
                ),
                isABuyingSynthetic: event.args.isABuyingSynthetic,
                collateralAmount: BigInt(event.args.collateralAmount),
                syntheticAmount: BigInt(event.args.syntheticAmount),
                nonce: BigInt(event.args.nonce),
              },
            }
          case 'LogForcedWithdrawalRequest':
            return {
              ...base,
              data: {
                type: 'withdrawal',
                starkKey: StarkKey.from(event.args.starkKey),
                positionId: BigInt(event.args.positionId),
                amount: BigInt(event.args.quantizedAmount),
              },
            }
          default:
            throw new Error('Unknown event!')
        }
        /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
      })
    )
  }
}
