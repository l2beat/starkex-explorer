import { TransactionResponse } from '@ethersproject/abstract-provider'
import { EthereumAddress, Hash256 } from '@explorer/types'
import { expect } from 'earljs'
import { providers } from 'ethers'

import { LogMemoryPageFactContinuous } from '../../../src/core/collectors/events'
import {
  PAGE_TRANSACTION_ABI,
  PageCollector,
  PageEvent,
} from '../../../src/core/collectors/PageCollector'
import { BlockRange } from '../../../src/model'
import { PageRepository } from '../../../src/peripherals/database/PageRepository'
import type { EthereumClient } from '../../../src/peripherals/ethereum/EthereumClient'
import { mock } from '../../../src/test/mock'

const REGISTRY_ADDRESS = EthereumAddress.fake('b00b135')

describe(PageCollector.name, () => {
  const logs = [
    {
      blockNumber: 9,
      data:
        '0x' +
        '458785283eceff24d5f46c6a333160fbaf9ed5050ca04f0bb1e18eb8b0f636ee' +
        '450c6bd64d9066a35eea0d4b9ec956d88dd2d3d8589321aa41d950f2f57a708f' +
        '06e73d81b22c663f984090926f3d782f0c55d7b2463e53b472b9f02c36102dcb',
      topics: [LogMemoryPageFactContinuous.topic],
      transactionHash: Hash256.fake('123').toString(),
    },
    {
      blockNumber: 10,
      data:
        '0x' +
        '418a9ccbff23e2c392fd74b0a537b3326d85bf23c64eec97ef154178313677c2' +
        'a2485807235f3ee4984796b7a1e2275a84f3bf5ae364c3a4c0c2e5c5ebaa495a' +
        '063b09143b426906236a8aae7da527d8568729ff0ea87a87956ff12692a6838c',
      topics: [LogMemoryPageFactContinuous.topic],
      transactionHash: Hash256.fake('456').toString(),
    },
  ] as providers.Log[]

  const transactions = [
    {
      hash: Hash256.fake('123').toString(),
      data: encodePage([5, 6, 7]),
    },
    {
      hash: Hash256.fake('456').toString(),
      data: encodePage([8, 9, 10, 11, 12]),
    },
  ] as TransactionResponse[]

  it('fetches and saves memory pages', async () => {
    const ethereumClient = mock<EthereumClient>({
      getTransaction: async (txHash) =>
        transactions.find((x) => x.hash === txHash.toString()),
      getLogsInRange: async () => logs,
    })
    const pageRepository = mock<PageRepository>({
      addMany: async () => [],
    })

    const pageCollector = new PageCollector(
      ethereumClient,
      pageRepository,
      REGISTRY_ADDRESS
    )

    const blockRange = new BlockRange([], 9, 13)

    const actualRecords = await pageCollector.collect(blockRange)

    const expectedRecords: PageEvent[] = [
      {
        blockNumber: 9,
        data: [5, 6, 7].map((x) => x.toString(16).padStart(64, '0')).join(''),
        pageHash: Hash256(
          '0x450c6bd64d9066a35eea0d4b9ec956d88dd2d3d8589321aa41d950f2f57a708f'
        ),
      },
      {
        blockNumber: 10,
        data: [8, 9, 10, 11, 12]
          .map((x) => x.toString(16).padStart(64, '0'))
          .join(''),
        pageHash: Hash256(
          '0xa2485807235f3ee4984796b7a1e2275a84f3bf5ae364c3a4c0c2e5c5ebaa495a'
        ),
      },
    ]

    expect(actualRecords).toEqual(expectedRecords)

    expect(ethereumClient.getLogsInRange).toHaveBeenCalledWith([
      blockRange,
      {
        address: REGISTRY_ADDRESS.toString(),
        topics: [LogMemoryPageFactContinuous.topic],
      },
    ])

    expect(pageRepository.addMany).toHaveBeenCalledWith([expectedRecords])
  })

  it('discards all records from repository after given block', async () => {
    const pageRepository = mock<PageRepository>({
      deleteAfter: async () => 0,
    })

    const collector = new PageCollector(
      mock<EthereumClient>(),
      pageRepository,
      REGISTRY_ADDRESS
    )

    await collector.discardAfter(123)

    expect(pageRepository.deleteAfter).toHaveBeenCalledWith([123])
  })
})

function encodePage(values: number[]) {
  return PAGE_TRANSACTION_ABI.encodeFunctionData(
    'registerContinuousMemoryPage',
    [0, values, 0, 0, 0]
  )
}
