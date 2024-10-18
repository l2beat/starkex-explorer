import {
  renderInstallMetaMaskPage,
  renderUserNotAssociatedPage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'

import { PageContextService } from '../../core/PageContextService'
import { ControllerResult } from './ControllerResult'

export class StaticPageController {
  constructor(private readonly pageContextService: PageContextService) {}

  async getInstallMetaMaskPage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    return {
      type: 'success',
      content: renderInstallMetaMaskPage({
        context,
      }),
    }
  }

  async getUserNotAssociatedPage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContextWithUser(
      givenUser
    )

    if (!context) {
      return {
        type: 'not found',
        message: 'The page you were looking for does not exist',
      }
    }

    return {
      type: 'success',
      content: renderUserNotAssociatedPage({
        context,
      }),
    }
  }
}
