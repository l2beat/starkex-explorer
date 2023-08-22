import { renderTutorialPage } from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'

import { PageContextService } from '../../core/PageContextService'
import { getHtmlFromMarkdown } from '../../utils/markdown/getHtmlFromMarkdown'
import { ControllerResult } from './ControllerResult'

export class TutorialController {
  constructor(private readonly pageContextService: PageContextService) {}

  async getTutorialPage(
    givenUser: Partial<UserDetails>,
    slug: string
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)
    const articleContent = getHtmlFromMarkdown(`src/tutorials/${slug}`)
    return {
      type: 'success',
      content: renderTutorialPage({
        context,
        articleContent: articleContent,
        slug,
      }),
    }
  }
}
