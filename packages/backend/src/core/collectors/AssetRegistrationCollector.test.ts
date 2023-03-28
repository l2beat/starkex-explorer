import { AssetHash, EthereumAddress } from '@explorer/types'
import { expect, mockObject } from 'earljs'
import { BigNumber } from 'ethers'

import { BlockRange } from '../../model'
import {
  AssetRegistrationRecord,
  AssetRepository,
} from '../../peripherals/database/AssetRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { TokenInspector } from '../../peripherals/ethereum/TokenInspector'
import { AssetRegistrationCollector } from './AssetRegistrationCollector'
import { LogTokenRegistered } from './events'

describe(AssetRegistrationCollector.name, () => {
  describe(AssetRegistrationCollector.prototype.collect.name, () => {
    it('collects asset data properly', async () => {
      const assetRepository = mockObject<AssetRepository>({
        addManyRegistrations: async () => [],
        addManyDetails: async () => [],
      })

      const ethereumClient = mockObject<EthereumClient>({
        async getLogsInRange() {
          return logs
        },
      })
      const tokenInspector = mockObject<TokenInspector>({ inspectERC721 })
      const contractAddress = EthereumAddress.fake()

      const collector = new AssetRegistrationCollector(
        ethereumClient,
        contractAddress,
        assetRepository,
        tokenInspector
      )

      const blockRange = new BlockRange([])
      const actualRegistrationsCount = await collector.collect(blockRange)

      expect(ethereumClient.getLogsInRange).toHaveBeenOnlyCalledWith(
        blockRange,
        {
          address: contractAddress.toString(),
          topics: [LogTokenRegistered.topic],
        }
      )

      expect(assetRepository.addManyRegistrations).toHaveBeenOnlyCalledWith(
        expectedRegistrations
      )
      expect(actualRegistrationsCount).toEqual(expectedRegistrations.length)
    })
  })
})

const inspectERC721 = (address: EthereumAddress) => {
  switch (address.toString()) {
    case '0xd02A8A926864A1efe5eC2F8c9C8883f7D07bB471':
      return Promise.resolve({
        name: 'MyriaNFT',
        symbol: 'MyriaNFTSymb',
        contractError: [],
      })
    case '0x58A07373A7a519c55E00380859016fa04De0389C':
      return Promise.resolve({
        name: 'MyriaNFT',
        symbol: 'MyriaNFTSymb',
        contractError: [],
      })
    case '0x2682Da74B6D1B12B2f57bEd9A16FF692eA76a764':
      return Promise.resolve({
        name: 'ThangNv',
        symbol: 'Myria',
        contractError: [],
      })
    case '0x8B9f59eb018A3A6486567A6386840f22cCADdA7b':
      return Promise.resolve({
        name: 'QA',
        symbol: 'Myria',
        contractError: [],
      })
    default:
      return Promise.resolve({
        name: 'MyriaNFT',
        symbol: 'MyriaNFTSymb',
        contractError: [],
      })
  }
}

