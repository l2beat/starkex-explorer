import { EthereumAddress, Hash256 } from '@explorer/types'
import { expect, mockFn } from 'earljs'
import { providers } from 'ethers'

import { BlockRange } from '../../../src/model'
import { EthereumClient } from '../../../src/peripherals/ethereum/EthereumClient'
import { mock } from '../../mock'

describe(EthereumClient.name, () => {
  describe(EthereumClient.prototype.getLogsInRange.name, () => {
    const filter = { address: EthereumAddress.fake().toString() }
    const SAFE_BLOCK_DISTANCE = 40

    it('works for a block range without hashes', async () => {
      const blockRange = new BlockRange([], 5, 10)

      const ethereumClient = new EthereumClient('', SAFE_BLOCK_DISTANCE)
      const getLogs = mockFn().resolvesTo([])
      ethereumClient['provider'] = mock<providers.JsonRpcProvider>({ getLogs })

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
      ethereumClient['provider'] = mock<providers.JsonRpcProvider>({ getLogs })

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
      ethereumClient['provider'] = mock<providers.JsonRpcProvider>({ getLogs })

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
      ethereumClient['provider'] = mock<providers.JsonRpcProvider>({ getLogs })

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
  })
})
