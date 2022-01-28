import { expect, mockFn } from 'earljs'
import { providers } from 'ethers'
import { last, orderBy, range, sortBy } from 'lodash'
import waitForExpect from 'wait-for-expect'

import {
  BlockDownloader,
  IncomingBlock,
  isConsistentChain,
} from '../../src/core/BlockDownloader'
import { BlockRange } from '../../src/model'
import {
  BlockRecord,
  BlockRepository,
} from '../../src/peripherals/database/BlockRepository'
import { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { BlockTag } from '../../src/peripherals/ethereum/types'
import { Logger, LogLevel } from '../../src/tools/Logger'
import { mock } from '../mock'

const INITIAL_BLOCK: BlockRecord = { number: 0, hash: 'h0' }

describe(BlockDownloader.name, () => {
  const logger = new Logger({ format: 'pretty', logLevel: LogLevel.ERROR })

  it('saves obtained blocks to db', async () => {
    const { blockRepository, ethereumClient, emitBlock } = setupMocks({
      blocks: ['h1', 'h2', 'h3'],
    })
    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    await blockDownloader.start()

    emitBlock({ timestamp: 0, hash: 'h1', number: 1, parentHash: 'h0' })
    emitBlock({ timestamp: 0, hash: 'h2', number: 2, parentHash: 'h1' })
    emitBlock({ timestamp: 0, hash: 'h3', number: 3, parentHash: 'h2' })

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()

      expect(blocksInDb).toBeAnArrayOfLength(3)
      expect(blocksInDb).toEqual([
        { hash: 'h1', number: 1 },
        { hash: 'h2', number: 2 },
        { hash: 'h3', number: 3 },
      ])
    })
  })

  it('handles gaps between received blocks (in case of server restarts)', async () => {
    const { blockRepository, ethereumClient, emitBlock } = setupMocks({
      blocks: ['h1', 'h2', 'h3', 'h4'],
    })
    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    const stop = await blockDownloader.start()

    emitBlock({
      hash: 'h1',
      number: 1,
      parentHash: 'h0',
      timestamp: 0,
    })

    stop()

    await blockDownloader.start()

    emitBlock({
      hash: 'h4',
      number: 4,
      parentHash: 'h3',
      timestamp: 0,
    })

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()

      expect(blocksInDb).toEqual([
        { hash: 'h1', number: 1 },
        { hash: 'h2', number: 2 },
        { hash: 'h3', number: 3 },
        { hash: 'h4', number: 4 },
      ])
    })
  })

  it('calls `onNewBlocks` listeners the range of new blocks obtained', async () => {
    const { blockRepository, ethereumClient, emitBlock } = setupMocks({
      blocks: ['h1', 'h2', 'h3', 'h4'],
    })
    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    const newBlocksListener = mockFn((_: BlockRange): void => {})
    blockDownloader.onNewBlocks(newBlocksListener)

    await blockDownloader.start()

    emitBlock({
      hash: 'h1',
      number: 1,
      parentHash: 'h0',
      timestamp: 0,
    })

    await waitForExpect(() => {
      expect(newBlocksListener).toHaveBeenCalledExactlyWith([
        [new BlockRange([{ hash: 'h1', number: 1 }])],
      ])
    })

    await blockDownloader.start()

    emitBlock({
      hash: 'h4',
      number: 4,
      parentHash: 'h3',
      timestamp: 0,
    })

    await waitForExpect(() => {
      expect(newBlocksListener).toHaveBeenCalledExactlyWith([
        [BlockRange.from({ 1: 'h1' })],
        [BlockRange.from({ 2: 'h2', 3: 'h3', 4: 'h4' })],
      ])
    })
  })

  it('handles reorgs in the past (finding reorg point)', async () => {
    const hashes = range(1, 21)
      .map((i) => `h${i}`)
      .concat(['h21.a', 'h22.a'])

    const { blockRepository, ethereumClient, emitBlock, reorganize } =
      setupMocks({ blocks: hashes })
    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    const reorgListener = mockFn((_: { firstChangedBlock: number }): void => {})
    blockDownloader.onReorg(reorgListener)
    const newBlocksListener = mockFn((_: BlockRange): void => {})
    blockDownloader.onNewBlocks(newBlocksListener)

    await blockDownloader.start()

    hashes.forEach((hash, i) => {
      emitBlock({
        hash,
        number: i + 1,
        parentHash: hashes[i - 1] || 'h0',
        timestamp: 0,
      })
    })

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()
      expect(blocksInDb).toBeAnArrayOfLength(22)
    })

    const blocks = reorganize(
      range(1, 21)
        .map((i) => `h${i}`)
        .concat(['h21.b', 'h22.b', 'h23.b'])
    )

    emitBlock(blocks[23]!)

    await waitForExpect(() => {
      expect(reorgListener).toHaveBeenCalledExactlyWith([
        // last known block is number 22 and the first reorg point we consider
        // is `(lastKnown - 10) + 1`
        [{ firstChangedBlock: hashes.length - 10 + 1 }],
      ])
    })

    const expectedNewBlocksEventArgs = [
      ...range(1, 23).map((i) => ({ from: i, to: i })),
      { from: 13, to: 23 },
    ]

    await waitForExpect(() => {
      expect(newBlocksListener).toHaveBeenCalledExactlyWith(
        expect.arrayOfLength(expectedNewBlocksEventArgs.length)
      )
    })
    expect(newBlocksListener).toHaveBeenCalledExactlyWith(
      expectedNewBlocksEventArgs.map((blockRange) => [
        expect.objectWith(blockRange),
      ])
    )

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()

      expect(blocksInDb).toEqual([
        ...range(1, 21).map((i): BlockRecord => ({ hash: `h${i}`, number: i })),
        { hash: 'h21.b', number: 21 },
        { hash: 'h22.b', number: 22 },
        { hash: 'h23.b', number: 23 },
      ])
    })
  })

  it('handles reorgs in the past (removing all)', async () => {
    const hashes = ['h1', 'h2', 'h3.a']

    const { blockRepository, ethereumClient, emitBlock, reorganize } =
      setupMocks({ blocks: hashes })

    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    const reorgListener = mockFn((_: { firstChangedBlock: number }): void => {})
    blockDownloader.onReorg(reorgListener)
    const newBlocksListener = mockFn((_: BlockRange): void => {})
    blockDownloader.onNewBlocks(newBlocksListener)

    await blockDownloader.start()

    hashes.forEach((hash, i) => {
      emitBlock({
        hash,
        number: i + 1,
        parentHash: hashes[i - 1] || 'h0',
        timestamp: 0,
      })
    })

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()
      expect(blocksInDb).toBeAnArrayOfLength(3)
    })

    expect(await blockRepository.getAll()).toEqual([
      { hash: 'h1', number: 1 },
      { hash: 'h2', number: 2 },
      { hash: 'h3.a', number: 3 },
    ])

    const blocks = reorganize(['h1', 'h2', 'h3.b', 'h4.b'])

    emitBlock(blocks[4]!)

    await waitForExpect(() => {
      expect(reorgListener).toHaveBeenCalledExactlyWith([
        [{ firstChangedBlock: 1 }],
      ])
    })

    const expectedNewBlocksEventArgs = [
      { from: 1, to: 1 },
      { from: 2, to: 2 },
      { from: 3, to: 3 },
      { from: 1, to: 4 },
    ]

    await waitForExpect(() => {
      expect(newBlocksListener).toHaveBeenCalledExactlyWith(
        expect.arrayOfLength(expectedNewBlocksEventArgs.length)
      )
    })
    expect(newBlocksListener).toHaveBeenCalledExactlyWith(
      expectedNewBlocksEventArgs.map((blockRange) => [
        expect.objectWith(blockRange),
      ])
    )

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()

      expect(blocksInDb).toEqual([
        { hash: 'h1', number: 1 },
        { hash: 'h2', number: 2 },
        { hash: 'h3.b', number: 3 },
        { hash: 'h4.b', number: 4 },
      ])
    })
  })

  it('handles reorgs in incoming data', async () => {
    const blocks: BlocksDict = {
      1: {
        hash: 'h1',
        parentHash: 'h0',
        number: 1,
        timestamp: 0,
      },
      2: {
        hash: 'h2',
        parentHash: 'h1',
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

    const reorgListener = mockFn((_: { firstChangedBlock: number }): void => {})
    blockDownloader.onReorg(reorgListener)
    const newBlocksListener = mockFn((_: BlockRange): void => {})
    blockDownloader.onNewBlocks(newBlocksListener)

    await blockDownloader.start()

    Object.values(blocks).forEach((block) => block && emitBlock(block))

    const h4b = {
      hash: 'h4.b',
      // The first time we get h4.b, we won't know about h3.b.
      parentHash: 'h3.b',
      number: 4,
      timestamp: 0,
    }

    reorganize({
      ...blocks,
      3: [
        // The first time we ask for block 3, we'll get h3.a, the second time, we'll get h3.b.
        {
          hash: 'h3.a',
          parentHash: 'h2',
          number: 3,
          timestamp: 0,
        },
        {
          hash: 'h3.b',
          parentHash: 'h2',
          number: 3,
          timestamp: 0,
        },
      ],
      4: h4b,
    })

    emitBlock(h4b)

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()
      expect(blocksInDb).toEqual([
        { hash: 'h1', number: 1 },
        { hash: 'h2', number: 2 },
        { hash: 'h3.b', number: 3 },
        { hash: 'h4.b', number: 4 },
      ])
    })

    // There was no reorg on the data we currently have in the database, so
    // we don't need to emit any event.
    expect(reorgListener).toHaveBeenCalledExactlyWith([])

    expect(newBlocksListener).toHaveBeenCalledExactlyWith([
      [new BlockRange([{ number: 1, hash: 'h1' }])],
      [new BlockRange([{ number: 2, hash: 'h2' }])],
      [
        new BlockRange([
          { number: 3, hash: 'h3.b' },
          { number: 4, hash: 'h4.b' },
        ]),
      ],
    ])
  })

  it('handles reorgs between the last known block and the next one', async () => {
    const blocks: BlocksDict = {
      1: { hash: 'h1.b', number: 1, parentHash: 'h0', timestamp: 0 },
      2: { hash: 'h2.b', number: 2, parentHash: 'h1.b', timestamp: 0 },
    }

    const { blockRepository, ethereumClient, emitBlock } = setupMocks({
      blocks,
    })

    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    const reorgListener = mockFn((_: { firstChangedBlock: number }): void => {})
    blockDownloader.onReorg(reorgListener)
    const newBlocksListener = mockFn((_: BlockRange): void => {})
    blockDownloader.onNewBlocks(newBlocksListener)

    await blockDownloader.start()

    emitBlock({ hash: 'h1.a', number: 1, parentHash: 'h0', timestamp: 0 })

    await waitForExpect(() => {
      expect(blockDownloader.getLastKnownBlock()).toEqual({
        hash: 'h1.a',
        number: 1,
      })
    })

    emitBlock(blocks[2]!)

    await waitForExpect(async () => {
      expect(reorgListener).toHaveBeenCalledExactlyWith([
        [{ firstChangedBlock: 1 }],
      ])
    })

    const expectedNewBlocksEventArgs = [
      { from: 1, to: 1 },
      { from: 1, to: 2 },
    ]

    await waitForExpect(() => {
      expect(newBlocksListener).toHaveBeenCalledExactlyWith(
        expect.arrayOfLength(expectedNewBlocksEventArgs.length)
      )
    })
    expect(newBlocksListener).toHaveBeenCalledExactlyWith(
      expectedNewBlocksEventArgs.map((blockRange) => [
        expect.objectWith(blockRange),
      ])
    )

    await waitForExpect(async () => {
      const blocksInDb = await blockRepository.getAll()
      expect(blocksInDb).toEqual([
        { hash: 'h1.b', number: 1 },
        { hash: 'h2.b', number: 2 },
      ])
    })
  })

  it('returns last known block', async () => {
    const { blockRepository, ethereumClient, emitBlock } = setupMocks({
      blocks: ['h1'],
    })
    const blockDownloader = new BlockDownloader(
      ethereumClient,
      blockRepository,
      logger
    )

    expect(() => blockDownloader.getLastKnownBlock()).toThrow('Not started')

    await blockDownloader.start()

    expect(blockDownloader.getLastKnownBlock()).toEqual({
      number: 0,
      hash: 'h0',
    })

    emitBlock({ number: 1, hash: 'h1', parentHash: 'h0', timestamp: 0 })

    await waitForExpect(() => {
      expect(blockDownloader.getLastKnownBlock()).toEqual({
        number: 1,
        hash: 'h1',
      })
    })
  })

  it('shows status', async () => {
    const { blockRepository, ethereumClient, emitBlock } = setupMocks({
      blocks: ['test--show-status--hash'],
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
      hash: 'test--show-status--hash',
      parentHash: 'h0',
      number: 1,
      timestamp: 0,
    })

    await waitForExpect(() => {
      expect<object>(blockDownloader.getStatus()).toEqual({
        status: 'working',
        lastKnownBlock: {
          number: 1,
          hash: 'test--show-status--hash',
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

type BlockHashes = string[]
type BlocksDict = Partial<Record<BlockTag, IncomingBlock | IncomingBlock[]>>
const deserializeBlockHashes = (blockHashes: BlockHashes): BlocksDict => {
  return Object.fromEntries(
    blockHashes.map((hash, i): [number, IncomingBlock] => [
      i + 1,
      {
        hash,
        number: i + 1,
        parentHash: blockHashes[i - 1] || 'h0',
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
