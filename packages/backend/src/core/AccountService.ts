import { EthereumAddress } from '@explorer/types'

import { PositionRepository } from '../peripherals/database/PositionRepository'

export class AccountService {
  constructor(private readonly positionRepository: PositionRepository) {}

  async getAccount(address?: EthereumAddress) {
    if (!address) {
      return undefined
    }
    const id = await this.positionRepository.findIdByEthereumAddress(address)
    const hasUpdates = false // TODO: find forced actions in progress
    return {
      address,
      positionId: id,
      hasUpdates,
    }
  }
}
