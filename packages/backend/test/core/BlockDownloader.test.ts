import { expect, mockFn } from 'earljs'
import { providers } from 'ethers'
import { orderBy, range } from 'lodash'
import waitForExpect from 'wait-for-expect'

import {
  BlockDownloader,
  IncomingBlock,
  isConsistentChain,
} from '../../src/core/BlockDownloader'
import { Hash256 } from '../../src/model'
import {
  BlockRecord,
  BlockRepository,
} from '../../src/peripherals/database/BlockRepository'
import { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { BlockTag } from '../../src/peripherals/ethereum/types'
import { Logger, LogLevel } from '../../src/tools/Logger'
import { mock } from '../mock'

const INITIAL_BLOCK: BlockRecord = { number: 0, hash: Hash256.from(0n) }

describe(BlockDownloader.name, () => {
  const logger = new Logger({ format: 'pretty', logLevel: LogLevel.ERROR })

  it('saves obtained blocks to db', async () => {
    const [h1, h2, h3] = range(3).map((i) => Hash256.fake(String(i)))
    const { blockRepository, ethereumClient, emitBlock } = setupMocks({
      blocks: [h1, h2, h3],
    })
    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    await blockDownloader.start()

    emitBlock({
      timestamp: 0,
      hash: h1.toString(),
      number: 1,
      parentHash: INITIAL_BLOCK.hash.toString(),
    })
    emitBlock({
      timestamp: 0,
      hash: h2.toString(),
      number: 2,
      parentHash: h1.toString(),
    })
    emitBlock({
      timestamp: 0,
      hash: h3.toString(),
      number: 3,
      parentHash: h2.toString(),
    })

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()

      expect(blocksInDb).toBeAnArrayOfLength(3)
      expect(blocksInDb).toEqual([
        { hash: h1, number: 1 },
        { hash: h2, number: 2 },
        { hash: h3, number: 3 },
      ])
    })
  })

  it('handles gaps between received blocks (in case of server restarts)', async () => {
    const [h1, h2, h3, h4] = range(4).map((i) => Hash256.fake(String(i)))
    const { blockRepository, ethereumClient, emitBlock } = setupMocks({
      blocks: [h1, h2, h3, h4],
    })
    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    const stop = await blockDownloader.start()

    emitBlock({
      hash: h1.toString(),
      number: 1,
      parentHash: INITIAL_BLOCK.hash.toString(),
      timestamp: 0,
    })

    stop()

    await blockDownloader.start()

    emitBlock({
      hash: h4.toString(),
      number: 4,
      parentHash: h3.toString(),
      timestamp: 0,
    })

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()

      expect(blocksInDb).toEqual([
        { hash: h1, number: 1 },
        { hash: h2, number: 2 },
        { hash: h3, number: 3 },
        { hash: h4, number: 4 },
      ])
    })
  })

  it('calls `onNewBlocks` listeners the range of new blocks obtained', async () => {
    const [h1, h2, h3, h4] = range(4).map((i) => Hash256.fake(String(i)))
    const { blockRepository, ethereumClient, emitBlock } = setupMocks({
      blocks: [h1, h2, h3, h4],
    })
    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    const newBlocksListener = mockFn((_: BlockRecord[]): void => {})
    blockDownloader.onNewBlocks(newBlocksListener)

    await blockDownloader.start()

    emitBlock({
      hash: h1.toString(),
      number: 1,
      parentHash: INITIAL_BLOCK.hash.toString(),
      timestamp: 0,
    })

    await waitForExpect(() => {
      expect(newBlocksListener).toHaveBeenCalledExactlyWith([
        [[{ hash: h1, number: 1 }]],
      ])
    })

    await blockDownloader.start()

    emitBlock({
      hash: h4.toString(),
      number: 4,
      parentHash: h3.toString(),
      timestamp: 0,
    })

    await waitForExpect(() => {
      expect(newBlocksListener).toHaveBeenCalledExactlyWith([
        [[{ number: 1, hash: h1 }]],
        [
          [
            { number: 2, hash: h2 },
            { number: 3, hash: h3 },
            { number: 4, hash: h4 },
          ],
        ],
      ])
    })
  })

  it('handles reorgs in the past #1s', async () => {
    const commonHistory = range(1, 21).map((i) => Hash256.fake(`${i}0`))
    const reorgedHistory = [Hash256.fake('21a'), Hash256.fake('22a')]
    const hashes = commonHistory.concat(reorgedHistory)

    const { blockRepository, ethereumClient, emitBlock, reorganize } =
      setupMocks({ blocks: hashes })
    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    const reorgListener = mockFn((_: BlockRecord[]): void => {})
    blockDownloader.onReorg(reorgListener)
    const newBlocksListener = mockFn((_: BlockRecord[]): void => {})
    blockDownloader.onNewBlocks(newBlocksListener)

    await blockDownloader.start()

    hashes.forEach((hash, i) => {
      emitBlock({
        hash: hash.toString(),
        number: i + 1,
        parentHash: (hashes[i - 1] || INITIAL_BLOCK.hash).toString(),
        timestamp: 0,
      })
    })

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()
      expect(blocksInDb).toBeAnArrayOfLength(22)
    })

    const newHistory = [
      Hash256.fake('21b'),
      Hash256.fake('22b'),
      Hash256.fake('23b'),
    ]
    const [h21b, h22b, h23b] = newHistory

    const blocks = reorganize(commonHistory.concat(newHistory))

    emitBlock(blocks[23]!)

    await waitForExpect(() => {
      expect(reorgListener).toHaveBeenCalledExactlyWith([
        [newHistory.map((h) => expect.objectWith({ hash: h.toString() }))],
      ])
    })

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()

      expect(blocksInDb).toEqual([
        ...commonHistory.map(
          (hash, i): BlockRecord => ({ hash, number: i + 1 })
        ),
        { hash: h21b, number: 21 },
        { hash: h22b, number: 22 },
        { hash: h23b, number: 23 },
      ])
    })
  })

  it('handles reorgs in the past #2', async () => {
    const hashes = [Hash256.fake('1'), Hash256.fake('2'), Hash256.fake('3a')]
    const [h1, h2, h3a] = hashes

    const { blockRepository, ethereumClient, emitBlock, reorganize } =
      setupMocks({ blocks: hashes })

    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    const reorgListener = mockFn((_: BlockRecord[]): void => {})
    blockDownloader.onReorg(reorgListener)
    const newBlocksListener = mockFn((_: BlockRecord[]): void => {})
    blockDownloader.onNewBlocks(newBlocksListener)

    await blockDownloader.start()

    hashes.forEach((hash, i) => {
      emitBlock({
        hash: hash.toString(),
        number: i + 1,
        parentHash: (hashes[i - 1] || INITIAL_BLOCK.hash).toString(),
        timestamp: 0,
      })
    })

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()
      expect(blocksInDb).toBeAnArrayOfLength(3)
    })

    expect(await blockRepository.getAll()).toEqual([
      { hash: h1, number: 1 },
      { hash: h2, number: 2 },
      { hash: h3a, number: 3 },
    ])

    const h3b = Hash256.fake('3b')
    const h4b = Hash256.fake('4b')
    const blocks = reorganize([h1, h2, h3b, h4b])

    emitBlock(blocks[4]!)

    await waitForExpect(() => {
      expect(reorgListener).toHaveBeenCalledExactlyWith([
        [
          [
            { hash: h3b, number: 3 },
            { hash: h4b, number: 4 },
          ],
        ],
      ])
    })

    await waitForExpect(() => {
      expect(reorgListener).toHaveBeenCalledExactlyWith([
        [
          [
            { number: 3, hash: h3b },
            { number: 4, hash: h4b },
          ],
        ],
      ])
    })

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()

      expect(blocksInDb).toEqual([
        { hash: h1, number: 1 },
        { hash: h2, number: 2 },
        { hash: h3b, number: 3 },
        { hash: h4b, number: 4 },
      ])
    })
  })

  it('handles reorgs in incoming data', async () => {
    const h1 = Hash256.fake('1')
    const h2 = Hash256.fake('2')
    const blocks: BlocksDict = {
      1: {
        hash: h1.toString(),
        parentHash: INITIAL_BLOCK.hash.toString(),
        number: 1,
        timestamp: 0,
      },
      2: {
        hash: h2.toString(),
        parentHash: h1.toString(),
        number: 2,
        timestamp: 0,
      },
    }

    const { blockRepository, ethereumClient, emitBlock, reorganize } =
      setupMocks({ blocks })

    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    const reorgListener = mockFn((_: BlockRecord[]): void => {})
    blockDownloader.onReorg(reorgListener)
    const newBlocksListener = mockFn((_: BlockRecord[]): void => {})
    blockDownloader.onNewBlocks(newBlocksListener)

    await blockDownloader.start()

    Object.values(blocks).forEach((block) => block && emitBlock(block))

    const h3a = Hash256.fake('3a')
    const h3b = Hash256.fake('3b')
    const h4b = Hash256.fake('4b')
    const blockH4b = {
      hash: h4b.toString(),
      // The first time we get h4.b, we won't know about h3.b.
      parentHash: h3b.toString(),
      number: 4,
      timestamp: 0,
    }

    reorganize({
      ...blocks,
      3: [
        // The first time we ask for block 3, we'll get h3.a, the second time, we'll get h3.b.
        {
          hash: h3a.toString(),
          parentHash: h2.toString(),
          number: 3,
          timestamp: 0,
        },
        {
          hash: h3b.toString(),
          parentHash: h2.toString(),
          number: 3,
          timestamp: 0,
        },
      ],
      4: blockH4b,
    })

    emitBlock(blockH4b)

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()
      expect(blocksInDb).toEqual([
        { hash: h1, number: 1 },
        { hash: h2, number: 2 },
        { hash: h3b, number: 3 },
        { hash: h4b, number: 4 },
      ])
    })

    // There was no reorg on the data we currently have in the database, so
    // we don't need to emit any event.
    expect(reorgListener).toHaveBeenCalledExactlyWith([])

    expect(newBlocksListener).toHaveBeenCalledExactlyWith([
      [[{ number: 1, hash: h1 }]],
      [[{ number: 2, hash: h2 }]],
      [
        [
          { number: 3, hash: h3b },
          { number: 4, hash: h4b },
        ],
      ],
    ])
  })

  it('handles reorgs between the last known block and the next one', async () => {
    const h1b = Hash256.fake('1b')
    const h2b = Hash256.fake('2b')

    const blocks: BlocksDict = {
      1: {
        hash: h1b.toString(),
        number: 1,
        parentHash: INITIAL_BLOCK.hash.toString(),
        timestamp: 0,
      },
      2: {
        hash: h2b.toString(),
        number: 2,
        parentHash: h1b.toString(),
        timestamp: 0,
      },
    }

    const { blockRepository, ethereumClient, emitBlock } = setupMocks({
      blocks,
    })

    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    const reorgListener = mockFn((_: BlockRecord[]): void => {})
    blockDownloader.onReorg(reorgListener)

    await blockDownloader.start()

    const h1a = Hash256.fake('1a')

    emitBlock({
      hash: h1a.toString(),
      number: 1,
      parentHash: INITIAL_BLOCK.hash.toString(),
      timestamp: 0,
    })

    await waitForExpect(() => {
      expect(blockDownloader.getLastKnownBlock()).toEqual(
        expect.objectWith({ hash: h1a, number: 1 })
      )
    })

    emitBlock(blocks[2]!)

    await waitForExpect(async () => {
      expect(reorgListener).toHaveBeenCalledExactlyWith([
        [
          [
            { number: 1, hash: h1b },
            { number: 2, hash: h2b },
          ],
        ],
      ])
    })

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()
      expect(blocksInDb).toEqual([
        { hash: h1b, number: 1 },
        { hash: h2b, number: 2 },
      ])
    })
  })

  it('returns last known block', async () => {
    const h1 = Hash256.fake('1')
    const { blockRepository, ethereumClient, emitBlock } = setupMocks({
      blocks: [h1],
    })
    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    expect(() => blockDownloader.getLastKnownBlock()).toThrow('Not started')

    await blockDownloader.start()

    expect(blockDownloader.getLastKnownBlock()).toEqual(
      expect.objectWith({ number: 0, hash: INITIAL_BLOCK.hash })
    )

    emitBlock({
      number: 1,
      hash: h1.toString(),
      parentHash: INITIAL_BLOCK.hash.toString(),
      timestamp: 0,
    })

    await waitForExpect(() => {
      expect(blockDownloader.getLastKnownBlock()).toEqual(
        expect.objectWith({ number: 1, hash: h1 })
      )
    })
  })

  it('shows status', async () => {
    const h1 = Hash256.fake('1000')
    const { blockRepository, ethereumClient, emitBlock } = setupMocks({
      blocks: [h1],
    })
    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    expect<object>(blockDownloader.getStatus()).toEqual({
      status: 'not-started',
    })

    await blockDownloader.start()

    expect<object>(blockDownloader.getStatus()).toEqual({
      status: 'working',
      lastKnownBlock: INITIAL_BLOCK,
    })

    emitBlock({
      hash: h1.toString(),
      parentHash: INITIAL_BLOCK.hash.toString(),
      number: 1,
      timestamp: 0,
    })

    await waitForExpect(() => {
      expect<object>(blockDownloader.getStatus()).toEqual({
        status: 'working',
        lastKnownBlock: {
          number: 1,
          hash: h1.toString(),
        },
      })
    })
  })

  describe(isConsistentChain.name, () => {
    it('returns true for less than 2 blocks', () => {
      expect(isConsistentChain([])).toEqual(true)
      expect(isConsistentChain([{ hash: 'h1', parentHash: 'h0' }])).toEqual(
        true
      )
    })

    it('returns true if the parentHash of every block is the hash of the last block', () => {
      expect(
        isConsistentChain([
          { hash: 'h1', parentHash: 'h0' },
          { hash: 'h2', parentHash: 'h1' },
          { hash: 'h3', parentHash: 'h2' },
          { hash: 'h4', parentHash: 'h3' },
        ])
      ).toEqual(true)
    })

    it('returns false if a parentHash of a block is not the hash of the last block', () => {
      expect(
        isConsistentChain([
          { hash: 'h1', parentHash: 'h0' },
          { hash: 'h2.a', parentHash: 'h1' },
          { hash: 'h3', parentHash: 'h2.b' },
          { hash: 'h4', parentHash: 'h3' },
        ])
      ).toEqual(false)

      expect(
        isConsistentChain([
          { hash: 'h3.a', parentHash: 'h2' },
          { hash: 'h4.b', parentHash: 'h3.b' },
        ])
      ).toEqual(false)
    })
  })
})

