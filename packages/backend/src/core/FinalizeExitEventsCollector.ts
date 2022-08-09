import { decodeAssetId } from '@explorer/encoding'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { utils } from 'ethers'

import { BlockRange } from '../model/BlockRange'
import {
  FinalizeExitAction,
  ForcedTransactionsRepository,
} from '../peripherals/database/ForcedTransactionsRepository'
import { SyncStatusRepository } from '../peripherals/database/SyncStatusRepository'
import { TransactionStatusRepository } from '../peripherals/database/TransactionStatusRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { Logger } from '../tools/Logger'
import { getTransactionStatus } from './getForcedTransactionStatus'

export const PERPETUAL_ABI = new utils.Interface([
  `event LogWithdrawalPerformed(
    uint256 starkKey,
    uint256 assetType,
    uint256 nonQuantizedAmount,
    uint256 quantizedAmount,
    address recipient
)`,
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
    // used only to sync finalized backwards
    private readonly syncStatusRepository: SyncStatusRepository,
    // used only to sync finalized backwards
    private readonly logger: Logger,
    private readonly perpetualAddress: EthereumAddress
  ) {}

  async collect(
    blockRange: BlockRange
  ): Promise<{ added: number; updated: number; ignored: number }> {
    const minedFinalizes = await this.getMinedFinalizes(blockRange)
    const results = await Promise.all(
      minedFinalizes.map(async (finalize, i, array) => {
        let previousFinalizeMinedAt =
          (await this.forcedTransactionsRepository.findLatestFinalize()) ??
          Timestamp(0)

        if (i > 0) {
          previousFinalizeMinedAt = array[i - 1].minedAt
        }

        return await this.processFinalizes(finalize, previousFinalizeMinedAt)
      })
    )

    return results.reduce(
      (acc, result) => ({ ...acc, [result]: acc[result] + 1 }),
      { added: 0, updated: 0, ignored: 0 }
    )
  }

  private async processFinalizes(
    { hash, data, minedAt, blockNumber }: MinedTransaction,
    previousWithdrawMinedAt: Timestamp
  ) {
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

    const disconnectedExits =
      await this.forcedTransactionsRepository.getWithdrawalsForFinalize(
        data.starkKey,
        minedAt,
        previousWithdrawMinedAt
      )

    if (disconnectedExits.length === 0) {
      // Someone did a regular withdraw that wasn't for a forced exit
      return 'ignored'
    }

    await Promise.all(
      disconnectedExits.map((exit) =>
        this.forcedTransactionsRepository.saveFinalize(
          exit.hash,
          hash,
          null,
          minedAt,
          blockNumber
        )
      )
    )

    return 'added'
  }

  // used only to sync finalized backwards
  // #region sync-backwards
  private syncExecuted = false
  async oneTimeSync() {
    if (this.syncExecuted) {
      return
    }

    const firstSyncedBlock = await this.syncStatusRepository.getLastSynced()
    if (!firstSyncedBlock || firstSyncedBlock < 14878490) {
      return
    }

    const ranges = [
      { start: 11834295, end: 13422633 },
      { start: 13422634, end: 14878489 },
      { start: 14878490, end: firstSyncedBlock },
    ]

    const blockRanges = ranges.map(
      ({ start, end }) => new BlockRange([], start, end)
    )

    const logs = (
      await Promise.all(blockRanges.map((range) => this.getLogs(range)))
    ).flat()

    const exitedStarkKeys =
      await this.forcedTransactionsRepository.getExitedStarkKeys()

    const transactions = logs.map((log) => {
      const event = PERPETUAL_ABI.parseLog(log)
      return {
        blockNumber: log.blockNumber,
        hash: Hash256(log.transactionHash),
        data: {
          starkKey: StarkKey.from(event.args.starkKey),
          assetType: decodeAssetId(event.args.assetType.toHexString().slice(2)),
          nonQuantizedAmount: BigInt(event.args.nonQuantizedAmount),
          quantizedAmount: BigInt(event.args.quantizedAmount),
          recipient: EthereumAddress(event.args.recipient),
        },
      }
    })

    const filteredTxs = transactions.filter((tx) =>
      exitedStarkKeys.some((exited) => exited === tx.data.starkKey)
    )

    const minedFinalizes: MinedTransaction[] = await Promise.all(
      filteredTxs.map(async (tx) => {
        const block = await this.ethereumClient.getBlock(tx.blockNumber)
        return {
          minedAt: Timestamp.fromSeconds(block.timestamp),
          ...tx,
        }
      })
    )

    const results = await Promise.all(
      minedFinalizes.map(async (finalize, i, array) => {
        let previousFinalizeMinedAt = Timestamp(0)
        if (i > 0) {
          previousFinalizeMinedAt = array[i - 1].minedAt
        }

        return await this.processFinalizes(finalize, previousFinalizeMinedAt)
      })
    )

    this.syncExecuted = true
    this.logger.info({
      method: 'oneTimeSync',
      results: results.reduce(
        (acc, result) => ({ ...acc, [result]: acc[result] + 1 }),
        { added: 0, updated: 0, ignored: 0 }
      ),
    })
    return
  }
  // #endregion sync-backwards

  private async getMinedFinalizes(
    blockRange: BlockRange
  ): Promise<MinedTransaction[]> {
    const logs = await this.getLogs(blockRange)
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

  private async getLogs(blockRange: BlockRange) {
    return await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetualAddress.toString(),
      topics: [[LogWithdrawalPerformed]],
    })
  }
}
