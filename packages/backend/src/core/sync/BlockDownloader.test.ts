import { Hash256 } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'
import { providers } from 'ethers'

import {
  BlockRecord,
  BlockRepository,
} from '../../peripherals/database/BlockRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { Logger } from '../../tools/Logger'
import { BlockDownloader } from './BlockDownloader'

describe(BlockDownloader.name, () => {
  describe(BlockDownloader.prototype.start.name, () => {
    async function getScheduledBlocks(
      lastBlockNumber: number | undefined,
      currentBlockNumber: number,
      emitted: number[] = []
    ) {
      const ethereumClient = mockObject<EthereumClient>({
        getBlockNumber: async () => currentBlockNumber,
        onBlock: (fn) => {
          emitted.forEach((x) => fn({ number: x } as providers.Block))
          return () => {}
        },
      })
      const blockRepository = mockObject<BlockRepository>({
        findLast: async () =>
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
      // @ts-expect-error acccess private member
      blockDownloader.addJob = mockAdvanceChain

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

  describe(BlockDownloader.prototype.getStatus.name, () => {
    it('returns started=false when not started', () => {
      const ethereumClient = mockObject<EthereumClient>()
      const blockRepository = mockObject<BlockRepository>()
      const blockDownloader = new BlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT,
        5
      )
      expect<unknown>(blockDownloader.getStatus()).toEqual({
        started: false,
        lastKnown: 0,
        queueTip: 0,
      })
    })

    it('returns full info when started', async () => {
      const ethereumClient = mockObject<EthereumClient>({
        getBlockNumber: async () => 13_000_000,
        onBlock: () => () => {},
      })
      const blockRepository = mockObject<BlockRepository>({
        findLast: async () => ({ hash: Hash256.fake(), number: 10_000_000 }),
      })
      const blockDownloader = new BlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT,
        5
      )
      // @ts-expect-error acccess private member
      blockDownloader.addJob = mockFn().returns(undefined)

      await blockDownloader.start()
      expect<unknown>(blockDownloader.getStatus()).toEqual({
        started: true,
        lastKnown: 10_000_000,
        queueTip: 13_000_000,
      })
    })
  })

  describe(BlockDownloader.prototype.getKnownBlocks.name, () => {
    it('returns no blocks if the repository is empty', async () => {
      const ethereumClient = mockObject<EthereumClient>()
      const blockRepository = mockObject<BlockRepository>({
        findLast: async () => undefined,
      })
      const blockDownloader = new BlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT,
        5
      )
      expect(await blockDownloader.getKnownBlocks(1_000_000)).toEqual([])
    })

    it('returns no blocks if there are no blocks in range', async () => {
      const ethereumClient = mockObject<EthereumClient>()
      const blockRepository = mockObject<BlockRepository>({
        findLast: async () => ({ number: 2_000_000, hash: Hash256.fake() }),
        getAllInRange: async () => [],
      })
      const blockDownloader = new BlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT,
        5
      )
      expect(await blockDownloader.getKnownBlocks(1_000_000)).toEqual([])
    })

    it('returns the blocks in range', async () => {
      const ethereumClient = mockObject<EthereumClient>()
      const blockRepository = mockObject<BlockRepository>({
        findLast: async () => ({ number: 2_000_000, hash: Hash256.fake() }),
        getAllInRange: async () => [
          { number: 1_500_000, hash: Hash256.fake('abc') },
          { number: 1_700_000, hash: Hash256.fake('def') },
        ],
      })
      const blockDownloader = new BlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT,
        5
      )
      expect(await blockDownloader.getKnownBlocks(1_000_000)).toEqual([
        { number: 1_500_000, hash: Hash256.fake('abc') },
        { number: 1_700_000, hash: Hash256.fake('def') },
      ])
    })
  })

  describe('handling block reorganizations', () => {
    class TestBlockDownloader extends BlockDownloader {
      getLastKnown() {
        return this.lastKnown
      }
      async testAdvanceChain(blockNumber: number) {
        return this.advanceChain(blockNumber)
      }
    }

    function mockEthereumClient(
      blocks: (BlockRecord & { parentHash: Hash256 })[]
    ) {
      return mockObject<EthereumClient>({
        async getBlock(hashOrTag) {
          const block = blocks.find(
            (x) => x.number === hashOrTag || x.hash === hashOrTag
          )
          if (!block) {
            throw new Error(`Block ${hashOrTag.toString()} not specified`)
          }
          return block as unknown as providers.Block
        },
      })
    }

    function mockBlockRepository(blocks: BlockRecord[]) {
      return mockObject<BlockRepository>({
        deleteAfter: async () => 0,
        addMany: async () => [],
        findByNumber: async (number: number) => {
          return blocks.find((x) => x.number === number)
        },
      })
    }

    const record = ({ number, hash }: BlockRecord) => ({ number, hash })
    const block = (number: number, hash: string, parentHash: string) => ({
      number,
      hash: Hash256.fake(hash),
      parentHash: Hash256.fake(parentHash),
    })

    const BLOCK_A = block(1001, 'aaaa', '0000')
    const BLOCK_B = block(1002, 'bbbb', 'aaaa')
    const BLOCK_B1 = block(1002, 'b1b1', 'aaaa')
    const BLOCK_C = block(1003, 'cccc', 'bbbb')
    const BLOCK_C1 = block(1003, 'c1c1', 'b1b1')
    const BLOCK_D = block(1004, 'dddd', 'cccc')
    const BLOCK_D1 = block(1004, 'd1d1', 'c1c1')
    const BLOCK_E1 = block(1005, 'e1e1', 'd1d1')

    it('downloads the new block', async () => {
      const ethereumClient = mockEthereumClient([BLOCK_B])
      const blockRepository = mockBlockRepository([BLOCK_A])
      const blockDownloader = new TestBlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT,
        5
      )

      const result = await blockDownloader.testAdvanceChain(BLOCK_B.number)
      expect(result).toEqual(['newBlock', record(BLOCK_B)])
      expect(blockDownloader.getLastKnown()).toEqual(BLOCK_B.number)
      expect(blockRepository.addMany).toHaveBeenOnlyCalledWith([
        record(BLOCK_B),
      ])
    })

    it('downloads the new block and the old block', async () => {
      const ethereumClient = mockEthereumClient([BLOCK_A, BLOCK_B])
      const blockRepository = mockBlockRepository([])
      const blockDownloader = new TestBlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT,
        5
      )

      const result = await blockDownloader.testAdvanceChain(BLOCK_B.number)
      expect(result).toEqual(['newBlock', record(BLOCK_B)])
      expect(blockDownloader.getLastKnown()).toEqual(BLOCK_B.number)

      expect(blockRepository.addMany).toHaveBeenCalledTimes(2)
      expect(blockRepository.addMany).toHaveBeenNthCalledWith(1, [
        record(BLOCK_A),
      ])
      expect(blockRepository.addMany).toHaveBeenNthCalledWith(2, [
        record(BLOCK_B),
      ])
    })

    it('handles a 1 deep reorg', async () => {
      const ethereumClient = mockEthereumClient([BLOCK_B1, BLOCK_C1])
      const blockRepository = mockBlockRepository([BLOCK_A, BLOCK_B])
      const blockDownloader = new TestBlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT,
        5
      )

      const result = await blockDownloader.testAdvanceChain(BLOCK_C1.number)
      expect(result).toEqual(['reorg', [record(BLOCK_B1), record(BLOCK_C1)]])
      expect(blockDownloader.getLastKnown()).toEqual(BLOCK_C1.number)
      expect(blockRepository.deleteAfter).toHaveBeenOnlyCalledWith(
        BLOCK_A.number
      )
      expect(blockRepository.addMany).toHaveBeenOnlyCalledWith([
        record(BLOCK_B1),
        record(BLOCK_C1),
      ])
    })

    it('handles a 3 deep reorg', async () => {
      const ethereumClient = mockEthereumClient([
        BLOCK_B1,
        BLOCK_C1,
        BLOCK_D1,
        BLOCK_E1,
      ])
      const blockRepository = mockBlockRepository([
        BLOCK_A,
        BLOCK_B,
        BLOCK_C,
        BLOCK_D,
      ])
      const blockDownloader = new TestBlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT,
        5
      )

      const result = await blockDownloader.testAdvanceChain(BLOCK_E1.number)
      expect(result).toEqual([
        'reorg',
        [
          record(BLOCK_B1),
          record(BLOCK_C1),
          record(BLOCK_D1),
          record(BLOCK_E1),
        ],
      ])
      expect(blockDownloader.getLastKnown()).toEqual(BLOCK_E1.number)
      expect(blockRepository.deleteAfter).toHaveBeenOnlyCalledWith(
        BLOCK_A.number
      )
      expect(blockRepository.addMany).toHaveBeenOnlyCalledWith([
        record(BLOCK_B1),
        record(BLOCK_C1),
        record(BLOCK_D1),
        record(BLOCK_E1),
      ])
    })
  })
})
