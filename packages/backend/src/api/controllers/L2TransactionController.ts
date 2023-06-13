import { renderPerpetualL2TransactionDetailsPage } from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'

import { PageContextService } from '../../core/PageContextService'
import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { ControllerResult } from './ControllerResult'

export class L2TransactionController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly l2TransactionRepository: L2TransactionRepository
  ) {}

  async getPerpetualL2TransactionDetailsPage(
    givenUser: Partial<UserDetails>,
    transactionId: number
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    if (context.tradingMode != 'perpetual') {
      return { type: 'not found', content: 'Page not found.' }
    }
    const l2Transaction =
      await this.l2TransactionRepository.findByTransactionId(transactionId)

    if (!l2Transaction) {
      return {
        type: 'not found',
        content: `L2 transaction #${transactionId} not found`,
      }
    }

    return {
      type: 'success',
      content: renderPerpetualL2TransactionDetailsPage({
        context,
        transaction: l2Transaction,
      }),
    }
  }
}