const logs = [
  {
    blockNumber: 7615050,
    blockHash:
      '0x6599e2175ed88a447b8dff020c3ca69fbb9c90f46fdcb2ccb691de7bff84a406',
    transactionIndex: 36,
    removed: false,
    address: '0xF82C423a30E317f34f9b0997627F2F9c5d239Ad9',
    data: '0x00dfd2f0dc84e0577988b7cf6ef5e0d5a94f324346c5ab4498aaf8c437ead298000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000024b8b86672000000000000000000000000d02a8a926864a1efe5ec2f8c9c8883f7d07bb47100000000000000000000000000000000000000000000000000000000',
    topics: [
      '0x7a0efbc885500f3b4a895231945be4520e4c0ba5ef7274a225a0272c81ccbcb7',
    ],
    transactionHash:
      '0x738afd626d4890fd7f2862485042700c053746cd9722d93212195c7aa98b66d6',
    logIndex: 55,
  },
  {
    blockNumber: 7615417,
    blockHash:
      '0x5943ec4ba062287fd0308fa92ba7c9c093804c254e77d15c94a84577e97ee81c',
    transactionIndex: 26,
    removed: false,
    address: '0xF82C423a30E317f34f9b0997627F2F9c5d239Ad9',
    data: '0x03a7431dae4e3ab74cfa0e7e89a4d7dd507f31e50a03fb5101901a56abeeaa56000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000024b8b8667200000000000000000000000058a07373a7a519c55e00380859016fa04de0389c00000000000000000000000000000000000000000000000000000000',
    topics: [
      '0x7a0efbc885500f3b4a895231945be4520e4c0ba5ef7274a225a0272c81ccbcb7',
    ],
    transactionHash:
      '0xde10bb805dd67134d05fd87b7e9f220ab629125c3fedcd59ee40ffd451a6b111',
    logIndex: 102,
  },
  {
    blockNumber: 7620364,
    blockHash:
      '0x49dadae8c30c906f3af2dc0185ddad382b110a49a74889cb357ec34627af3236',
    transactionIndex: 13,
    removed: false,
    address: '0xF82C423a30E317f34f9b0997627F2F9c5d239Ad9',
    data: '0x03d1d5033acfff91022d676601b0467974b779d275091c4c4622d96af9ae3903000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000024b8b866720000000000000000000000002682da74b6d1b12b2f57bed9a16ff692ea76a76400000000000000000000000000000000000000000000000000000000',
    topics: [
      '0x7a0efbc885500f3b4a895231945be4520e4c0ba5ef7274a225a0272c81ccbcb7',
    ],
    transactionHash:
      '0xb4e2a63ec3b55a4ec9da72cc2d86d19f55a491a26c3020c8e539e77458b3b7f2',
    logIndex: 27,
  },
  {
    blockNumber: 7620454,
    blockHash:
      '0xebdcf1543b2bb27fab6c53eaa016e8286f549cc7cc27fa63a709ed4e6b9c63f7',
    transactionIndex: 15,
    removed: false,
    address: '0xF82C423a30E317f34f9b0997627F2F9c5d239Ad9',
    data: '0x01cfeef89287ce6e0edd493b7dad420069f10c7ea283b46ec33727381d4af4b7000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000024b8b866720000000000000000000000008b9f59eb018a3a6486567a6386840f22ccadda7b00000000000000000000000000000000000000000000000000000000',
    topics: [
      '0x7a0efbc885500f3b4a895231945be4520e4c0ba5ef7274a225a0272c81ccbcb7',
    ],
    transactionHash:
      '0xc324b00d6ecbd1941c40d5489941016eae3a71d5ff27af16d5d31fa6a43636c5',
    logIndex: 62,
  },
]

const expectedRegistrations: AssetRegistrationRecord[] = [
  {
    assetTypeHash: AssetHash.from(
      BigNumber.from(
        '395462755788972160729939577683135559676285060777562998674961596667455525528'
      )
    ),
    address: EthereumAddress('0xd02A8A926864A1efe5eC2F8c9C8883f7D07bB471'),
    quantum: BigNumber.from(1).toBigInt(),
    type: 'MINTABLE_ERC721',
    name: 'MyriaNFT',
    symbol: 'MyriaNFTSymb',
    contractError: [],
  },
  {
    assetTypeHash: AssetHash.from(
      BigNumber.from(
        '1652465222767998105503059181114991553434372817454395374606707395630983981654'
      )
    ),
    address: EthereumAddress('0x58A07373A7a519c55E00380859016fa04De0389C'),
    quantum: BigNumber.from(1).toBigInt(),
    type: 'MINTABLE_ERC721',
    name: 'MyriaNFT',
    symbol: 'MyriaNFTSymb',
    contractError: [],
  },
  {
    assetTypeHash: AssetHash.from(
      BigNumber.from(
        '1727679741333866338593640246949654840813891965024044849102687714219146492163'
      )
    ),
    address: EthereumAddress('0x2682Da74B6D1B12B2f57bEd9A16FF692eA76a764'),
    quantum: BigNumber.from(1).toBigInt(),
    type: 'MINTABLE_ERC721',
    name: 'ThangNv',
    symbol: 'Myria',
    contractError: [],
  },
  {
    assetTypeHash: AssetHash.from(
      BigNumber.from(
        '819699508121163634638867493810194564998637738546813278417243317074555237559'
      )
    ),
    address: EthereumAddress('0x8B9f59eb018A3A6486567A6386840f22cCADdA7b'),
    quantum: BigNumber.from(1).toBigInt(),
    type: 'MINTABLE_ERC721',
    name: 'QA',
    symbol: 'Myria',
    contractError: [],
  },
]
