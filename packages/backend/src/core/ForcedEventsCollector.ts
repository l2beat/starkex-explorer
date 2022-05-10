import { decodeAssetId } from '@explorer/encoding'
import { Hash256, Timestamp } from '@explorer/types'
import { utils } from 'ethers'

import { BlockRange } from '../model/BlockRange'
import {
  EventRecordCandidate,
  ForcedTransactionsRepository,
} from '../peripherals/database/ForcedTransactionsRepository'
import { PERPETUAL_ADDRESS } from '../peripherals/ethereum/addresses'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'

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

  async collect(blockRange: BlockRange): Promise<EventRecordCandidate[]> {
    const events = await this.getEvents(blockRange)
    await this.forcedTransactionsRepository.addEvents(events)
    return events
  }

  private async getEvents(
    blockRange: BlockRange
  ): Promise<EventRecordCandidate[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: PERPETUAL_ADDRESS,
      topics: [[LogForcedTradeRequest, LogForcedWithdrawalRequest]],
    })
    return Promise.all(
      logs.map(async (log) => {
        const event = PERPETUAL_ABI.parseLog(log)
        const block = await this.ethereumClient.getBlock(log.blockNumber)
        const blockNumber = log.blockNumber
        const transactionHash = Hash256(log.transactionHash)
        const timestamp = Timestamp.fromSeconds(block.timestamp)

        switch (event.name) {
          case 'LogForcedTradeRequest':
            return {
              transactionType: 'trade' as const,
              eventType: 'mined' as const,
              blockNumber,
              transactionHash,
              timestamp,
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
              nonce: BigInt(event.args.nonce),
            }
          case 'LogForcedWithdrawalRequest':
            return {
              transactionType: 'withdrawal' as const,
              eventType: 'mined' as const,
              blockNumber,
              transactionHash,
              timestamp,
              publicKey: event.args.starkKey.toHexString(),
              positionId: BigInt(event.args.vaultId),
              amount: BigInt(event.args.quantizedAmount),
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
