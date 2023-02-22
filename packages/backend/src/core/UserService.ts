import { UserDetails } from '@explorer/shared'

import { UserRegistrationEventRepository } from '../peripherals/database/UserRegistrationEventRepository'

export class UserService {
  constructor(
    private readonly userRegistrationEventRepository: UserRegistrationEventRepository
  ) {}

  async getUserDetails({
    address,
    starkKey,
  }: Partial<UserDetails>): Promise<UserDetails | undefined> {
    if (!address) {
      return undefined
    }
    if (!starkKey) {
      const record =
        await this.userRegistrationEventRepository.findByEthereumAddress(
          address
        )
      return { address, starkKey: record?.starkKey }
    }
    return { address, starkKey }
  }
}
