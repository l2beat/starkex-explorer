import { expect, mockFn } from 'earljs'
import { providers } from 'ethers'

import { BlockDownloader } from '../../../src/core/sync/BlockDownloader'
import { Hash256 } from '../../../src/model'
import {
  BlockRecord,
  BlockRepository,
} from '../../../src/peripherals/database/BlockRepository'
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

  describe(BlockDownloader.prototype.getStatus.name, () => {
    it('returns started=false when not started', () => {
      const ethereumClient = mock<EthereumClient>()
      const blockRepository = mock<BlockRepository>()
      const blockDownloader = new BlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT
      )
      expect<unknown>(blockDownloader.getStatus()).toEqual({
        started: false,
        lastKnown: 0,
        queueTip: 0,
      })
    })

    it('returns full info when started', async () => {
      const ethereumClient = mock<EthereumClient>({
        getBlockNumber: async () => 13_000_000,
        onBlock: () => () => {},
      })
      const blockRepository = mock<BlockRepository>({
        getLast: async () => ({ hash: Hash256.fake(), number: 10_000_000 }),
      })
      const blockDownloader = new BlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT
      )
      blockDownloader['advanceChain'] = mockFn().returns(undefined)

      await blockDownloader.start()
      expect<unknown>(blockDownloader.getStatus()).toEqual({
        started: true,
        lastKnown: 10_000_000,
        queueTip: 13_000_000,
      })
    })
  })

  describe('handling block reorganizations', () => {
    class TestBlockDownloader extends BlockDownloader {
      getLastKnown() {
        return this['lastKnown']
      }
      async testExecute(blockNumber: number) {
        return new Promise<
          ['newBlock', BlockRecord] | ['reorg', BlockRecord[]]
        >((resolve, reject) => {
          this.onNewBlock((block) => resolve(['newBlock', block]))
          this.onReorg((blocks) => resolve(['reorg', blocks]))
          this['executeAdvanceChain'](blockNumber).catch(reject)
        })
      }
    }

    function mockEthereumClient(
      blocks: {
        number: number
        hash: Hash256
        parentHash: Hash256
      }[]
    ) {
      return mock<EthereumClient>({
        async getBlock(hashOrTag) {
          const block = blocks.find(
            (x) => x.number === hashOrTag || x.hash === hashOrTag
          )
          if (!block) {
            throw new Error(`Block ${hashOrTag} not specified`)
          }
          return block as unknown as providers.Block
        },
      })
    }

    function mockBlockRepository(
      blocks: {
        number: number
        hash: Hash256
      }[]
    ) {
      return mock<BlockRepository>({
        deleteAllAfter: async () => {},
        add: async () => {},
        getByNumber: async (number: number) => {
          return blocks.find((x) => x.number === number)
        },
      })
    }

    const record = ({ number, hash }: BlockRecord) => ({ number, hash })

    const BLOCK_ZERO = {
      number: 1000,
      hash: Hash256.fake('8888'),
      parentHash: Hash256.fake('8888'),
    }
    const BLOCK_A = {
      number: 1001,
      hash: Hash256.fake('aaaa'),
      parentHash: BLOCK_ZERO.hash,
    }
    const BLOCK_B = {
      number: 1002,
      hash: Hash256.fake('bbbb'),
      parentHash: BLOCK_A.hash,
    }
    const BLOCK_B1 = {
      number: 1002,
      hash: Hash256.fake('b1b1'),
      parentHash: BLOCK_A.hash,
    }
    const BLOCK_C = {
      number: 1003,
      hash: Hash256.fake('cccc'),
      parentHash: BLOCK_B.hash,
    }
    const BLOCK_C1 = {
      number: 1003,
      hash: Hash256.fake('c1c1'),
      parentHash: BLOCK_B1.hash,
    }
    const BLOCK_D = {
      number: 1004,
      hash: Hash256.fake('dddd'),
      parentHash: BLOCK_C.hash,
    }
    const BLOCK_D1 = {
      number: 1004,
      hash: Hash256.fake('d1d1'),
      parentHash: BLOCK_C1.hash,
    }
    const BLOCK_E1 = {
      number: 1005,
      hash: Hash256.fake('e1e1'),
      parentHash: BLOCK_D1.hash,
    }

    it('downloads the new block', async () => {
      const ethereumClient = mockEthereumClient([BLOCK_B])
      const blockRepository = mockBlockRepository([BLOCK_A])
      const blockDownloader = new TestBlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT
      )

      const result = await blockDownloader.testExecute(BLOCK_B.number)
      expect(result).toEqual(['newBlock', record(BLOCK_B)])
      expect(blockDownloader.getLastKnown()).toEqual(BLOCK_B.number)
      expect(blockRepository.add).toHaveBeenCalledExactlyWith([
        [[record(BLOCK_B)]],
      ])
    })

    it('downloads the new block and the old block', async () => {
      const ethereumClient = mockEthereumClient([BLOCK_A, BLOCK_B])
      const blockRepository = mockBlockRepository([])
      const blockDownloader = new TestBlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT
      )

      const result = await blockDownloader.testExecute(BLOCK_B.number)
      expect(result).toEqual(['newBlock', record(BLOCK_B)])
      expect(blockDownloader.getLastKnown()).toEqual(BLOCK_B.number)
      expect(blockRepository.add).toHaveBeenCalledExactlyWith([
        [[record(BLOCK_A)]],
        [[record(BLOCK_B)]],
      ])
    })

    it('handles a 1 deep reorg', async () => {
      const ethereumClient = mockEthereumClient([BLOCK_B1, BLOCK_C1])
      const blockRepository = mockBlockRepository([BLOCK_A, BLOCK_B])
      const blockDownloader = new TestBlockDownloader(
        ethereumClient,
        blockRepository,
        Logger.SILENT
      )

      const result = await blockDownloader.testExecute(BLOCK_C1.number)
      expect(result).toEqual(['reorg', [record(BLOCK_B1), record(BLOCK_C1)]])
      expect(blockDownloader.getLastKnown()).toEqual(BLOCK_C1.number)
      expect(blockRepository.deleteAllAfter).toHaveBeenCalledExactlyWith([
        [BLOCK_A.number],
      ])
      expect(blockRepository.add).toHaveBeenCalledExactlyWith([
        [[record(BLOCK_B1), record(BLOCK_C1)]],
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
        Logger.SILENT
      )

      const result = await blockDownloader.testExecute(BLOCK_E1.number)
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
      expect(blockRepository.deleteAllAfter).toHaveBeenCalledExactlyWith([
        [BLOCK_A.number],
      ])
      expect(blockRepository.add).toHaveBeenCalledExactlyWith([
        [
          [
            record(BLOCK_B1),
            record(BLOCK_C1),
            record(BLOCK_D1),
            record(BLOCK_E1),
          ],
        ],
      ])
    })
  })
})
