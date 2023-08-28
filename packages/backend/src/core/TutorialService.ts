import { HomeTutorialEntry } from '@explorer/frontend'
import fs from 'fs'

export class TutorialService {
  getTutorials(): HomeTutorialEntry[] {
    try {
      const files = fs.readdirSync('src/content/tutorials')
      return files.map((filename) => this.toTutorialEntry(filename))
    } catch {
      return []
    }
  }

  private toTutorialEntry(filename: string): HomeTutorialEntry {
    const filenameWithoutExt = filename.replace('.md', '')
    return {
      title: filenameWithoutExt.replaceAll('-', ' '),
      imageUrl: `/images/${filenameWithoutExt}.jpg`,
      slug: filenameWithoutExt.toLowerCase(),
    }
  }
}