type BlockHashes = Array<Hash256 | string>
type BlocksDict = Partial<Record<BlockTag, IncomingBlock | IncomingBlock[]>>
const deserializeBlockHashes = (blockHashes: BlockHashes): BlocksDict => {
  return Object.fromEntries(
    blockHashes.map((hash, i): [number, IncomingBlock] => [
      i + 1,
      {
        hash: hash.toString(),
        number: i + 1,
        parentHash: (
          blockHashes[i - 1] || INITIAL_BLOCK.hash.toString()
        ).toString(),
        timestamp: 0,
      },
    ])
  )
}

function setupMocks(
  options: {
    blocks?: BlocksDict | BlockHashes
  } = {}
) {
  let _newBlockEventHandler: ((block: IncomingBlock) => void) | undefined

  function createGetBlock(blockchain: BlocksDict | BlockHashes) {
    return async (blockTagOrHash: BlockTag): Promise<providers.Block> => {
      const blocks: BlocksDict = {
        0: { hash: 'h0', number: 0, parentHash: '', timestamp: 0 },
        ...(Array.isArray(blockchain)
          ? deserializeBlockHashes(blockchain)
          : blockchain),
      }

      let res = blocks[blockTagOrHash]
      if (Array.isArray(res)) {
        res = res.length > 1 ? res.shift() : res[0]
      }
      if (!res) throw new Error(`unexpected blockTag ${blockTagOrHash}`)
      return res as providers.Block
    }
  }

  const ethereumClient = mock<EthereumClient>({
    onBlock: (handler) => {
      _newBlockEventHandler = handler as (block: IncomingBlock) => void
      return () => (_newBlockEventHandler = undefined)
    },
    getBlock: createGetBlock(options.blocks || {}),
  })

  let _blockRecords: BlockRecord[] = []
  const blockRepository = mock<BlockRepository>({
    add: async (blocks) => {
      _blockRecords.push(...blocks)
    },
    getAll: async () => _blockRecords,
    getLast: async () =>
      orderBy(_blockRecords, (x) => x.number, 'desc')[0] || INITIAL_BLOCK,
    getByNumber: async (number) =>
      _blockRecords.find((x) => x.number === number),
    deleteAllAfter: async (number) => {
      _blockRecords = _blockRecords.filter((x) => x.number <= number)
    },
    getFirst: () => INITIAL_BLOCK,
  })

  return {
    ethereumClient,
    blockRepository,
    emitBlock(block: IncomingBlock | IncomingBlock[]): void {
      if (_newBlockEventHandler)
        return _newBlockEventHandler(Array.isArray(block) ? block[0] : block)

      throw new Error('No listener registered')
    },
    reorganize(blocks: BlocksDict | BlockHashes) {
      const dict = Array.isArray(blocks)
        ? deserializeBlockHashes(blocks)
        : blocks
      ethereumClient.getBlock = mockFn(createGetBlock(dict))
      return dict
    },
  }
}
