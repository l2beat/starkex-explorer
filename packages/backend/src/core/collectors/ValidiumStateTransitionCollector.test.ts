import { EthereumAddress, Hash256 } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earljs'

import { BlockRange } from '../../model'
import { StateTransitionRepository } from '../../peripherals/database/StateTransitionRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { HackFilter } from '../../peripherals/ethereum/HackJsonRpcProvider'
import { LogRootUpdate, LogStateTransitionFact, LogUpdateState } from './events'
import { ValidiumStateTransitionCollector } from './ValidiumStateTransitionCollector'

describe(ValidiumStateTransitionCollector.name, () => {
  describe(ValidiumStateTransitionCollector.prototype.discardAfter.name, () => {
    it('discards all records from pageMappingRepository after given block', async () => {
      const stateTransitionRepository = mockObject<StateTransitionRepository>({
        deleteAfter: async () => 0,
      })

      const collector = new ValidiumStateTransitionCollector(
        mockObject<EthereumClient>(),
        stateTransitionRepository,
        EthereumAddress.fake(),
        LogRootUpdate
      )

      await collector.discardAfter(123)

      expect(stateTransitionRepository.deleteAfter).toHaveBeenOnlyCalledWith(
        123
      )
    })
  })

  describe(ValidiumStateTransitionCollector.prototype.collect.name, () => {
    it('collects data properly for spot trading', async () => {
      const stateTransitionRepository = mockObject<StateTransitionRepository>({
        addMany: async () => [],
      })
      const mockGetLogsInRange = mockFn<
        [BlockRange, HackFilter],
        Promise<any>
      >()
      mockGetLogsInRange.resolvesTo([
        {
          blockNumber: 7344486,
          blockHash:
            '0xab2bde61ea56af1e7ea9b1f6dabbc930bb98452ab8bba28ac93a5d6ebf9638cb',
          transactionIndex: 54,
          removed: false,
          address: '0xF82C423a30E317f34f9b0997627F2F9c5d239Ad9',
          data: '0xb760c05d917476eb1ef587535fcabf68638fa8080bba8d420780493775fd9ab8',
          topics: [
            '0x9866f8ddfe70bb512b2f2b28b49d4017c43f7ba775f1a20c61c13eea8cdac111',
          ],
          transactionHash:
            '0xc80951be315784099930a5e23ce63cfe6d653c4714a206abee00fcb6869782dd',
          logIndex: 107,
        },
        {
          blockNumber: 7344486,
          blockHash:
            '0xab2bde61ea56af1e7ea9b1f6dabbc930bb98452ab8bba28ac93a5d6ebf9638cb',
          transactionIndex: 54,
          removed: false,
          address: '0xF82C423a30E317f34f9b0997627F2F9c5d239Ad9',
          data: '0x00000000000000000000000000000000000000000000000000000000000001f1000000000000000000000000000000000000000000000000000000000000020300db43200368c79bcb240270d0ce65b4e2825d77dfd8de82246caa98bda110470075364111a7a336756626d19fc8ec8df6328a5e63681c68ffaa312f6bf98c5c01861c08e3979b68afdf92e02caeb68b52319015aae5ebdef387e20a8285bcb6',
          topics: [
            '0x54fe7a67f8957a96919a0d1b81eeb25ea8c06f96ad528671da17a4a840040664',
          ],
          transactionHash:
            '0xc80951be315784099930a5e23ce63cfe6d653c4714a206abee00fcb6869782dd',
          logIndex: 108,
        },
      ])
      const mockEthereumClient = mockObject<EthereumClient>()
      const starkExAddress = EthereumAddress.fake()

      mockEthereumClient.getLogsInRange = mockGetLogsInRange

      const collector = new ValidiumStateTransitionCollector(
        mockEthereumClient,
        stateTransitionRepository,
        starkExAddress,
        LogRootUpdate
      )

      const mockBlockRange = mockObject<BlockRange>()

      const transitions = await collector.collect(mockBlockRange)

      const testTransitions = [
        {
          blockNumber: 7344486,
          transactionHash: Hash256(
            '0xc80951be315784099930a5e23ce63cfe6d653c4714a206abee00fcb6869782dd'
          ),
          stateTransitionHash: Hash256(
            '0xb760c05d917476eb1ef587535fcabf68638fa8080bba8d420780493775fd9ab8'
          ),
          sequenceNumber: 497,
          batchId: 515,
        },
      ]

      const testRecords = [
        {
          blockNumber: 7344486,
          stateTransitionHash: Hash256(
            '0xb760c05d917476eb1ef587535fcabf68638fa8080bba8d420780493775fd9ab8'
          ),
        },
      ]

      expect(mockEthereumClient.getLogsInRange).toHaveBeenOnlyCalledWith(
        mockBlockRange,
        {
          address: starkExAddress.toString(),
          topics: [[LogStateTransitionFact.topic, LogRootUpdate.topic]],
        }
      )
      expect(stateTransitionRepository.addMany).toHaveBeenOnlyCalledWith(
        testRecords
      )
      expect(transitions).toEqual(testTransitions)
    })

    it('collects data properly for perpetual trading', async () => {
      const stateTransitionRepository = mockObject<StateTransitionRepository>({
        addMany: async () => [],
      })
      const mockGetLogsInRange = mockFn<
        [BlockRange, HackFilter],
        Promise<any>
      >()
      mockGetLogsInRange.resolvesTo([
        {
          blockNumber: 7549714,
          blockHash:
            '0x9e6a60bb32bba378f026264278ec7d6a898751947c0e12b09a45b6b60d4bb3b0',
          transactionIndex: 32,
          removed: false,
          address: '0x6E5de338D71af33B57831C5552775f54394d181B',
          data: '0x9355065eb4c6a9e63cc756ed12a06894294ece370ceeb232f82c65366ac6caf1',
          topics: [
            '0x9866f8ddfe70bb512b2f2b28b49d4017c43f7ba775f1a20c61c13eea8cdac111',
          ],
          transactionHash:
            '0xf93660b7282f9dce233f54509a4085833f3d6b8024ad78ac72a8bcf1eaeab344',
          logIndex: 83,
        },
        {
          blockNumber: 7549714,
          blockHash:
            '0x9e6a60bb32bba378f026264278ec7d6a898751947c0e12b09a45b6b60d4bb3b0',
          transactionIndex: 32,
          removed: false,
          address: '0x6E5de338D71af33B57831C5552775f54394d181B',
          data: '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000003ac',
          topics: [
            '0x2672b53d25204094519f7b0fba8d2b5cd0cc1e426f49554c89461cdb9dcec08f',
          ],
          transactionHash:
            '0xf93660b7282f9dce233f54509a4085833f3d6b8024ad78ac72a8bcf1eaeab344',
          logIndex: 84,
        },
      ])
      const mockEthereumClient = mockObject<EthereumClient>()

      mockEthereumClient.getLogsInRange = mockGetLogsInRange

      const starkExAddress = EthereumAddress.fake()

      const collector = new ValidiumStateTransitionCollector(
        mockEthereumClient,
        stateTransitionRepository,
        starkExAddress,
        LogUpdateState
      )

      const mockBlockRange = mockObject<BlockRange>()

      const transitions = await collector.collect(mockBlockRange)

      const testRecords = [
        {
          blockNumber: 7549714,
          stateTransitionHash: Hash256(
            '0x9355065eb4c6a9e63cc756ed12a06894294ece370ceeb232f82c65366ac6caf1'
          ),
        },
      ]

      const testTransitions = [
        {
          blockNumber: 7549714,
          transactionHash: Hash256(
            '0xf93660b7282f9dce233f54509a4085833f3d6b8024ad78ac72a8bcf1eaeab344'
          ),
          stateTransitionHash: Hash256(
            '0x9355065eb4c6a9e63cc756ed12a06894294ece370ceeb232f82c65366ac6caf1'
          ),
          sequenceNumber: 32,
          batchId: 940,
        },
      ]

      expect(mockEthereumClient.getLogsInRange).toHaveBeenOnlyCalledWith(
        mockBlockRange,
        {
          address: starkExAddress.toString(),
          topics: [[LogStateTransitionFact.topic, LogUpdateState.topic]],
        }
      )
      expect(stateTransitionRepository.addMany).toHaveBeenOnlyCalledWith(
        testRecords
      )
      expect(transitions).toEqual(testTransitions)
    })
  })
})
