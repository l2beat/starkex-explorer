import { EthereumAddress, Hash256 } from '@explorer/types'
import { expect, mockFn } from 'earljs'
import { providers } from 'ethers'

import { BlockRange } from '../../model'
import { mock } from '../../test/mock'
import { EthereumClient } from './EthereumClient'
import { HackJsonRpcProvider } from './HackJsonRpcProvider'

describe(EthereumClient.name, () => {
  const SAFE_BLOCK_DISTANCE = 40

  describe(EthereumClient.prototype.getLogsInRange.name, () => {
    const filter = { address: EthereumAddress.fake().toString() }

    it('works for a block range without hashes', async () => {
      const blockRange = new BlockRange([], 5, 10)

      const getLogs = mockFn().resolvesTo([])
      const provider = mock<HackJsonRpcProvider>({ getLogs })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      await ethereumClient.getLogsInRange(blockRange, filter)

      expect(getLogs).toHaveBeenCalledExactlyWith([
        [{ ...filter, fromBlock: 5, toBlock: 9, topics: undefined }],
      ])
    })

    it('works for a block range with some hashes', async () => {
      const blockRange = new BlockRange(
        [
          { number: 8, hash: Hash256.fake('8') },
          { number: 9, hash: Hash256.fake('9') },
        ],
        5,
        10
      )

      const getLogs = mockFn().resolvesTo([])
      const provider = mock<HackJsonRpcProvider>({ getLogs })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      await ethereumClient.getLogsInRange(blockRange, filter)

      expect(getLogs).toHaveBeenCalledExactlyWith([
        [{ ...filter, fromBlock: 5, toBlock: 7, topics: undefined }],
        [{ ...filter, blockHash: Hash256.fake('8').toString() }],
        [{ ...filter, blockHash: Hash256.fake('9').toString() }],
      ])
    })

    it('works for a single block single hash', async () => {
      const blockRange = new BlockRange([
        { number: 8, hash: Hash256.fake('8') },
      ])

      const getLogs = mockFn().resolvesTo([])
      const provider = mock<HackJsonRpcProvider>({ getLogs })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      await ethereumClient.getLogsInRange(blockRange, filter)

      expect(getLogs).toHaveBeenCalledExactlyWith([
        [{ ...filter, blockHash: Hash256.fake('8').toString() }],
      ])
    })

    it('works for a lot of hashes', async () => {
      const blockRange = new BlockRange(
        Array.from({ length: 500 }).map((v, i) => ({
          number: 1000 + i,
          hash: Hash256.fake(`${1000 + i}`),
        }))
      )

      const getLogs = mockFn().resolvesTo([])
      const provider = mock<HackJsonRpcProvider>({ getLogs })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      await ethereumClient.getLogsInRange(blockRange, filter)

      expect(getLogs).toHaveBeenCalledExactlyWith([
        [
          {
            ...filter,
            fromBlock: 1000,
            toBlock: 1499 - SAFE_BLOCK_DISTANCE,
            topics: undefined,
          },
        ],
        ...Array.from({ length: SAFE_BLOCK_DISTANCE }).map((v, i) => [
          {
            ...filter,
            blockHash: Hash256.fake(
              `${1500 - SAFE_BLOCK_DISTANCE + i}`
            ).toString(),
          },
        ]),
      ])
    })

    it('crashes on logs from reorged history', async () => {
      const blockRange = new BlockRange([
        {
          number: 11905858,
          hash: Hash256(
            '0x12cb67ca790064c5220f91ecf730ccdc0a558f03c77faf43509bc4790cfd3e55'
          ),
        },
        {
          number: 11905919,
          hash: Hash256.fake('deadbeef'),
        },
      ])

      const log: providers.Log = {
        blockNumber: 12000000,
        blockHash: Hash256.fake().toString(),
        transactionIndex: 1,
        removed: false,
        address: EthereumAddress.fake().toString(),
        data: '',
        topics: [],
        transactionHash: Hash256.fake().toString(),
        logIndex: 0,
      }

      const getLogs = mockFn().resolvesTo([]).resolvesToOnce([log])
      const provider = mock<HackJsonRpcProvider>({ getLogs })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      await expect(
        ethereumClient.getLogsInRange(blockRange, filter)
      ).toBeRejected('all logs must be from the block range')
    })
  })

  describe(EthereumClient.prototype.getAllLogs.name, () => {
    it('divides on two calls', async () => {
      const provider = mock<HackJsonRpcProvider>({
        getLogs: mockFn()
          .throwsOnce(new Error('Log response size exceeded'))
          .returnsOnce([])
          .returnsOnce([]),
      })

      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      const address = EthereumAddress.fake()
      const topic = 'aaaa'
      await ethereumClient.getAllLogs(address.toString(), [topic], 1000, 2000)

      expect(provider.getLogs).toHaveBeenCalledExactlyWith([
        [
          {
            address: address.toString(),
            topics: [topic],
            fromBlock: 1000,
            toBlock: 2000,
          },
        ],
        [
          {
            address: address.toString(),
            topics: [topic],
            fromBlock: 1000,
            toBlock: 1500,
          },
        ],
        [
          {
            address: address.toString(),
            topics: [topic],
            fromBlock: 1501,
            toBlock: 2000,
          },
        ],
      ])
    })

    it('correctly divides range of two', async () => {
      const provider = mock<HackJsonRpcProvider>({
        getLogs: mockFn()
          .throwsOnce(new Error('Log response size exceeded'))
          .returnsOnce([])
          .returnsOnce([]),
      })

      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      const address = EthereumAddress.fake()
      const topic = 'aaaa'
      await ethereumClient.getAllLogs(address.toString(), [topic], 1, 2)

      expect(provider.getLogs).toHaveBeenCalledExactlyWith([
        [
          {
            address: address.toString(),
            topics: [topic],
            fromBlock: 1,
            toBlock: 2,
          },
        ],
        [
          {
            address: address.toString(),
            topics: [topic],
            fromBlock: 1,
            toBlock: 1,
          },
        ],
        [
          {
            address: address.toString(),
            topics: [topic],
            fromBlock: 2,
            toBlock: 2,
          },
        ],
      ])
    })

    it('fromBlock === toBlock', async () => {
      const provider = mock<HackJsonRpcProvider>({
        getLogs: mockFn().throwsOnce(new Error('Log response size exceeded')),
      })

      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      const address = EthereumAddress.fake()
      const topic = 'aaaa'

      await expect(
        ethereumClient.getAllLogs(address.toString(), [topic], 1, 1)
      ).toBeRejected()

      expect(provider.getLogs).toHaveBeenCalledExactlyWith([
        [
          {
            address: address.toString(),
            topics: [topic],
            fromBlock: 1,
            toBlock: 1,
          },
        ],
      ])
    })
  })
})
