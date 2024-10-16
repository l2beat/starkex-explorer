import {
  renderInstallMetaMaskPage,
  renderTermsOfServicePage,
  renderUserNotAssociatedPage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'

import { PageContextService } from '../../core/PageContextService'
import { getHtmlFromMarkdown } from '../../utils/markdown/getHtmlFromMarkdown'
import { ControllerResult } from './ControllerResult'

export class StaticPageController {
  constructor(private readonly pageContextService: PageContextService) {}

  async getTermsOfServicePage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)
    let contents: string
    try {
      const path = 'src/content/tos.md'
      contents = getHtmlFromMarkdown(path)
    } catch {
      return {
        type: 'not found',
        message: 'The page you were looking for does not exist',
      }
    }

    return {
      type: 'success',
      content: renderTermsOfServicePage({
        context,
        contents,
      }),
    }
  }

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
