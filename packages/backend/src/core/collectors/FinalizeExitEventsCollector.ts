import { decodeAssetId } from '@explorer/encoding'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'

import { BlockRange } from '../../model/BlockRange'
import {
  FinalizeExitAction,
  ForcedTransactionsRepository,
} from '../../peripherals/database/ForcedTransactionsRepository'
import { TransactionStatusRepository } from '../../peripherals/database/TransactionStatusRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { getTransactionStatus } from '../getForcedTransactionStatus'
import { LogWithdrawalPerformed } from './events'

interface MinedTransaction {
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
      minedFinalizes.map(async (finalize, i, array) => {
        let previousFinalizeMinedAt =
          (await this.forcedTransactionsRepository.findLatestFinalize()) ??
          Timestamp(0)

        if (i > 0) {
          previousFinalizeMinedAt = array[i - 1]?.minedAt ?? Timestamp(0)
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

  private async getMinedFinalizes(
    blockRange: BlockRange
  ): Promise<MinedTransaction[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetualAddress.toString(),
      topics: [[LogWithdrawalPerformed.topic]],
    })

    return Promise.all(
      logs.map(async (log) => {
        const event = LogWithdrawalPerformed.parseLog(log)
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
            nonQuantizedAmount: event.args.nonQuantizedAmount.toBigInt(),
            quantizedAmount: event.args.quantizedAmount.toBigInt(),
            recipient: EthereumAddress(event.args.recipient),
          },
        }
      })
    )
  }
}
