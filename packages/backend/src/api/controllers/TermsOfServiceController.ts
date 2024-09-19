import { renderTermsOfServicePage } from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'

import { PageContextService } from '../../core/PageContextService'
import { getHtmlFromMarkdown } from '../../utils/markdown/getHtmlFromMarkdown'
import { ControllerResult } from './ControllerResult'

export class TermsOfServiceController {
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
}
