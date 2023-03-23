import { EthereumAddress } from '@explorer/types'
import { expect, mockObject } from 'earljs'

import { BlockRange } from '../../model'
import { AssetRepository } from '../../peripherals/database/AssetRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { TokenInspector } from '../../peripherals/ethereum/TokenInspector'
import { DepositWithTokenIdCollector } from './DepositWithTokenIdCollector'
import { LogDepositWithTokenId } from './events'

// TODO: Add proper tests. Right now we don't have any events in the testnet

describe(DepositWithTokenIdCollector.name, () => {
  describe(DepositWithTokenIdCollector.prototype.collect.name, () => {
    it('collects asset data properly', async () => {
      const assetRepository = mockObject<AssetRepository>({
        addManyDetails: async () => [],
      })

      const ethereumClient = mockObject<EthereumClient>({
        async getLogsInRange() {
          return []
        },
      })
      const tokenInspector = mockObject<TokenInspector>()
      const contractAddress = EthereumAddress.fake()

      const collector = new DepositWithTokenIdCollector(
        ethereumClient,
        contractAddress,
        assetRepository,
        tokenInspector
      )

      const blockRange = new BlockRange([])
      const actualAssetsWithTokenId = await collector.collect(blockRange)

      expect(ethereumClient.getLogsInRange).toHaveBeenOnlyCalledWith(
        blockRange,
        {
          address: contractAddress.toString(),
          topics: [LogDepositWithTokenId.topic],
        }
      )

      expect(actualAssetsWithTokenId).toEqual(expectedAssetsWithTokenId)
    })
  })
})

const expectedAssetsWithTokenId: never[] = []
