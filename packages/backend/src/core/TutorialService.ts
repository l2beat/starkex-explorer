import { HomeTutorialEntry } from '@explorer/frontend'

export class TutorialService {
  getTutorials(): HomeTutorialEntry[] {
    const tutorials: HomeTutorialEntry[] = [
      {
        title: 'Introduction to StarkEx Explorer',
        slug: 'introduction',
      },
      {
        title: 'Escape Hatch explained',
        slug: 'escapehatch',
      },
      {
        title: 'Escape Hatch FAQ',
        slug: 'faqescapehatch',
      },
      {
        title: 'Accessing User Page',
        slug: 'userpage',
      },
      {
        title: 'All about Forced Actions',
        slug: 'forcedactions',
      },
    ]
    return tutorials
  }
}
