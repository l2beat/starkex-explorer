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
    let articleContent: string
    try {
      const path = this.getTutorialPath(slug)
      articleContent = getHtmlFromMarkdown(path)
    } catch {
      return {
        type: 'not found',
        message: 'The tutorial you were looking for does not exist',
      }
    }

    return {
      type: 'success',
      content: renderTutorialPage({
        context,
        articleContent: articleContent,
        slug,
      }),
    }
  }

  private getTutorialPath(slug: string): string {
    return `src/content/tutorials/${slug}.md`
  }
}
