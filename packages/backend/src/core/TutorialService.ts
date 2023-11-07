import { HomeTutorialEntry } from '@explorer/frontend'

export class TutorialService {
  getTutorials(): HomeTutorialEntry[] {
    const tutorials: HomeTutorialEntry[] = [
      {
        title: 'Introduction to StarkEx Explorer',
        slug: 'introduction',
      },
      {
        title: 'Accessing User Page',
        slug: 'userpage',
      },
      {
        title: 'All about Forced Actions',
        slug: 'forcedactions',
      },
      {
        title: 'Escape Hatch explained',
        slug: 'escapehatch',
      },
    ]
    return tutorials
  }
}
