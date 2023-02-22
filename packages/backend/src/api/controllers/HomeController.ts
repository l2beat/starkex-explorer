import { renderHomePage } from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'

import { UserService } from '../../core/UserService'
import { ControllerResult } from './ControllerResult'

export class HomeController {
  constructor(private readonly userService: UserService) {}

  async getHomePage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)
    const content = renderHomePage({
      user,
      tutorials: [], // explicitly no tutorials
      stateUpdates: [],
      totalStateUpdates: 0,
      forcedTransactions: [],
      totalForcedTransactions: 0,
      offers: [],
      totalOffers: 0,
    })
    return { type: 'success', content }
  }
}
