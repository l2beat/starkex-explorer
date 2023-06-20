import { renderPerpetualL2TransactionDetailsPage } from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'

import { PageContextService } from '../../core/PageContextService'
import {
  AggregatedL2TransactionRecord,
  L2TransactionRepository,
} from '../../peripherals/database/L2TransactionRepository'
import { ControllerResult } from './ControllerResult'

export class L2TransactionController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly l2TransactionRepository: L2TransactionRepository
  ) {}

  async getPerpetualL2TransactionDetailsPage(
    givenUser: Partial<UserDetails>,
    transactionId: number,
    multiIndex?: number,
    altIndex?: number
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    if (context.tradingMode != 'perpetual') {
      return { type: 'not found' }
    }
    const aggregatedL2Transaction =
      await this.l2TransactionRepository.findByTransactionId(transactionId)

    const transaction = this.extractTransactionByMultiAndAltIndex(
      aggregatedL2Transaction,
      multiIndex,
      altIndex
    )

    if (!transaction) {
      return {
        type: 'not found',
        message: `L2 transaction #${transactionId} with given parameters was not found`,
      }
    }

    return {
      type: 'success',
      content: renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: transaction,
        altIndex,
        multiIndex,
      }),
    }
  }

  extractTransactionByMultiAndAltIndex(
    aggregatedL2Transaction: AggregatedL2TransactionRecord | undefined,
    multiIndex: number | undefined,
    altIndex: number | undefined
  ) {
    if (multiIndex !== undefined && altIndex !== undefined) {
      const altTransaction =
        aggregatedL2Transaction?.alternativeTransactions[altIndex]
      if (!altTransaction) {
        return
      }
      if (altTransaction.type !== 'MultiTransaction') {
        return
      }

      const multiTransaction = altTransaction.transactions[multiIndex]
      if (!multiTransaction) {
        return
      }

      return {
        ...aggregatedL2Transaction,
        originalTransaction: multiTransaction,
        alternativeTransactions: [],
      }
    }

    if (multiIndex !== undefined && altIndex === undefined) {
      if (
        aggregatedL2Transaction?.originalTransaction.type !== 'MultiTransaction'
      ) {
        return
      }

      const multiTransaction =
        aggregatedL2Transaction.originalTransaction.transactions[multiIndex]
      if (!multiTransaction) {
        return
      }

      return {
        ...aggregatedL2Transaction,
        originalTransaction: multiTransaction,
        alternativeTransactions: [],
      }
    }

    if (altIndex !== undefined && multiIndex === undefined) {
      const altTransaction =
        aggregatedL2Transaction?.alternativeTransactions[altIndex]
      if (!altTransaction) {
        return
      }

      return {
        ...aggregatedL2Transaction,
        originalTransaction: altTransaction,
        alternativeTransactions: [],
      }
    }

    return aggregatedL2Transaction
  }
}
