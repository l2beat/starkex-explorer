import { LogLevel } from '../tools/Logger'

export interface Config {
  name: string
  logger: {
    logLevel: LogLevel
    format: 'pretty' | 'json'
  }
  port: number
}
