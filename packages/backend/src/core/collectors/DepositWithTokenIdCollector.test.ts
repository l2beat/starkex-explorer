import { EthereumAddress } from '@explorer/types'
import { expect, mockFn } from 'earljs'

import { BlockRange } from '../../model'
import { TokenRegistrationRepository } from '../../peripherals/database/TokenRegistrationRepository'
import { TokenRepository } from '../../peripherals/database/TokenRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { HackFilter } from '../../peripherals/ethereum/HackJsonRpcProvider'
import { mock } from '../../test/mock'
import { DepositWithTokenIdCollector } from './DepositWithTokenIdCollector'
import { LogDepositWithTokenId } from './events'

describe(DepositWithTokenIdCollector.name, () => {
  describe(DepositWithTokenIdCollector.prototype.collect.name, () => {
    it('collects asset data properly', async () => {
      const tokenRegistrationRepository = mock<TokenRegistrationRepository>({
        addMany: async () => [],
      })
      const tokenRepository = mock<TokenRepository>({
        addMany: async () => [],
      })

      const mockGetLogsInRange = mockFn<[BlockRange, HackFilter]>()
      mockGetLogsInRange.returns([])

      const mockEthereumClient = mock<EthereumClient>()
      const contractAddress = EthereumAddress.fake()

      mockEthereumClient.getLogsInRange = mockGetLogsInRange

      const collector = new DepositWithTokenIdCollector(
        mockEthereumClient,
        contractAddress,
        tokenRegistrationRepository,
        tokenRepository
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
