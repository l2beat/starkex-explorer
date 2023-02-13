import {
  AssetHash,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect, mockFn } from 'earljs'
import { Knex } from 'knex'

import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import {
  VaultRecord,
  VaultRepository,
} from '../../peripherals/database/VaultRepository'
import { mock } from '../../test/mock'
import { Logger } from '../../tools/Logger'
import { SpotHistoryPreprocessor } from './SpotHistoryPreprocessor'

const stateUpdate: StateUpdateRecord = {
  id: 200,
  blockNumber: 1_000,
  stateTransitionHash: Hash256.fake(),
  rootHash: PedersenHash.fake(),
  timestamp: Timestamp(1_000_000_000),
}

const starkKey = StarkKey.fake()

const vault1: VaultRecord & { stateUpdateId: number } = {
  stateUpdateId: 200,
  vaultId: 100n,
  assetHash: AssetHash.fake('1'),
  starkKey,
  balance: 1_000_000n,
}

const vault2: VaultRecord & { stateUpdateId: number } = {
  stateUpdateId: 200,
  vaultId: 200n,
  assetHash: AssetHash.fake('2'),
  starkKey,
  balance: 2_000_000n,
}

const closingVault: VaultRecord & { stateUpdateId: number } = {
  stateUpdateId: 200,
  vaultId: 300n,
  assetHash: AssetHash.ZERO,
  starkKey: StarkKey.ZERO,
  balance: 0n,
}

describe(SpotHistoryPreprocessor.name, () => {
  describe(
    SpotHistoryPreprocessor.prototype.preprocessNextStateUpdate.name,
    () => {
      it('should close vaults with zero stark key and process others', async () => {
        const trx = mock<Knex.Transaction>()
        const vaultRepository = mock<VaultRepository>({
          getByStateUpdateId: async () => [vault1, vault2, closingVault],
        })
        const preprocessedRepository = mock<
          PreprocessedAssetHistoryRepository<AssetHash>
        >({
          getCurrentByStarkKeyAndAssets: async (
            starkKey: StarkKey,
            assets: AssetHash[]
          ) => {
            if (assets.length !== 1) {
              throw new Error('Expected call for one asset only')
            }
            if (assets[0] == vault1.assetHash) {
              return [
                {
                  historyId: 10,
                  stateUpdateId: 10,
                  blockNumber: 500,
                  timestamp: Timestamp(900_000_000),
                  starkKey,
                  positionOrVaultId: vault1.vaultId,
                  assetHashOrId: vault1.assetHash,
                  balance: 500_000n,
                  prevBalance: 100_000n,
                  price: undefined,
                  prevPrice: undefined,
                  isCurrent: true,
                  prevHistoryId: 5,
                },
              ]
            } else {
              return []
            }
          },
        })

        const spotHistoryPreprocessor = new SpotHistoryPreprocessor(
          preprocessedRepository,
          vaultRepository,
          Logger.SILENT
        )
        const mockClosePositionOrVault = mockFn().resolvesTo(undefined)
        spotHistoryPreprocessor.closePositionOrVault = mockClosePositionOrVault
        const mockAddNewRecordsAndMakeThemCurrent =
          mockFn().resolvesTo(undefined)
        spotHistoryPreprocessor.addNewRecordsAndMakeThemCurrent =
          mockAddNewRecordsAndMakeThemCurrent

        await spotHistoryPreprocessor.preprocessNextStateUpdate(
          trx,
          stateUpdate
        )

        expect(mockClosePositionOrVault).toHaveBeenCalledExactlyWith([
          [trx, closingVault.vaultId, stateUpdate, {}],
        ])
        expect(mockAddNewRecordsAndMakeThemCurrent).toHaveBeenCalledExactlyWith(
          [
            [
              trx,
              [
                {
                  stateUpdateId: stateUpdate.id,
                  blockNumber: stateUpdate.blockNumber,
                  timestamp: stateUpdate.timestamp,
                  starkKey,
                  positionOrVaultId: vault1.vaultId,
                  assetHashOrId: vault1.assetHash,
                  balance: vault1.balance,
                  prevBalance: 500_000n,
                  prevHistoryId: 10,
                },
              ],
            ],
            [
              trx,
              [
                {
                  stateUpdateId: stateUpdate.id,
                  blockNumber: stateUpdate.blockNumber,
                  timestamp: stateUpdate.timestamp,
                  starkKey,
                  positionOrVaultId: vault2.vaultId,
                  assetHashOrId: vault2.assetHash,
                  balance: vault2.balance,
                  prevBalance: 0n,
                  prevHistoryId: undefined,
                },
              ],
            ],
          ]
        )
      })
    }
  )
})
