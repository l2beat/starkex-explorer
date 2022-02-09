import { expect, mockFn } from 'earljs'
import { providers } from 'ethers'

import { BlockDownloader } from '../../../src/core/sync/BlockDownloader'
import { Hash256 } from '../../../src/model'
import { BlockRepository } from '../../../src/peripherals/database/BlockRepository'
import { EthereumClient } from '../../../src/peripherals/ethereum/EthereumClient'
import { Logger } from '../../../src/tools/Logger'
import { mock } from '../../mock'

describe(BlockDownloader.name, () => {
  describe(BlockDownloader.prototype.start.name, () => {
    async function getScheduledBlocks(
      lastBlockNumber: number | undefined,
      currentBlockNumber: number,
      emitted: number[] = []
    ) {
      const ethereumClient = mock<EthereumClient>({
        getBlockNumber: async () => currentBlockNumber,
        onBlock: (fn) => {
          emitted.forEach((x) => fn({ number: x } as providers.Block))
          return () => {}
        },
      })
      const blockRepository = mock<BlockRepository>({
        getLast: async () =>
          lastBlockNumber
            ? { hash: Hash256.fake(), number: lastBlockNumber }
            : undefined,
      })
      const blockDownloader = new BlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT,
        5
      )

      const mockAdvanceChain = mockFn().returns(undefined)
      blockDownloader['advanceChain'] = mockAdvanceChain

      await blockDownloader.start()
      return mockAdvanceChain.calls.map((x) => x.args[0])
    }

    it('can start from scratch', async () => {
      const scheduled = await getScheduledBlocks(undefined, 13_000_000)
      expect(scheduled).toEqual([
        13_000_000 - 4,
        13_000_000 - 3,
        13_000_000 - 2,
        13_000_000 - 1,
        13_000_000,
      ])
    })

    it('can start from a distant past', async () => {
      const scheduled = await getScheduledBlocks(10_000_000, 13_000_000)
      expect(scheduled).toEqual([
        10_000_000 + 1,
        13_000_000 - 4,
        13_000_000 - 3,
        13_000_000 - 2,
        13_000_000 - 1,
        13_000_000,
      ])
    })

    it('can start from a recent past', async () => {
      const scheduled = await getScheduledBlocks(13_000_000 - 3, 13_000_000)
      expect(scheduled).toEqual([13_000_000 - 2, 13_000_000 - 1, 13_000_000])
    })

    it('can start from the present', async () => {
      const scheduled = await getScheduledBlocks(13_000_000, 13_000_000)
      expect(scheduled).toEqual([])
    })

    it('can start from the future', async () => {
      const scheduled = await getScheduledBlocks(13_000_000 + 3, 13_000_000)
      expect(scheduled).toEqual([])
    })

    it('subscribes to new blocks', async () => {
      const scheduled = await getScheduledBlocks(13_000_000, 13_000_000, [
        13_000_000 + 1,
      ])
      expect(scheduled).toEqual([13_000_000 + 1])
    })

    it('handles gaps in new blocks', async () => {
      const scheduled = await getScheduledBlocks(13_000_000, 13_000_000, [
        13_000_000 + 1,
        13_000_000 + 4,
      ])
      expect(scheduled).toEqual([
        13_000_000 + 1,
        13_000_000 + 2,
        13_000_000 + 3,
        13_000_000 + 4,
      ])
    })

    it('ignores new blocks from the past or present', async () => {
      const scheduled = await getScheduledBlocks(13_000_000, 13_000_000, [
        13_000_000 - 1,
        13_000_000,
      ])
      expect(scheduled).toEqual([])
    })

    it('can work with a complex scenario', async () => {
      const scheduled = await getScheduledBlocks(10_000_000, 13_000_000, [
        13_000_000 + 2,
        13_000_000 + 1,
        13_000_000 + 4,
      ])
      expect(scheduled).toEqual([
        10_000_000 + 1,
        13_000_000 - 4,
        13_000_000 - 3,
        13_000_000 - 2,
        13_000_000 - 1,
        13_000_000,
        13_000_000 + 1,
        13_000_000 + 2,
        13_000_000 + 3,
        13_000_000 + 4,
      ])
    })
  })
})
