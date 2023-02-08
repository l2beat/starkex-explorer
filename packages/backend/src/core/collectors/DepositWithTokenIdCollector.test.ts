import { EthereumAddress } from '@explorer/types'
import { expect, mockFn } from 'earljs'

import { BlockRange } from '../../model'
import { AssetRepository } from '../../peripherals/database/AssetRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { HackFilter } from '../../peripherals/ethereum/HackJsonRpcProvider'
import { TokenInspector } from '../../peripherals/ethereum/TokenInspector'
import { mock } from '../../test/mock'
import { DepositWithTokenIdCollector } from './DepositWithTokenIdCollector'
import { LogDepositWithTokenId } from './events'

//TODO: Add proper tests. Right now we don't have any events in the testnet

describe(DepositWithTokenIdCollector.name, () => {
  describe(DepositWithTokenIdCollector.prototype.collect.name, () => {
    it('collects asset data properly', async () => {
      const assetRepository = mock<AssetRepository>({
        addManyDetails: async () => []
      })

      const mockGetLogsInRange = mockFn<[BlockRange, HackFilter]>()
      mockGetLogsInRange.returns([])

      const mockEthereumClient = mock<EthereumClient>()
      const mockTokenInspector = mock<TokenInspector>()
      const contractAddress = EthereumAddress.fake()

      mockEthereumClient.getLogsInRange = mockGetLogsInRange

      const collector = new DepositWithTokenIdCollector(
        mockEthereumClient,
        contractAddress,
        assetRepository,
        mockTokenInspector
      )

      const mockBlockRange = mock<BlockRange>()

      const actualAssetsWithTokenId = await collector.collect(mockBlockRange)

      expect(mockEthereumClient.getLogsInRange).toHaveBeenCalledWith([
        mockBlockRange,
        {
          address: contractAddress.toString(),
          topics: [LogDepositWithTokenId.topic],
        },
      ])

      expect(actualAssetsWithTokenId).toEqual(expectedAssetsWitkTokenId)
    })
  })
})

const _ = []

const expectedAssetsWitkTokenId: never[] = []
