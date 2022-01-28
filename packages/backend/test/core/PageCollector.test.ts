import { TransactionResponse } from '@ethersproject/abstract-provider'
import { expect } from 'earljs'
import { BigNumber, BigNumberish } from 'ethers'

import {
  bignumToPaddedString,
  LOG_MEMORY_PAGE_FACT_CONTINUOUS,
  PAGE_ABI,
  PageCollector,
} from '../../src/core/PageCollector'
import { BlockRange, Hash256 } from '../../src/model'
import {
  PageRecord,
  PageRepository,
} from '../../src/peripherals/database/PageRepository'
import type { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { mock } from '../mock'

describe(PageCollector.name, () => {
  it('fetches memory page logs and transactions and then saves records to repository', async () => {
    const ethereumClient = mock<EthereumClient>({
      getTransaction: async (txHash) => testData().getTransaction(txHash),
      getLogs: async () => testData().logs,
    })
    const pageRepository = mock<PageRepository>({
      add: async () => {},
    })

    const pageCollector = new PageCollector(ethereumClient, pageRepository)

    const blockRange = new BlockRange([
      {
        number: 9,
        hash: '0xdc022f1f9171af61f807e57d1f943d5491f6fb5f4235a9319638e30d54905e3c',
      },
      {
        number: 10,
        hash: '0xdc022f1f9171af61f807e57d1f943d5491f6fb5f4235a9319638e30d54905e3c',
      },
    ])

    const actualRecords = await pageCollector.collect(blockRange)

    const expectedRecords: PageRecord[] = [
      {
        blockNumber: 9,
        data: [5, 6, 7].map(BigNumber.from).map(bignumToPaddedString).join(''),
        pageHash: Hash256(
          '0x450c6bd64d9066a35eea0d4b9ec956d88dd2d3d8589321aa41d950f2f57a708f'
        ),
      },
      {
        blockNumber: 12,
        data: [8, 9, 10, 11, 12]
          .map(BigNumber.from)
          .map(bignumToPaddedString)
          .join(''),
        pageHash: Hash256(
          '0xa2485807235f3ee4984796b7a1e2275a84f3bf5ae364c3a4c0c2e5c5ebaa495a'
        ),
      },
    ]

    expect(actualRecords).toEqual(expectedRecords)

    expect(ethereumClient.getLogs).toHaveBeenCalledWith([
      {
        address: '0xEfbCcE4659db72eC6897F46783303708cf9ACef8',
        topics: [LOG_MEMORY_PAGE_FACT_CONTINUOUS],
        fromBlock: blockRange.from,
        toBlock: blockRange.to,
      },
    ])

    expect(pageRepository.add).toHaveBeenCalledWith([expectedRecords])
  })

  it('discards all records from repository after given block', async () => {
    const pageRepository = mock<PageRepository>({
      deleteAllAfter: async () => {},
    })

    const collector = new PageCollector(mock<EthereumClient>(), pageRepository)

    await collector.discard({ from: 123 })

    expect(pageRepository.deleteAllAfter).toHaveBeenCalledWith([122])
  })

  it('filters out logs from reorged chain histories', async () => {
    const ethereumClient = mock<EthereumClient>({
      getTransaction: async (txHash) => testData().getTransaction(txHash),
      getLogs: async () => testData().logs,
    })
    const pageRepository = mock<PageRepository>({
      add: async () => {},
    })

    const pageCollector = new PageCollector(ethereumClient, pageRepository)

    const blockRange = new BlockRange([
      {
        number: 9,
        hash: '0xdc022f1f9171af61f807e57d1f943d5491f6fb5f4235a9319638e30d54905e3c',
      },
      {
        number: 10,
        hash: '0xdeadbeef',
      },
    ])

    const actualRecords = await pageCollector.collect(blockRange)

    const expectedRecords: PageRecord[] = [
      {
        blockNumber: 9,
        data: [5, 6, 7].map(BigNumber.from).map(bignumToPaddedString).join(''),
        pageHash: Hash256(
          '0x450c6bd64d9066a35eea0d4b9ec956d88dd2d3d8589321aa41d950f2f57a708f'
        ),
      },
    ]

    expect(actualRecords).toEqual(expectedRecords)

    expect(ethereumClient.getLogs).toHaveBeenCalledExactlyWith([
      [
        {
          address: '0xEfbCcE4659db72eC6897F46783303708cf9ACef8',
          topics: [LOG_MEMORY_PAGE_FACT_CONTINUOUS],
          fromBlock: blockRange.from,
          toBlock: blockRange.to,
        },
      ],
    ])

    expect(pageRepository.add).toHaveBeenCalledWith([expectedRecords])
  })

  describe(bignumToPaddedString.name, () => {
    it('converts a BigNumber to a 0-padded 64 characters hexstring', () => {
      expect(bignumToPaddedString(BigNumber.from(123))).toEqual(
        '7b'.padStart(64, '0')
      )
    })
  })
})

function testData() {
  const txHash1 =
    '0x1000000000000000000000000000000000000000000000000000000000000000'
  const txHash2 =
    '0x2000000000000000000000000000000000000000000000000000000000000000'

  const logs = [
    {
      blockNumber: 9,
      blockHash:
        '0xdc022f1f9171af61f807e57d1f943d5491f6fb5f4235a9319638e30d54905e3c',
      transactionIndex: 59,
      removed: false,
      address: '0xEfbCcE4659db72eC6897F46783303708cf9ACef8',
      data: '0x458785283eceff24d5f46c6a333160fbaf9ed5050ca04f0bb1e18eb8b0f636ee450c6bd64d9066a35eea0d4b9ec956d88dd2d3d8589321aa41d950f2f57a708f06e73d81b22c663f984090926f3d782f0c55d7b2463e53b472b9f02c36102dcb',
      topics: [
        '0xb8b9c39aeba1cfd98c38dfeebe11c2f7e02b334cbe9f05f22b442a5d9c1ea0c5',
      ],
      transactionHash: txHash1,
      logIndex: 75,
    },
    {
      blockNumber: 10,
      blockHash:
        '0xdc022f1f9171af61f807e57d1f943d5491f6fb5f4235a9319638e30d54905e3c',
      transactionIndex: 60,
      removed: false,
      address: '0xEfbCcE4659db72eC6897F46783303708cf9ACef8',
      data: '0x418a9ccbff23e2c392fd74b0a537b3326d85bf23c64eec97ef154178313677c2a2485807235f3ee4984796b7a1e2275a84f3bf5ae364c3a4c0c2e5c5ebaa495a063b09143b426906236a8aae7da527d8568729ff0ea87a87956ff12692a6838c',
      topics: [
        '0xb8b9c39aeba1cfd98c38dfeebe11c2f7e02b334cbe9f05f22b442a5d9c1ea0c5',
      ],
      transactionHash: txHash2,
      logIndex: 76,
    },
  ]

  const encodePage = (args: {
    startAddr?: BigNumberish
    values: BigNumberish[]
    z?: BigNumberish
    alpha?: BigNumberish
    prime?: BigNumberish
  }) =>
    PAGE_ABI.encodeFunctionData('registerContinuousMemoryPage', [
      BigNumber.from(args.startAddr ?? 0),
      args.values.map(BigNumber.from),
      BigNumber.from(args.z ?? 0),
      BigNumber.from(args.alpha ?? 0),
      BigNumber.from(args.prime ?? 0),
    ])

  const transactions = [
    {
      blockNumber: 9,
      hash: txHash1,
      data: encodePage({ values: [5, 6, 7] }),
    },
    {
      blockNumber: 12,
      hash: txHash2,
      data: encodePage({ values: [8, 9, 10, 11, 12] }),
    },
  ] as TransactionResponse[]

  return {
    logs,
    transactions,
    getTransaction: (transactionHash: Hash256) =>
      transactions.find((tx) => tx.hash === transactionHash.toString())!,
  }
}
