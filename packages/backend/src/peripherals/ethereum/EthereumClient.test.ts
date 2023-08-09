import { EthereumAddress, Hash256 } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'
import { ethers, providers } from 'ethers'
import range from 'lodash/range'

import { BlockRange } from '../../model'
import { EthereumClient } from './EthereumClient'
import { HackJsonRpcProvider } from './HackJsonRpcProvider'

describe(EthereumClient.name, () => {
  const SAFE_BLOCK_DISTANCE = 40

  describe(EthereumClient.prototype.getLogsInRange.name, () => {
    const filter = { address: EthereumAddress.fake().toString() }

    it('works for a block range without hashes', async () => {
      const blockRange = new BlockRange([], 5, 10)

      const getLogs = mockFn().resolvesTo([])
      const provider = mockObject<HackJsonRpcProvider>({ getLogs })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      await ethereumClient.getLogsInRange(blockRange, filter)

      expect(getLogs).toHaveBeenOnlyCalledWith({
        ...filter,
        fromBlock: 5,
        toBlock: 9,
        topics: undefined,
      })
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
      const provider = mockObject<HackJsonRpcProvider>({ getLogs })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      await ethereumClient.getLogsInRange(blockRange, filter)

      expect(getLogs).toHaveBeenCalledTimes(3)
      expect(getLogs).toHaveBeenNthCalledWith(1, {
        ...filter,
        fromBlock: 5,
        toBlock: 7,
        topics: undefined,
      })
      expect(getLogs).toHaveBeenNthCalledWith(2, {
        ...filter,
        blockHash: Hash256.fake('8').toString(),
      })
      expect(getLogs).toHaveBeenNthCalledWith(3, {
        ...filter,
        blockHash: Hash256.fake('9').toString(),
      })
    })

    it('works for a single block single hash', async () => {
      const blockRange = new BlockRange([
        { number: 8, hash: Hash256.fake('8') },
      ])

      const getLogs = mockFn().resolvesTo([])
      const provider = mockObject<HackJsonRpcProvider>({ getLogs })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      await ethereumClient.getLogsInRange(blockRange, filter)

      expect(getLogs).toHaveBeenOnlyCalledWith({
        ...filter,
        blockHash: Hash256.fake('8').toString(),
      })
    })

    it('works for a lot of hashes', async () => {
      const blockRange = new BlockRange(
        range(500).map((i) => ({
          number: 1000 + i,
          hash: Hash256.fake(`${1000 + i}`),
        }))
      )

      const getLogs = mockFn().resolvesTo([])
      const provider = mockObject<HackJsonRpcProvider>({ getLogs })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      await ethereumClient.getLogsInRange(blockRange, filter)

      expect(getLogs).toHaveBeenNthCalledWith(1, {
        ...filter,
        fromBlock: 1000,
        toBlock: 1499 - SAFE_BLOCK_DISTANCE,
        topics: undefined,
      })
      for (let i = 0; i < SAFE_BLOCK_DISTANCE; i++) {
        expect(getLogs).toHaveBeenNthCalledWith(i + 2, {
          ...filter,
          blockHash: Hash256.fake(
            `${1500 - SAFE_BLOCK_DISTANCE + i}`
          ).toString(),
        })
      }
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
      const provider = mockObject<HackJsonRpcProvider>({ getLogs })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      await expect(
        ethereumClient.getLogsInRange(blockRange, filter)
      ).toBeRejectedWith('all logs must be from the block range')
    })
  })

  describe(EthereumClient.prototype.getAllLogs.name, () => {
    it('divides on two calls', async () => {
      const provider = mockObject<HackJsonRpcProvider>({
        getLogs: mockFn()
          .throwsOnce(new Error('Log response size exceeded'))
          .returnsOnce([])
          .returnsOnce([]),
      })

      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      const address = EthereumAddress.fake()
      const topic = 'aaaa'
      await ethereumClient.getAllLogs(address.toString(), [topic], 1000, 2000)

      expect(provider.getLogs).toHaveBeenCalledTimes(3)
      expect(provider.getLogs).toHaveBeenNthCalledWith(1, {
        address: address.toString(),
        topics: [topic],
        fromBlock: 1000,
        toBlock: 2000,
      })
      expect(provider.getLogs).toHaveBeenNthCalledWith(2, {
        address: address.toString(),
        topics: [topic],
        fromBlock: 1000,
        toBlock: 1500,
      })
      expect(provider.getLogs).toHaveBeenNthCalledWith(3, {
        address: address.toString(),
        topics: [topic],
        fromBlock: 1501,
        toBlock: 2000,
      })
    })

    it('correctly divides range of two', async () => {
      const provider = mockObject<HackJsonRpcProvider>({
        getLogs: mockFn()
          .throwsOnce(new Error('Log response size exceeded'))
          .returnsOnce([])
          .returnsOnce([]),
      })

      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      const address = EthereumAddress.fake()
      const topic = 'aaaa'
      await ethereumClient.getAllLogs(address.toString(), [topic], 1, 2)

      expect(provider.getLogs).toHaveBeenCalledTimes(3)
      expect(provider.getLogs).toHaveBeenNthCalledWith(1, {
        address: address.toString(),
        topics: [topic],
        fromBlock: 1,
        toBlock: 2,
      })
      expect(provider.getLogs).toHaveBeenNthCalledWith(2, {
        address: address.toString(),
        topics: [topic],
        fromBlock: 1,
        toBlock: 1,
      })
      expect(provider.getLogs).toHaveBeenNthCalledWith(3, {
        address: address.toString(),
        topics: [topic],
        fromBlock: 2,
        toBlock: 2,
      })
    })

    it('fromBlock === toBlock', async () => {
      const provider = mockObject<HackJsonRpcProvider>({
        getLogs: mockFn().throwsOnce(new Error('Log response size exceeded')),
      })

      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      const address = EthereumAddress.fake()
      const topic = 'aaaa'

      await expect(
        ethereumClient.getAllLogs(address.toString(), [topic], 1, 1)
      ).toBeRejected()

      expect(provider.getLogs).toHaveBeenOnlyCalledWith({
        address: address.toString(),
        topics: [topic],
        fromBlock: 1,
        toBlock: 1,
      })
    })
  })

  describe(EthereumClient.prototype.call.name, () => {
    const address = EthereumAddress.fake()
    const abi =
      'function add(uint256 a, uint256 b) public view returns (uint256)'
    const name = 'add'
    const args = [100, 200]

    it('calls rawCall with correct arguments', async () => {
      const provider = mockObject<HackJsonRpcProvider>({
        call: mockFn().resolvesTo(
          '0x000000000000000000000000000000000000000000000000000000000000012c'
        ),
      })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      const result = await ethereumClient.call(address, name, abi, args)

      expect(result).toEqual([ethers.BigNumber.from(300), undefined])
      expect(provider.call).toHaveBeenOnlyCalledWith({
        to: address.toString(),
        data: '0x771602f7000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8',
      })
    })

    it('returns undefined and error if call fails with a revert', async () => {
      const provider = mockObject<HackJsonRpcProvider>({
        call: mockFn().rejectsWith(new Error('Transaction reverted')),
      })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      const result = await ethereumClient.call(address, name, abi, args)

      expect(result).toEqual([undefined, new Error('Transaction reverted')])
    })

    it('throws error in case of non-revert provider call error', async () => {
      const error = new Error('Some error')
      const provider = mockObject<HackJsonRpcProvider>({
        call: mockFn().rejectsWith(error),
      })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      await expect(
        ethereumClient.call(address, name, abi, args)
      ).toBeRejectedWith('Some error')
    })

    it('returns undefined and error if decoding response fails', async () => {
      const provider = mockObject<HackJsonRpcProvider>({
        call: mockFn().resolvesTo('errorString?!'),
      })
      const ethereumClient = new EthereumClient(provider, SAFE_BLOCK_DISTANCE)

      const result = await ethereumClient.call(address, name, abi, args)

      expect(result[0]).toEqual(undefined)
      expect(result[1]).toBeA(Error)
    })
  })
})
