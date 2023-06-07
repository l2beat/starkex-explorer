import { expect, mockFn, mockObject } from 'earl'
import { Response } from 'koa'

import { Logger } from '../../tools/Logger'
import { FetchClient } from './FetchClient'

describe(FetchClient.name, () => {
  const fetchClient = new FetchClient(
    mockObject<Logger>({
      for: mockFn(() => Logger.SILENT),
    })
  )
  describe(FetchClient.prototype.fetchRetry.name, () => {
    const fetch = mockFn().throws(new Error())
    fetchClient.fetch = fetch

    it('should retry on error', async () => {
      const retries = 5
      await expect(
        fetchClient.fetchRetry('url', {}, retries, 0)
      ).toBeRejectedWith(Error)
      expect(fetch).toHaveBeenCalledTimes(retries)
    })

    it('should wait between retries', async () => {
      const delay = 25
      const retries = 2
      const startTime = Date.now()
      await expect(
        fetchClient.fetchRetry('url', {}, retries, delay)
      ).toBeRejectedWith(Error)
      const endTime = Date.now()
      expect(endTime - startTime).toBeGreaterThanOrEqual(
        delay * retries - delay
      )
    })

    it('should not retry on success', async () => {
      const fetch = mockFn().resolvesTo({} as Response)

      fetchClient.fetch = fetch

      await fetchClient.fetchRetry('url', {}, 5, 0)

      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })
})
