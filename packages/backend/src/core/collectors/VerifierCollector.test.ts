import { EthereumAddress, Hash256 } from '@explorer/types'
import { expect, mockFn } from 'earljs'

import { BlockRange } from '../../model'
import {
  VerifierEventRecord,
  VerifierEventRepository,
} from '../../peripherals/database/VerifierEventRepository'
import type { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { mock } from '../../test/mock'
import { VerifierCollector } from './VerifierCollector'

const PROXY_ADDRESS = EthereumAddress.fake('1234')
const VERIFIER_ADDRESSES = [
  EthereumAddress.fake('aaaa1111'),
  EthereumAddress.fake('bbbb2222'),
]

describe(VerifierCollector.name, () => {
  it('saves events to repository and returns verifier addresses', async () => {
    const addMany = mockFn(async (_records: VerifierEventRecord[]) => [])

    const ethereumClient = mock<EthereumClient>({
      getLogsInRange: async () => testData().logs,
    })
    const collector = new VerifierCollector(
      ethereumClient,
      mock<VerifierEventRepository>({
        addMany,
        async getAll() {
          return []
        },
      }),
      PROXY_ADDRESS,
      []
    )

    const blockRange = new BlockRange([
      {
        number: 12004790,
        hash: Hash256(
          '0x50d4fde82ee2a75ad7983468fa326d8259d0aa20656e650027f6ad0e6d097f53'
        ),
      },
      {
        number: 12004790,
        hash: Hash256(
          '0x50d4fde82ee2a75ad7983468fa326d8259d0aa20656e650027f6ad0e6d097f53'
        ),
      },
      {
        number: 12016212,
        hash: Hash256(
          '0x867fdd66b6dee527e1f5f6c9d742ca6776a8fd72a1919e019bff85b0a2c1005d'
        ),
      },
      {
        number: 12016212,
        hash: Hash256(
          '0x867fdd66b6dee527e1f5f6c9d742ca6776a8fd72a1919e019bff85b0a2c1005d'
        ),
      },
    ])

    const verifiers = await collector.collect(blockRange)

    expect(ethereumClient.getLogsInRange).toHaveBeenCalledWith([
      blockRange,
      {
        address: expect.stringMatching('0x'),
        topics: [
          [
            // ImplementationAdded
            '0x723a7080d63c133cf338e44e00705cc1b7b2bde7e88d6218a8d62710a329ce1b',
            // Upgraded
            '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b',
          ],
        ],
      },
    ])
    expect(addMany).toHaveBeenCalledWith([
      [
        expect.objectWith({
          name: 'ImplementationAdded',
          blockNumber: 12004790,
          implementation: '0xCC5B2c75cbbD281b2Fc4B58C7d5B080d023C92F2',
          initializer:
            '0x000000000000000000000000b1eda32c467569fbdc8c3e041c81825d76b32b84',
        }),
        expect.objectWith({
          name: 'Upgraded',
          blockNumber: 12004790,
          implementation: '0xCC5B2c75cbbD281b2Fc4B58C7d5B080d023C92F2',
        }),
        expect.objectWith({
          name: 'ImplementationAdded',
          blockNumber: 12016212,
          implementation: '0xCC5B2c75cbbD281b2Fc4B58C7d5B080d023C92F2',
          initializer:
            '0x000000000000000000000000894c4a12548fb18eaa48cf34f9cd874fc08b7fc3',
        }),
        expect.objectWith({
          name: 'Upgraded',
          blockNumber: 12016212,
          implementation: '0xCC5B2c75cbbD281b2Fc4B58C7d5B080d023C92F2',
        }),
      ],
    ])

    expect(verifiers).toEqual([
      EthereumAddress('0xB1EDA32c467569fbDC8C3E041C81825D76b32b84'),
      EthereumAddress('0x894c4a12548FB18EaA48cF34f9Cd874Fc08b7FC3'),
    ])
  })

  it('discards all records from repository after given block', async () => {
    const verifierEventRepository = mock<VerifierEventRepository>({
      deleteAfter: async (_blockNumber: number) => 0,
    })
    const collector = new VerifierCollector(
      mock<EthereumClient>(),
      verifierEventRepository,
      PROXY_ADDRESS,
      VERIFIER_ADDRESSES
    )

    await collector.discardAfter(123)

    expect(verifierEventRepository.deleteAfter).toHaveBeenCalledWith([123])
  })

  it('includes hardcoded addresses in collected', async () => {
    const collector = new VerifierCollector(
      mock<EthereumClient>({ getLogsInRange: async () => [] }),
      mock<VerifierEventRepository>({
        addMany: async () => [],
        getAll: async () => [],
      }),
      PROXY_ADDRESS,
      VERIFIER_ADDRESSES
    )

    const addresses = await collector.collect(
      new BlockRange([
        {
          number: 1,
          hash: Hash256.fake('123'),
        },
        {
          number: 2,
          hash: Hash256.fake('456'),
        },
      ])
    )

    expect(addresses).toEqual(VERIFIER_ADDRESSES)
  })
})

function testData() {
  const logs = [
    {
      blockNumber: 12004790,
      blockHash:
        '0x50d4fde82ee2a75ad7983468fa326d8259d0aa20656e650027f6ad0e6d097f53',
      transactionIndex: 180,
      removed: false,
      address: PROXY_ADDRESS.toString(),
      data: '0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000b1eda32c467569fbdc8c3e041c81825d76b32b84',
      topics: [
        '0x723a7080d63c133cf338e44e00705cc1b7b2bde7e88d6218a8d62710a329ce1b',
        '0x000000000000000000000000cc5b2c75cbbd281b2fc4b58c7d5b080d023c92f2',
      ],
      transactionHash:
        '0x0062d144cffa664f602e4e72441b283350c201b027420652d6ca15462594c83f',
      logIndex: 188,
    },
    {
      blockNumber: 12004790,
      blockHash:
        '0x50d4fde82ee2a75ad7983468fa326d8259d0aa20656e650027f6ad0e6d097f53',
      transactionIndex: 181,
      removed: false,
      address: PROXY_ADDRESS.toString(),
      data: '0x',
      topics: [
        '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b',
        '0x000000000000000000000000cc5b2c75cbbd281b2fc4b58c7d5b080d023c92f2',
      ],
      transactionHash:
        '0x714f3ed87ce0d04fa0244d8eb61d1069ffb4263bbd874d4d88b1fe8330ead3b3',
      logIndex: 189,
    },
    {
      blockNumber: 12016212,
      blockHash:
        '0x867fdd66b6dee527e1f5f6c9d742ca6776a8fd72a1919e019bff85b0a2c1005d',
      transactionIndex: 118,
      removed: false,
      address: PROXY_ADDRESS.toString(),
      data: '0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000894c4a12548fb18eaa48cf34f9cd874fc08b7fc3',
      topics: [
        '0x723a7080d63c133cf338e44e00705cc1b7b2bde7e88d6218a8d62710a329ce1b',
        '0x000000000000000000000000cc5b2c75cbbd281b2fc4b58c7d5b080d023c92f2',
      ],
      transactionHash:
        '0x2f80fb929df9d9baa64b47d46e6e6a17e8350aeeb0e063e2f6765fb1b0eb129e',
      logIndex: 243,
    },
    {
      blockNumber: 12016212,
      blockHash:
        '0x867fdd66b6dee527e1f5f6c9d742ca6776a8fd72a1919e019bff85b0a2c1005d',
      transactionIndex: 119,
      removed: false,
      address: PROXY_ADDRESS.toString(),
      data: '0x',
      topics: [
        '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b',
        '0x000000000000000000000000cc5b2c75cbbd281b2fc4b58c7d5b080d023c92f2',
      ],
      transactionHash:
        '0x1eb3709cb9eb06ab8c9d3fc90ebbe8692100b9188c87619b883bc29865fd3dab',
      logIndex: 244,
    },
  ]

  return { logs }
}
