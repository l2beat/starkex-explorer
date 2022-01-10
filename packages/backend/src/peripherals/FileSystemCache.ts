import { mkdir, readFile, writeFile } from 'fs/promises'

import { Logger, LogLevel } from '../tools/Logger'
import { makeError } from '../tools/makeError'

export class FileSystemCache {
  constructor(private readonly logger: Logger) {
    this.logger = logger.for(this)
  }

  async get(key: string): Promise<object | undefined> {
    try {
      const fileContent = await readFile(`.cache/${key}.json`, 'utf-8')
      return JSON.parse(fileContent)
    } catch (err) {
      const error = makeError(err)

      if (!isFileSystemError(error) || error.code !== 'ENOENT')
        this.logger.error(error.message)

      return undefined
    }
  }

  async set(key: string, value: object | undefined): Promise<void> {
    try {
      await mkdir('.cache', { recursive: true })
    } catch (err) {
      const error = makeError(err)

      if (!isFileSystemError(error) || error.code !== 'EEXIST')
        this.logger.error(error.message)
    }

    const fileContent =
      process.env.NODE_ENV === 'production'
        ? JSON.stringify(value)
        : JSON.stringify(value, null, 2)

    await writeFile(`.cache/${key}.json`, fileContent)
  }
}

export type Cache = FileSystemCache

interface FileSystemError extends Error {
  code: string
  errno: number
  syscall: string
  path: string
}

function isFileSystemError(err: Error): err is FileSystemError {
  return 'code' in err
}
