import { EthereumAddress, Hash256 } from '@explorer/types'
import { expect, mockObject } from 'earl'

import { BlockRange } from '../../model'
import type { StateTransitionRepository } from '../../peripherals/database/StateTransitionRepository'
import type { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { PerpetualRollupStateTransition } from '../PerpetualRollupUpdater'
import { LogStateTransitionFact, LogUpdateState } from './events'
import { PerpetualRollupStateTransitionCollector } from './PerpetualRollupStateTransitionCollector'

const PERPETUAL_ADDRESS = EthereumAddress.fake('deadbeef1234')

describe(PerpetualRollupStateTransitionCollector.name, () => {
  it('parses logs, saves and returns records', async () => {
    const ethereumClient = mockObject<EthereumClient>({
      getLogsInRange: async () => testData().logs,
    })
    const stateTransitionRepository = mockObject<StateTransitionRepository>({
      addMany: async () => [],
    })
    const stateTransitionCollector =
      new PerpetualRollupStateTransitionCollector(
        ethereumClient,
        stateTransitionRepository,
        PERPETUAL_ADDRESS
      )

    const blockRange = new BlockRange([
      {
        number: 13986068,
        hash: Hash256(
          '0x60b59393cb31785e21f40fc3004496069e8fb69b0117af27ac40f4a949e705ac'
        ),
      },
      {
        number: 13986473,
        hash: Hash256(
          '0x0a4c7eb5e4c57f31a84d57df23c038e6c439d9e3feae9420898269b748853cae'
        ),
      },
      {
        number: 13986918,
        hash: Hash256(
          '0x3e9938b5f3233be2ada3b0928b8ddd57e6b630fe3c3a372fd0aceab7e3f5accd'
        ),
      },
      {
        number: 13987182,
        hash: Hash256(
          '0xb801060a71983b17e37d1307306c7dbd7f79ab12feba8020cae00bdf8c0bd911'
        ),
      },
    ])

    const transitions = await stateTransitionCollector.collect(blockRange)

    const expectedTransitions: PerpetualRollupStateTransition[] = [
      {
        batchId: 16507,
        blockNumber: 13986068,
        sequenceNumber: 16214,
        stateTransitionHash: Hash256(
          '0xf7a4d368103ca720efb0ba4873ca2e0b9dee88e385d14de8ac743cec81a048f2'
        ),
        transactionHash: Hash256(
          '0x70631676a10ea0f261f55a6bb16c4e3f13536c5c5e85f54b0041c6d3f0a6100d'
        ),
      },
      {
        batchId: 16506,
        blockNumber: 13986473,
        sequenceNumber: 16213,
        stateTransitionHash: Hash256(
          '0x32e69820f8b6742959585b306e6be0bb003b86d5473286369123f6760de86176'
        ),
        transactionHash: Hash256(
          '0x4275011318937d3f607f9a40a57d983d24d15c0001bfcfdff7c1e3fcda042454'
        ),
      },
      {
        batchId: 16505,
        blockNumber: 13986918,
        sequenceNumber: 16212,
        stateTransitionHash: Hash256(
          '0x48d39c9b67d74937929a0b03845518e34c011c9b281ec9e058471c56ba8f1d80'
        ),
        transactionHash: Hash256(
          '0xf3b2b1009afdc98c9c762d5c709f09be80a4f4850b8277fe94fe95577ea96960'
        ),
      },
      {
        batchId: 16504,
        blockNumber: 13987182,
        sequenceNumber: 16211,
        stateTransitionHash: Hash256(
          '0x6cd9ea43d47f77a502974d7c6e110e13dd5675af8c0d429b97b73c82eaeebc54'
        ),
        transactionHash: Hash256(
          '0x6941b4fd20ebd280be09d761324cf1646de897fa40a6ac05241182f04e6d157e'
        ),
      },
    ]
    const expectedStateTransitionRecords = expectedTransitions.map(
      (transition) => ({
        blockNumber: transition.blockNumber,
        stateTransitionHash: transition.stateTransitionHash,
      })
    )

    expect(transitions).toEqual(expectedTransitions)
    expect(ethereumClient.getLogsInRange).toHaveBeenOnlyCalledWith(blockRange, {
      address: PERPETUAL_ADDRESS.toString(),
      topics: [LogStateTransitionFact.topic, LogUpdateState.topic],
    })
    expect(stateTransitionRepository.addMany).toHaveBeenOnlyCalledWith(
      expectedStateTransitionRecords
    )
  })

  it('discards all records from pageMappingRepository after given block', async () => {
    const stateTransitionRepository = mockObject<StateTransitionRepository>({
      deleteAfter: async () => 0,
    })

    const collector = new PerpetualRollupStateTransitionCollector(
      mockObject<EthereumClient>(),
      stateTransitionRepository,
      PERPETUAL_ADDRESS
    )

    await collector.discardAfter(123)

    expect(stateTransitionRepository.deleteAfter).toHaveBeenOnlyCalledWith(123)
  })
})

function testData() {
  return {
    logs: [
      {
        blockNumber: 13986068,
        blockHash:
          '0x60b59393cb31785e21f40fc3004496069e8fb69b0117af27ac40f4a949e705ac',
        transactionIndex: 49,
        removed: false,
        address: PERPETUAL_ADDRESS.toString(),
        data: '0xf7a4d368103ca720efb0ba4873ca2e0b9dee88e385d14de8ac743cec81a048f2',
        topics: [
          '0x9866f8ddfe70bb512b2f2b28b49d4017c43f7ba775f1a20c61c13eea8cdac111',
        ],
        transactionHash:
          '0x70631676a10ea0f261f55a6bb16c4e3f13536c5c5e85f54b0041c6d3f0a6100d',
        logIndex: 52,
      },
      {
        blockNumber: 13986068,
        blockHash:
          '0x60b59393cb31785e21f40fc3004496069e8fb69b0117af27ac40f4a949e705ac',
        transactionIndex: 49,
        removed: false,
        address: PERPETUAL_ADDRESS.toString(),
        data: '0x0000000000000000000000000000000000000000000000000000000000003f56000000000000000000000000000000000000000000000000000000000000407b',
        topics: [
          '0x2672b53d25204094519f7b0fba8d2b5cd0cc1e426f49554c89461cdb9dcec08f',
        ],
        transactionHash:
          '0x70631676a10ea0f261f55a6bb16c4e3f13536c5c5e85f54b0041c6d3f0a6100d',
        logIndex: 53,
      },
      {
        blockNumber: 13986473,
        blockHash:
          '0x0a4c7eb5e4c57f31a84d57df23c038e6c439d9e3feae9420898269b748853cae',
        transactionIndex: 80,
        removed: false,
        address: PERPETUAL_ADDRESS.toString(),
        data: '0x32e69820f8b6742959585b306e6be0bb003b86d5473286369123f6760de86176',
        topics: [
          '0x9866f8ddfe70bb512b2f2b28b49d4017c43f7ba775f1a20c61c13eea8cdac111',
        ],
        transactionHash:
          '0x4275011318937d3f607f9a40a57d983d24d15c0001bfcfdff7c1e3fcda042454',
        logIndex: 63,
      },
      {
        blockNumber: 13986473,
        blockHash:
          '0x0a4c7eb5e4c57f31a84d57df23c038e6c439d9e3feae9420898269b748853cae',
        transactionIndex: 80,
        removed: false,
        address: PERPETUAL_ADDRESS.toString(),
        data: '0x0000000000000000000000000000000000000000000000000000000000003f55000000000000000000000000000000000000000000000000000000000000407a',
        topics: [
          '0x2672b53d25204094519f7b0fba8d2b5cd0cc1e426f49554c89461cdb9dcec08f',
        ],
        transactionHash:
          '0x4275011318937d3f607f9a40a57d983d24d15c0001bfcfdff7c1e3fcda042454',
        logIndex: 64,
      },
      {
        blockNumber: 13986918,
        blockHash:
          '0x3e9938b5f3233be2ada3b0928b8ddd57e6b630fe3c3a372fd0aceab7e3f5accd',
        transactionIndex: 17,
        removed: false,
        address: PERPETUAL_ADDRESS.toString(),
        data: '0x48d39c9b67d74937929a0b03845518e34c011c9b281ec9e058471c56ba8f1d80',
        topics: [
          '0x9866f8ddfe70bb512b2f2b28b49d4017c43f7ba775f1a20c61c13eea8cdac111',
        ],
        transactionHash:
          '0xf3b2b1009afdc98c9c762d5c709f09be80a4f4850b8277fe94fe95577ea96960',
        logIndex: 18,
      },
      {
        blockNumber: 13986918,
        blockHash:
          '0x3e9938b5f3233be2ada3b0928b8ddd57e6b630fe3c3a372fd0aceab7e3f5accd',
        transactionIndex: 17,
        removed: false,
        address: PERPETUAL_ADDRESS.toString(),
        data: '0x0000000000000000000000000000000000000000000000000000000000003f540000000000000000000000000000000000000000000000000000000000004079',
        topics: [
          '0x2672b53d25204094519f7b0fba8d2b5cd0cc1e426f49554c89461cdb9dcec08f',
        ],
        transactionHash:
          '0xf3b2b1009afdc98c9c762d5c709f09be80a4f4850b8277fe94fe95577ea96960',
        logIndex: 19,
      },
      {
        blockNumber: 13987182,
        blockHash:
          '0xb801060a71983b17e37d1307306c7dbd7f79ab12feba8020cae00bdf8c0bd911',
        transactionIndex: 105,
        removed: false,
        address: PERPETUAL_ADDRESS.toString(),
        data: '0x6cd9ea43d47f77a502974d7c6e110e13dd5675af8c0d429b97b73c82eaeebc54',
        topics: [
          '0x9866f8ddfe70bb512b2f2b28b49d4017c43f7ba775f1a20c61c13eea8cdac111',
        ],
        transactionHash:
          '0x6941b4fd20ebd280be09d761324cf1646de897fa40a6ac05241182f04e6d157e',
        logIndex: 169,
      },
      {
        blockNumber: 13987182,
        blockHash:
          '0xb801060a71983b17e37d1307306c7dbd7f79ab12feba8020cae00bdf8c0bd911',
        transactionIndex: 105,
        removed: false,
        address: PERPETUAL_ADDRESS.toString(),
        data: '0x0000000000000000000000000000000000000000000000000000000000003f530000000000000000000000000000000000000000000000000000000000004078',
        topics: [
          '0x2672b53d25204094519f7b0fba8d2b5cd0cc1e426f49554c89461cdb9dcec08f',
        ],
        transactionHash:
          '0x6941b4fd20ebd280be09d761324cf1646de897fa40a6ac05241182f04e6d157e',
        logIndex: 170,
      },
    ],
  }
}
