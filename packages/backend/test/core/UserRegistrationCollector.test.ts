import { EthereumAddress, Hash256, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { UserRegistrationCollector } from '../../src/core/UserRegistrationCollector'
import { BlockRange } from '../../src/model'
import { UserRegistrationEventRepository } from '../../src/peripherals/database/UserRegistrationEventRepository'
import type { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { mock } from '../mock'

const PERPETUAL_ADDRESS = EthereumAddress.fake('deadbeef1234')

const TEST_LOGS = [
  {
    blockNumber: 11910225,
    blockHash:
      '0x525086c3f8e1a2cec590b20f841c7fcbc8ccdd66a59158e04a54f2929ff587b0',
    transactionIndex: 97,
    removed: false,
    address: PERPETUAL_ADDRESS.toString(),
    data: '0x000000000000000000000000b30e6ecdb51fe9a5edf84c58b2c0f20ad3b62c3d0138b0aff25a4effbc4c12c17dc27ce64a210d5837cbb32757ccd43e715a5f37000000000000000000000000b30e6ecdb51fe9a5edf84c58b2c0f20ad3b62c3d',
    topics: [
      '0xcab1cf17c190e4e2195a7b8f7b362023246fa774390432b4704ab6b29d56b07b',
    ],
    transactionHash:
      '0x652a9b7f93514727cbee9580404e5e691a59be7bf0fd844fd252d3accf1f4f92',
    logIndex: 174,
  },
  {
    blockNumber: 11912458,
    blockHash:
      '0xea27a10eb4e19fe9984d6406310cf487a03e5dbf86e5950004ea07973936ef05',
    transactionIndex: 132,
    removed: false,
    address: PERPETUAL_ADDRESS.toString(),
    data: '0x0000000000000000000000000d012ea1a2ee7308106b4618bdf8b832199181180421d25472e1f2dff8e5a31ab231b1bec8f9037ab0cae36eaf46a62842b4a2180000000000000000000000000d012ea1a2ee7308106b4618bdf8b83219918118',
    topics: [
      '0xcab1cf17c190e4e2195a7b8f7b362023246fa774390432b4704ab6b29d56b07b',
    ],
    transactionHash:
      '0x06405472b1810726c2166de70008d0c5f135a91c2aab5aabf24401687c0b5a1a',
    logIndex: 207,
  },
  {
    blockNumber: 11915106,
    blockHash:
      '0x10e001bfa165fdd5e7de0307a961581c643c8a1c8535e6b9c09d35cf4bf85fdd',
    transactionIndex: 249,
    removed: false,
    address: PERPETUAL_ADDRESS.toString(),
    data: '0x000000000000000000000000f3ad7be69629d05d1df1d4bacf0fab33a3cdf50c035086df5c48598c68b4a36828e49cac61832b148a898e963f04493b29341cd1000000000000000000000000f3ad7be69629d05d1df1d4bacf0fab33a3cdf50c',
    topics: [
      '0xcab1cf17c190e4e2195a7b8f7b362023246fa774390432b4704ab6b29d56b07b',
    ],
    transactionHash:
      '0xd78a10d57c46ac4db4518e55265377b4303fa62287df80baa225b9c1a43bc1b7',
    logIndex: 112,
  },
]

const TEST_BLOCKS = TEST_LOGS.map((log) => ({
  hash: Hash256(log.blockHash),
  number: log.blockNumber,
}))

describe(UserRegistrationCollector.name, () => {
  it('saves events to repository and returns user registrations', async () => {
    const ethereumClient = mock<EthereumClient>({
      getLogsInRange: async () => TEST_LOGS,
    })
    const repository = mock<UserRegistrationEventRepository>({
      addMany: async () => [],
    })
    const collector = new UserRegistrationCollector(
      ethereumClient,
      repository,
      PERPETUAL_ADDRESS
    )

    const blockRange = new BlockRange(TEST_BLOCKS)

    const registrations = await collector.collect(blockRange)

    const expectedRegistrationEvents = [
      {
        blockNumber: 11910225,
        ethAddress: EthereumAddress(
          '0xB30E6ECDb51FE9A5Edf84c58B2C0F20ad3b62C3d'
        ),
        starkKey: StarkKey(
          '0x0138b0aff25a4effbc4c12c17dc27ce64a210d5837cbb32757ccd43e715a5f37'
        ),
      },
      {
        blockNumber: 11912458,
        ethAddress: EthereumAddress(
          '0x0D012Ea1A2eE7308106B4618bDf8B83219918118'
        ),
        starkKey: StarkKey(
          '0x0421d25472e1f2dff8e5a31ab231b1bec8f9037ab0cae36eaf46a62842b4a218'
        ),
      },
      {
        blockNumber: 11915106,
        ethAddress: EthereumAddress(
          '0xF3ad7bE69629D05D1Df1D4BacF0FAB33A3cdF50c'
        ),
        starkKey: StarkKey(
          '0x035086df5c48598c68b4a36828e49cac61832b148a898e963f04493b29341cd1'
        ),
      },
    ]

    expect(repository.addMany).toHaveBeenCalledWith([
      expectedRegistrationEvents,
    ])

    expect(registrations).toEqual(
      expectedRegistrationEvents.map((e) => ({
        starkKey: e.starkKey,
        ethAddress: e.ethAddress,
      }))
    )
  })

  it('discards all records from repository after given block', async () => {
    const userRegistrationRepository = mock<UserRegistrationEventRepository>({
      deleteAfter: async () => 0,
    })
    const collector = new UserRegistrationCollector(
      mock<EthereumClient>(),
      userRegistrationRepository,
      PERPETUAL_ADDRESS
    )

    await collector.discardAfter(123)

    expect(userRegistrationRepository.deleteAfter).toHaveBeenCalledWith([123])
  })
})
