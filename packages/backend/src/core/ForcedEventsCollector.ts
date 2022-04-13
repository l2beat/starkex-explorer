import { decodeAssetId } from '@explorer/encoding'
import { Timestamp } from '@explorer/types'
import { utils } from 'ethers'

import { BlockRange } from '../model/BlockRange'
import {
  ForcedTransactionsRepository,
  TransactionEventRecordCandidate,
} from '../peripherals/database/ForcedTransactionsRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'

const PERPETUAL_ADDRESS = '0xD54f502e184B6B739d7D27a6410a67dc462D69c8'
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

export class ForcedEventsCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly forcedTransactionsRepository: ForcedTransactionsRepository
  ) {}

  async collect(
    blockRange: BlockRange
  ): Promise<TransactionEventRecordCandidate[]> {
    const events = await this.getEvents(blockRange)
    await this.forcedTransactionsRepository.addEvents(events)
    return events
  }

  private async getEvents(
    blockRange: BlockRange
  ): Promise<TransactionEventRecordCandidate[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: PERPETUAL_ADDRESS,
      topics: [[LogForcedTradeRequest, LogForcedWithdrawalRequest]],
    })
    return Promise.all(
      logs.map(async (log) => {
        const event = PERPETUAL_ABI.parseLog(log)
        const block = await this.ethereumClient.getBlock(log.blockNumber)

        switch (event.name) {
          case 'LogForcedTradeRequest':
            return {
              transactionType: 'trade' as const,
              eventType: 'mined' as const,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              publicKeyA: event.args.starkKeyA.toHexString(),
              publicKeyB: event.args.starkKeyB.toHexString(),
              positionIdA: BigInt(event.args.vaultIdA),
              positionIdB: BigInt(event.args.vaultIdB),
              syntheticAssetId: decodeAssetId(
                event.args.syntheticAssetId.toHexString().slice(2)
              ),
              isABuyingSynthetic: event.args.aIsBuyingSynthetic,
              collateralAmount: BigInt(event.args.amountCollateral),
              syntheticAmount: BigInt(event.args.amountSynthetic),
              timestamp: Timestamp.fromSeconds(block.timestamp),
            }
          case 'LogForcedWithdrawalRequest':
            return {
              transactionType: 'withdrawal' as const,
              eventType: 'mined' as const,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              publicKey: event.args.starkKey.toHexString(),
              positionId: BigInt(event.args.vaultId),
              amount: BigInt(event.args.quantizedAmount),
              timestamp: Timestamp.fromSeconds(block.timestamp),
            }
          default:
            throw new Error('Unknown event!')
        }
      })
    )
  }

  async discardAfter(blockNumber: number): Promise<void> {
    await this.forcedTransactionsRepository.discardAfter(blockNumber)
  }
}
