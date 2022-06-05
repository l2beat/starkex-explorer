import { EthereumAddress } from '@explorer/types'

import { ForcedTradeOfferRepository } from '../peripherals/database/ForcedTradeOfferRepository'
import { PositionRepository } from '../peripherals/database/PositionRepository'

export class AccountService {
  constructor(
    private readonly positionRepository: PositionRepository,
    private readonly offerRepository: ForcedTradeOfferRepository
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
    return {
      address,
      positionId: id,
      hasUpdates: activeCount > 0,
    }
  }
}
