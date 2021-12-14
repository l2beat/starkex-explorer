import { Config } from './config'
import { Logger } from './tools/Logger'

export class Application {
  start: () => Promise<void>

  constructor(config: Config) {
    /* - - - - - TOOLS - - - - - */

    const logger = new Logger(config.logger)

    /* - - - - - START - - - - - */

    this.start = async () => {
      logger.for(this).info('Starting')
      logger.for(this).info('Started')
    }
  }
}
