import {
  renderPerpetualL2TransactionDetailsPage,
  renderRawL2TransactionPage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'

import { PageContextService } from '../../core/PageContextService'
import {
  AggregatedL2TransactionRecord,
  L2TransactionRepository,
} from '../../peripherals/database/L2TransactionRepository'
import { getAssetPriceUSDCents } from '../../utils/assets'
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
      await this.l2TransactionRepository.findAggregatedByTransactionId(
        transactionId
      )

    if (!aggregatedL2Transaction) {
      return {
        type: 'not found',
        message: `L2 transaction #${transactionId} was not found`,
      }
    }
    let transaction: AggregatedL2TransactionRecord | undefined
    transaction = this.extractTransactionByMultiAndAltIndex(
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

    transaction = this.convertPricesToUSDCents(transaction)

    return {
      type: 'success',
      content: renderPerpetualL2TransactionDetailsPage({
        context,
        transaction,
        altIndex,
        multiIndex,
      }),
    }
  }

  async getRawL2TransactionPage(
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
      await this.l2TransactionRepository.findAggregatedByTransactionId(
        transactionId
      )

    if (!aggregatedL2Transaction) {
      return {
        type: 'not found',
        message: `L2 transaction #${transactionId} was not found`,
      }
    }
    let transaction: AggregatedL2TransactionRecord | undefined
    transaction = this.extractTransactionByMultiAndAltIndex(
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

    transaction = this.convertPricesToUSDCents(transaction)

    return {
      type: 'success',
      content: renderRawL2TransactionPage({
        context,
        transaction: {
          transactionId: transaction.transactionId,
          stateUpdateId: transaction.stateUpdateId,
          originalTransaction: transaction.originalTransaction,
          alternativeTransactions: transaction.alternativeTransactions,
        },
      }),
    }
  }

  private extractTransactionByMultiAndAltIndex(
    aggregatedL2Transaction: AggregatedL2TransactionRecord,
    multiIndex: number | undefined,
    altIndex: number | undefined
  ): AggregatedL2TransactionRecord | undefined {
    if (multiIndex !== undefined && altIndex !== undefined) {
      const altTransaction =
        aggregatedL2Transaction.alternativeTransactions[altIndex]
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
        originalTransaction: {
          timestamp: altTransaction.timestamp,
          ...multiTransaction,
        },
        alternativeTransactions: [],
      }
    }

    if (multiIndex !== undefined && altIndex === undefined) {
      if (
        aggregatedL2Transaction.originalTransaction.type !== 'MultiTransaction'
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
        originalTransaction: {
          timestamp: aggregatedL2Transaction.originalTransaction.timestamp,
          ...multiTransaction,
        },
        alternativeTransactions: [],
      }
    }

    if (altIndex !== undefined && multiIndex === undefined) {
      const altTransaction =
        aggregatedL2Transaction.alternativeTransactions[altIndex]
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

  convertPricesToUSDCents(
    aggregatedL2Transaction: AggregatedL2TransactionRecord
  ): AggregatedL2TransactionRecord {
    if (
      aggregatedL2Transaction.originalTransaction.type === 'OraclePricesTick'
    ) {
      return {
        ...aggregatedL2Transaction,
        originalTransaction: {
          ...aggregatedL2Transaction.originalTransaction,
          oraclePrices:
            aggregatedL2Transaction.originalTransaction.oraclePrices.map(
              (oraclePrice) => {
                return {
                  ...oraclePrice,
                  price: getAssetPriceUSDCents(
                    oraclePrice.price,
                    oraclePrice.syntheticAssetId
                  ),
                }
              }
            ),
        },
      }
    }

    return aggregatedL2Transaction
  }
}
