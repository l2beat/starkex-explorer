import { EthereumAddress, Hash256 } from '@explorer/types'
import { expect, mockFn } from 'earljs'
import { providers } from 'ethers'

import { BlockRange } from '../../../src/model'
import { EthereumClient } from '../../../src/peripherals/ethereum/EthereumClient'
import { mock } from '../../../src/test/mock'

describe(EthereumClient.name, () => {
  describe(EthereumClient.prototype.getLogsInRange.name, () => {
    const filter = { address: EthereumAddress.fake().toString() }
    const SAFE_BLOCK_DISTANCE = 40

    it('works for a block range without hashes', async () => {
      const blockRange = new BlockRange([], 5, 10)

      const ethereumClient = new EthereumClient('', SAFE_BLOCK_DISTANCE)
      const getLogs = mockFn().resolvesTo([])
      // @ts-expect-error acccess private member
      ethereumClient.provider = mock<providers.JsonRpcProvider>({ getLogs })

      await ethereumClient.getLogsInRange(blockRange, filter)

      expect(getLogs).toHaveBeenCalledExactlyWith([
        [{ ...filter, fromBlock: 5, toBlock: 9 }],
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

      const ethereumClient = new EthereumClient('', SAFE_BLOCK_DISTANCE)
      const getLogs = mockFn().resolvesTo([])
      // @ts-expect-error acccess private member
      ethereumClient.provider = mock<providers.JsonRpcProvider>({ getLogs })

      await ethereumClient.getLogsInRange(blockRange, filter)

      expect(getLogs).toHaveBeenCalledExactlyWith([
        [{ ...filter, fromBlock: 5, toBlock: 7 }],
        [{ ...filter, blockHash: Hash256.fake('8').toString() }],
        [{ ...filter, blockHash: Hash256.fake('9').toString() }],
      ])
    })

    it('works for a single block single hash', async () => {
      const blockRange = new BlockRange([
        { number: 8, hash: Hash256.fake('8') },
      ])

      const ethereumClient = new EthereumClient('', SAFE_BLOCK_DISTANCE)
      const getLogs = mockFn().resolvesTo([])
      // @ts-expect-error acccess private member
      ethereumClient.provider = mock<providers.JsonRpcProvider>({ getLogs })

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

      const ethereumClient = new EthereumClient('', SAFE_BLOCK_DISTANCE)
      const getLogs = mockFn().resolvesTo([])
      // @ts-expect-error acccess private member
      ethereumClient.provider = mock<providers.JsonRpcProvider>({ getLogs })

      await ethereumClient.getLogsInRange(blockRange, filter)

      expect(getLogs).toHaveBeenCalledExactlyWith([
        [{ ...filter, fromBlock: 1000, toBlock: 1499 - SAFE_BLOCK_DISTANCE }],
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
      const ethereumClient = new EthereumClient('', SAFE_BLOCK_DISTANCE)
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
      // @ts-expect-error acccess private member
      ethereumClient.provider = mock<providers.JsonRpcProvider>({ getLogs })

      await expect(
        ethereumClient.getLogsInRange(blockRange, filter)
      ).toBeRejected('all logs must be from the block range')
    })
  })
})
