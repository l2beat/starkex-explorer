import { expect } from 'earljs'

import {
  LOG_MEMORY_PAGE_HASHES,
  MemoryHashEventCollector,
} from '../../src/core/MemoryHashEventCollector'
import { EthereumAddress } from '../../src/model/EthereumAddress'
import { FactToPageRepository } from '../../src/peripherals/database/FactToPageRepository'
import type { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { BlockRange } from '../../src/peripherals/ethereum/types'
import { mock } from '../mock'

describe(MemoryHashEventCollector.name, () => {
  it('fetches memory hash events and saves them to repository', async () => {
    const ethereumClient = mock<EthereumClient>({
      getLogs: async (filter) =>
        testData().logs.filter((log) => filter.address === log.address),
    })
    const factToPageRepository = mock<FactToPageRepository>({
      add: async () => {},
    })
    const collector = new MemoryHashEventCollector(
      ethereumClient,
      factToPageRepository
    )

    const verifierAddresses = [
      EthereumAddress('0xB1EDA32c467569fbDC8C3E041C81825D76b32b84'),
      EthereumAddress('0x894c4a12548FB18EaA48cF34f9Cd874Fc08b7FC3'),
    ]
    const blockRange: BlockRange = { from: 11813207, to: 13987296 }

    const actual = await collector.collect(blockRange, verifierAddresses)

    const expectedEvents = [
      {
        blockNumber: 11905858,
        factHash:
          '0x4ac3c5b87c46c673c67db046ffef90c618297b6ba445c7560f8122c33e9a37ff',
        pagesHashes: [
          '0xce887f94b38c0efe1e788c845b5c4e496f6f65fb9340369af22c351868238c16',
          '0xfc7e3b571b22a96a4c234b194d55f2c833b3f3dd0e1d82a9be9a30eaf754cb19',
        ],
      },
      {
        blockNumber: 11905919,
        factHash:
          '0x66f9d068861a54123cd952988a6ac4e933f5d28c4d28a9559f111efa1897d653',
        pagesHashes: [
          '0x4e410edb11b8f075018b40a3904b0a2c4d41a689db2b389971a0ba09e018fcee',
          '0xfdf816c39b1c2f73bd090812602da2fb2cbbae0edfc773d9b7db4c24f2502565',
        ],
      },
      {
        blockNumber: 12050594,
        factHash:
          '0x8921ae1e750e50195406973065a7064222ae8cb26761460e57e3091bedebbd89',
        pagesHashes: [
          '0x41f81fd2bade6e91b3d4f1e49a90bc45ebd96cb0e5062de84001a70fcef7b59d',
          '0xa1a19d0a1daf2bd8e83d9d6f676e6e4e4e91cc874d3f20b2e6ab0d2ed59ff62a',
        ],
      },
      {
        blockNumber: 12052850,
        factHash:
          '0xedb0b161bb4b45d861dcb5bb57db15fbb92d581642b32a00d128e4893ac04dce',
        pagesHashes: [
          '0x851b5d0de3a6cb3be977609e9675e8b680b1d7ffb9271bbdea65dd7865052a90',
          '0x4a6131eb8a34b798b831633d66cb083c63a477fd95d0355c343bbfef41e61a6c',
        ],
      },
    ]

    expect(actual).toEqual(expectedEvents)

    for (const address of verifierAddresses) {
      expect(ethereumClient.getLogs).toHaveBeenCalledWith([
        {
          address: String(address),
          topics: [LOG_MEMORY_PAGE_HASHES],
          fromBlock: blockRange.from,
          toBlock: blockRange.to,
        },
      ])
    }

    expect(factToPageRepository.add).toHaveBeenCalledWith([
      [
        {
          index: 0,
          pageHash: expectedEvents[0].pagesHashes[0],
          factHash: expectedEvents[0].factHash,
          blockNumber: expectedEvents[0].blockNumber,
        },
        {
          index: 1,
          pageHash: expectedEvents[0].pagesHashes[1],
          factHash: expectedEvents[0].factHash,
          blockNumber: expectedEvents[0].blockNumber,
        },
        {
          index: 0,
          pageHash: expectedEvents[1].pagesHashes[0],
          factHash: expectedEvents[1].factHash,
          blockNumber: expectedEvents[1].blockNumber,
        },
        {
          index: 1,
          pageHash: expectedEvents[1].pagesHashes[1],
          factHash: expectedEvents[1].factHash,
          blockNumber: expectedEvents[1].blockNumber,
        },
      ],
    ])

    expect(factToPageRepository.add).toHaveBeenCalledWith([
      [
        {
          index: 0,
          pageHash: expectedEvents[2].pagesHashes[0],
          factHash: expectedEvents[2].factHash,
          blockNumber: expectedEvents[2].blockNumber,
        },
        {
          index: 1,
          pageHash: expectedEvents[2].pagesHashes[1],
          factHash: expectedEvents[2].factHash,
          blockNumber: expectedEvents[2].blockNumber,
        },
        {
          index: 0,
          pageHash: expectedEvents[3].pagesHashes[0],
          factHash: expectedEvents[3].factHash,
          blockNumber: expectedEvents[3].blockNumber,
        },
        {
          index: 1,
          pageHash: expectedEvents[3].pagesHashes[1],
          factHash: expectedEvents[3].factHash,
          blockNumber: expectedEvents[3].blockNumber,
        },
      ],
    ])
  })

  it('discards all records from factToPageRepostiory after given block', async () => {
    const factToPageRepository = mock<FactToPageRepository>({
      deleteAllAfter: async () => {},
    })

    const collector = new MemoryHashEventCollector(
      mock<EthereumClient>(),
      factToPageRepository
    )

    await collector.discard({ from: 123 })

    expect(factToPageRepository.deleteAllAfter).toHaveBeenCalledWith([122])
  })
})

function testData() {
  return {
    // @todo real logs
    logs: [
      // verifier 0x8
      {
        blockNumber: 12050594,
        blockHash:
          '0x34eba61af14fcce1f79268532b73cb39af2897a5d219288edef044f07a660a74',
        transactionIndex: 89,
        removed: false,
        address: '0x894c4a12548FB18EaA48cF34f9Cd874Fc08b7FC3',
        data: '0x8921ae1e750e50195406973065a7064222ae8cb26761460e57e3091bedebbd890000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000241f81fd2bade6e91b3d4f1e49a90bc45ebd96cb0e5062de84001a70fcef7b59da1a19d0a1daf2bd8e83d9d6f676e6e4e4e91cc874d3f20b2e6ab0d2ed59ff62a',
        topics: [
          '0x73b132cb33951232d83dc0f1f81c2d10f9a2598f057404ed02756716092097bb',
        ],
        transactionHash:
          '0xa8c3244a71c91f3de2a5dd9b1bf877de0b18d2156debf6d3bf63158c77c10fc4',
        logIndex: 158,
      },
      {
        blockNumber: 12052850,
        blockHash:
          '0x8a74ff3eb9f3d439b2b52241b9f6035a7ff93887ca8a16424413c97d0d9adfd8',
        transactionIndex: 107,
        removed: false,
        address: '0x894c4a12548FB18EaA48cF34f9Cd874Fc08b7FC3',
        data: '0xedb0b161bb4b45d861dcb5bb57db15fbb92d581642b32a00d128e4893ac04dce00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002851b5d0de3a6cb3be977609e9675e8b680b1d7ffb9271bbdea65dd7865052a904a6131eb8a34b798b831633d66cb083c63a477fd95d0355c343bbfef41e61a6c',
        topics: [
          '0x73b132cb33951232d83dc0f1f81c2d10f9a2598f057404ed02756716092097bb',
        ],
        transactionHash:
          '0x5d570f23433ee513553655566ed6c22785806e14108e01b69ff4a740fbea95b5',
        logIndex: 192,
      },
      // verifier 0xB
      {
        blockNumber: 11905858,
        blockHash:
          '0x12cb67ca790064c5220f91ecf730ccdc0a558f03c77faf43509bc4790cfd3e55',
        transactionIndex: 4,
        removed: false,
        address: '0xB1EDA32c467569fbDC8C3E041C81825D76b32b84',
        data: '0x4ac3c5b87c46c673c67db046ffef90c618297b6ba445c7560f8122c33e9a37ff00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002ce887f94b38c0efe1e788c845b5c4e496f6f65fb9340369af22c351868238c16fc7e3b571b22a96a4c234b194d55f2c833b3f3dd0e1d82a9be9a30eaf754cb19',
        topics: [
          '0x73b132cb33951232d83dc0f1f81c2d10f9a2598f057404ed02756716092097bb',
        ],
        transactionHash:
          '0x49fa808b2a2e6124a88c1612e93673b12d7cb3a9f815856cec04d29f4fc146b1',
        logIndex: 5,
      },
      {
        blockNumber: 11905919,
        blockHash:
          '0x51c1482ed70ef0cab9fb40b891ada76408c0272bd1fd9c48e3d28ca65a2fc54f',
        transactionIndex: 25,
        removed: false,
        address: '0xB1EDA32c467569fbDC8C3E041C81825D76b32b84',
        data: '0x66f9d068861a54123cd952988a6ac4e933f5d28c4d28a9559f111efa1897d653000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000024e410edb11b8f075018b40a3904b0a2c4d41a689db2b389971a0ba09e018fceefdf816c39b1c2f73bd090812602da2fb2cbbae0edfc773d9b7db4c24f2502565',
        topics: [
          '0x73b132cb33951232d83dc0f1f81c2d10f9a2598f057404ed02756716092097bb',
        ],
        transactionHash:
          '0xcdef4b022b527ab0a9e02289c13419b2da50e545f5453e0336498d20e29917e0',
        logIndex: 40,
      },
    ],
  }
}
