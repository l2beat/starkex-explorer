import { AccountDetails } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

import { ForcedTradeOfferRepository } from '../peripherals/database/ForcedTradeOfferRepository'
import { PositionRepository } from '../peripherals/database/PositionRepository'
import { SentTransactionRepository } from '../peripherals/database/transactions/SentTransactionRepository'

export class AccountService {
  constructor(
    private readonly positionRepository: PositionRepository,
    private readonly offerRepository: ForcedTradeOfferRepository,
    private readonly sentTransactionRepository: SentTransactionRepository
  ) {}

  async getAccount(
    address?: EthereumAddress
  ): Promise<AccountDetails | undefined> {
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
      await this.sentTransactionRepository.countNotMinedByPositionId(id)
    return {
      address,
      positionId: id,
      hasUpdates: activeCount > 0 || pendingCount > 0,
      is_wallet_connect: false
    }
  }
}
