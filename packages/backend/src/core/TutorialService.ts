import { HomeTutorialEntry } from '@explorer/frontend'
import fs from 'fs'

export class TutorialService {
  constructor() {}

  getTutorials(): HomeTutorialEntry[] {
    const files = fs.readdirSync('src/content/tutorials')

    return files.map((filename) => {
      const filenameWithoutExt = filename.replace('.md', '')
      return {
        title: filenameWithoutExt.replace('-', ' '),
        imageUrl: `/images/${filenameWithoutExt}.jpg`,
        slug: filenameWithoutExt.toLowerCase(),
      }
    })
  }
}
