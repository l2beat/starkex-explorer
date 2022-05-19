import { decodeAssetId, ForcedAction } from '@explorer/encoding'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { utils } from 'ethers'

import { BlockRange } from '../model/BlockRange'
import { ForcedTransactionsRepository } from '../peripherals/database/ForcedTransactionsRepository'
import { TransactionStatusRepository } from '../peripherals/database/TransactionStatusRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { getTransactionStatus } from './getForcedTransactionStatus'

const PERPETUAL_ABI = new utils.Interface([
  'event LogForcedWithdrawalRequest(uint256 starkKey, uint256 vaultId, uint256 quantizedAmount)',
  `event LogForcedTradeRequest(
    uint256 starkKeyA,
    uint256 starkKeyB,
    uint256 vaultIdA,
    uint256 vaultIdB,
    uint256 collateralAssetId,
    uint256 syntheticAssetId,
    uint256 amountCollateral,
    uint256 amountSynthetic,
    bool aIsBuyingSynthetic,
    uint256 nonce
  )`,
])

const LogForcedWithdrawalRequest = PERPETUAL_ABI.getEventTopic(
  'LogForcedWithdrawalRequest'
)
const LogForcedTradeRequest = PERPETUAL_ABI.getEventTopic(
  'LogForcedTradeRequest'
)

type MinedTransaction = {
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
      _getMinedTransactions || this.getMinedTransactions
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

        switch (event.name) {
          case 'LogForcedTradeRequest':
            return {
              ...base,
              data: {
                type: 'trade',
                publicKeyA: StarkKey.from(event.args.starkKeyA),
                publicKeyB: StarkKey.from(event.args.starkKeyB),
                positionIdA: BigInt(event.args.vaultIdA),
                positionIdB: BigInt(event.args.vaultIdB),
                syntheticAssetId: decodeAssetId(
                  event.args.syntheticAssetId.toHexString().slice(2)
                ),
                isABuyingSynthetic: event.args.aIsBuyingSynthetic,
                collateralAmount: BigInt(event.args.amountCollateral),
                syntheticAmount: BigInt(event.args.amountSynthetic),
                nonce: BigInt(event.args.nonce),
              },
            }
          case 'LogForcedWithdrawalRequest':
            return {
              ...base,
              data: {
                type: 'withdrawal',
                publicKey: StarkKey.from(event.args.starkKey),
                positionId: BigInt(event.args.vaultId),
                amount: BigInt(event.args.quantizedAmount),
              },
            }
          default:
            throw new Error('Unknown event!')
        }
      })
    )
  }
}
