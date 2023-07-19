import { Logger } from '@l2beat/backend-tools'
import _fetch, { RequestInit, Response } from 'node-fetch'

export class FetchClient {
  constructor(private readonly logger: Logger) {
    this.logger = logger.for(this)
  }

  async fetch(url: string, requestInit?: RequestInit): Promise<Response> {
    return _fetch(url, { timeout: 5_000, ...requestInit })
  }

  async fetchRetry(
    url: string,
    fetchOptions: RequestInit,
    tries = 5,
    delay = 1000
  ): Promise<Response> {
    try {
      return await this.fetch(url, fetchOptions)
    } catch (err) {
      const triesLeft = tries - 1

      if (!triesLeft) {
        throw err
      }
      this.logger.error(
        `Error fetching data, retrying. Tries left: ${triesLeft}`,
        err
      )
      return this.wait(delay).then(() =>
        this.fetchRetry(url, fetchOptions, triesLeft, delay)
      )
    }
  }

  private async wait(delay: number) {
    return new Promise((resolve) => setTimeout(resolve, delay))
  }
}
