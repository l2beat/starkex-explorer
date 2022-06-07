import { EthereumAddress } from '@explorer/types'

import { ForcedTradeOfferRepository } from '../peripherals/database/ForcedTradeOfferRepository'
import { ForcedTransactionsRepository } from '../peripherals/database/ForcedTransactionsRepository'
import { PositionRepository } from '../peripherals/database/PositionRepository'

export class AccountService {
  constructor(
    private readonly positionRepository: PositionRepository,
    private readonly offerRepository: ForcedTradeOfferRepository,
    private readonly transactionRepository: ForcedTransactionsRepository
  ) {}

  async getAccount(address?: EthereumAddress) {
    if (!address) {
      return undefined
    }
    const id = await this.positionRepository.findIdByEthereumAddress(address)

    if (!id) {
      return {
        address,
      }
    }

    const activeCount = await this.offerRepository.countActiveByPositionId(id)
    const pendingCount =
      await this.transactionRepository.countPendingByPositionId(id)
    return {
      address,
      positionId: id,
      hasUpdates: activeCount > 0 || pendingCount > 0,
    }
  }
}
