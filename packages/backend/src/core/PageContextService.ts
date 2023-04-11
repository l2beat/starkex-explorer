import { PageContext, UserDetails } from '@explorer/shared'

import { Config } from '../config'
import { UserService } from './UserService'

export class PageContextService {
  constructor(
    private readonly config: Config,
    private readonly userService: UserService
  ) {}

  async getPageContext(givenUser: Partial<UserDetails>): Promise<PageContext> {
    const user = await this.userService.getUserDetails(givenUser)

    return {
      user,
      tradingMode: this.config.starkex.tradingMode,
      instanceName: this.config.starkex.instanceName,
    }
  }
}
