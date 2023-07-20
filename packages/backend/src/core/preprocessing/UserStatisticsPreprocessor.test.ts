import { Hash256, PedersenHash, StarkKey, Timestamp } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect, mockFn, mockObject } from 'earl'
import { Knex } from 'knex'

import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { PreprocessedUserStatisticsRepository } from '../../peripherals/database/PreprocessedUserStatisticsRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { UserStatisticsPreprocessor } from './UserStatisticsPreprocessor'

const stateUpdate: StateUpdateRecord = {
  id: 200,
  batchId: 199,
  blockNumber: 1_000,
  stateTransitionHash: Hash256.fake(),
  rootHash: PedersenHash.fake(),
  timestamp: Timestamp(1_000_000_000),
}

const buildPreprocessedAssetHistoryRecord = (
  id: number,
  starkKey?: StarkKey
) => ({
  id,
  stateUpdateId: 100 + id,
  blockNumber: 2_0000 + id,
  timestamp: Timestamp(9_000_000 + id),
  assetCount: 0,
  balanceChangeCount: 0,
  starkKey: starkKey ?? StarkKey.fake('ff' + id.toString()),
  prevHistoryId: undefined,
})

describe(UserStatisticsPreprocessor.name, () => {
  describe(
    UserStatisticsPreprocessor.prototype.preprocessNextStateUpdate.name,
    () => {
      it('should correctly calculate the new statistics record', async () => {
        const trx = mockObject<Knex.Transaction>()
        const sk1 = StarkKey.fake('ab1')
        const sk2 = StarkKey.fake('ab2')
        const sk3 = StarkKey.fake('ab3')
        const sk4 = StarkKey.fake('ab4')

        const mockPreprocessedUserStatisticsRepository =
          mockObject<PreprocessedUserStatisticsRepository>({
            add: mockFn().resolvesTo(undefined),
            findCurrentByStarkKey: async (starkKey) => {
              return {
                [sk1.toString()]: {
                  ...buildPreprocessedAssetHistoryRecord(1, sk1),
                },
                [sk2.toString()]: {
                  ...buildPreprocessedAssetHistoryRecord(1, sk2),
                  assetCount: 7,
                },
                [sk3.toString()]: {
                  ...buildPreprocessedAssetHistoryRecord(1, sk3),
                  assetCount: 9,
                  balanceChangeCount: 10,
                  prevHistoryId: 654,
                },
                [sk4.toString()]: undefined,
              }[starkKey.toString()]
            },
          })

        const mockPreprocessedAssetHistoryRepository =
          mockObject<PreprocessedAssetHistoryRepository>({
            getCountByStateUpdateIdGroupedByStarkKey: mockFn().resolvesTo([
              { starkKey: sk1, count: 5 },
              { starkKey: sk2, count: 10 },
              { starkKey: sk3, count: 15 },
              { starkKey: sk4, count: 20 },
            ]),
            getCountOfNewAssetsByStateUpdateIdGroupedByStarkKey:
              mockFn().resolvesTo([
                { starkKey: sk2, count: 100 },
                { starkKey: sk3, count: 150 },
                { starkKey: sk4, count: 200 },
              ]),
            getCountOfRemovedAssetsByStateUpdateIdGroupedByStarkKey:
              mockFn().resolvesTo([
                { starkKey: sk1, count: 200 },
                { starkKey: sk2, count: 100 },
                { starkKey: sk3, count: 350 },
              ]),
          })

        const userStatisticsPreprocessor = new UserStatisticsPreprocessor(
          mockPreprocessedUserStatisticsRepository,
          mockPreprocessedAssetHistoryRepository,
          mockObject<StateUpdateRepository>(),
          mockObject<KeyValueStore>(),
          Logger.SILENT
        )

        await userStatisticsPreprocessor.preprocessNextStateUpdate(
          trx,
          stateUpdate
        )

        expect(
          mockPreprocessedUserStatisticsRepository.add
        ).toHaveBeenCalledTimes(4)
        expect(
          mockPreprocessedUserStatisticsRepository.add
        ).toHaveBeenCalledWith(
          {
            stateUpdateId: 200,
            blockNumber: 1000,
            timestamp: Timestamp(1_000_000_000),
            starkKey: sk1,
            balanceChangeCount: 5,
            assetCount: -200,
            prevHistoryId: 1,
          },
          trx
        )
        expect(
          mockPreprocessedUserStatisticsRepository.add
        ).toHaveBeenCalledWith(
          {
            stateUpdateId: 200,
            blockNumber: 1000,
            timestamp: Timestamp(1_000_000_000),
            starkKey: sk2,
            balanceChangeCount: 10,
            assetCount: 7,
            prevHistoryId: 1,
          },
          trx
        )
        expect(
          mockPreprocessedUserStatisticsRepository.add
        ).toHaveBeenCalledWith(
          {
            stateUpdateId: 200,
            blockNumber: 1000,
            timestamp: Timestamp(1_000_000_000),
            starkKey: sk3,
            balanceChangeCount: 25,
            assetCount: -191,
            prevHistoryId: 1,
          },
          trx
        )
        expect(
          mockPreprocessedUserStatisticsRepository.add
        ).toHaveBeenCalledWith(
          {
            stateUpdateId: 200,
            blockNumber: 1000,
            timestamp: Timestamp(1_000_000_000),
            starkKey: sk4,
            balanceChangeCount: 20,
            assetCount: 200,
            prevHistoryId: undefined,
          },
          trx
        )
      })
    }
  )

  describe(
    UserStatisticsPreprocessor.prototype.rollbackOneStateUpdate.name,
    () => {
      it('should delete the state details', async () => {
        const trx = mockObject<Knex.Transaction>()
        const mockPreprocessedUserStatisticsRepository =
          mockObject<PreprocessedUserStatisticsRepository>({
            deleteByStateUpdateId: mockFn().resolvesTo(undefined),
          })

        const userStatisticsPreprocessor = new UserStatisticsPreprocessor(
          mockPreprocessedUserStatisticsRepository,
          mockObject<PreprocessedAssetHistoryRepository>(),
          mockObject<StateUpdateRepository>(),
          mockObject<KeyValueStore>(),
          Logger.SILENT
        )

        await userStatisticsPreprocessor.rollbackOneStateUpdate(
          trx,
          stateUpdate.id
        )

        expect(
          mockPreprocessedUserStatisticsRepository.deleteByStateUpdateId
        ).toHaveBeenOnlyCalledWith(stateUpdate.id, trx)
      })
    }
  )
})
