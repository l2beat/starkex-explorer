import { renderUserPage } from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'

import { UserService } from '../../core/UserService'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { ControllerResult } from './ControllerResult'

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly stateUpdateRepository: StateUpdateRepository
  ) {}

  async getUserPage(
    givenUser: Partial<UserDetails>,
    starkKey: StarkKey
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const content = renderUserPage({
      user,
      type: 'PERPETUAL',
      starkKey,
      ethereumAddress: EthereumAddress.ZERO,
      withdrawableAssets: [],
      offersToAccept: [],
      assets: [],
      totalAssets: 0,
      balanceChanges: [],
      totalBalanceChanges: 0,
      transactions: [],
      totalTransactions: 0,
      offers: [],
      totalOffers: 0,
    })

    return { type: 'success', content }
  }
}
