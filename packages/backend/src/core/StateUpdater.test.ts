import { MerkleTree, PositionLeaf } from '@explorer/state'
import {
  AssetHash,
  AssetId,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earljs'

import type { MerkleTreeRepository } from '../peripherals/database/MerkleTreeRepository'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import {
  UserTransactionRecord,
  UserTransactionRepository,
} from '../peripherals/database/transactions/UserTransactionRepository'
import type { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { mock } from '../test/mock'
import { Logger } from '../tools/Logger'
import { StateUpdater } from './StateUpdater'

const EMPTY_STATE_HASH = PedersenHash(
  '52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
)

describe(StateUpdater.name, () => {
  describe(StateUpdater.prototype.ensureStateTree.name, () => {
    it('sets state tree before an initial state transition', async () => {
      const rollupStateRepository = mock<MerkleTreeRepository<PositionLeaf>>({
        persist: async () => {},
      })
      const stateUpdater = new StateUpdater(
        mock<StateUpdateRepository>(),
        rollupStateRepository,
        mock<EthereumClient>(),
        mock<UserTransactionRepository>(),
        Logger.SILENT,
        EMPTY_STATE_HASH,
        PositionLeaf.EMPTY
      )
      // EMPTY_STATE_HASH is for tree of height 64 and  recalculating this hash
      // in tests on slower machines (e.g. CI) makes test flakey async-wise.
      await stateUpdater.ensureStateTree(EMPTY_STATE_HASH, 3n)
      const rollupStateEmptyHashForHeight3 = PedersenHash(
        '048c477cdb37576ddff3c3fe5c1c7559778d6cbade51e5a6c1fe71e6bdb1d4db'
      )
      expect(await stateUpdater.stateTree?.hash()).toEqual(
        rollupStateEmptyHashForHeight3
      )
      expect(rollupStateRepository.persist.calls.length).toEqual(1)
    })

    it('sets state tree after restart', async () => {
      const stateUpdater = new StateUpdater(
        mock<StateUpdateRepository>(),
        mock<MerkleTreeRepository<PositionLeaf>>(),
        mock<EthereumClient>(),
        mock<UserTransactionRepository>(),
        Logger.SILENT,
        EMPTY_STATE_HASH,
        PositionLeaf.EMPTY
      )
      const hash = PedersenHash.fake()
      await stateUpdater.ensureStateTree(hash, 64n)
      expect(await stateUpdater.stateTree?.hash()).toEqual(hash)
    })

    it('resets state tree after reorg', async () => {
      const stateUpdater = new StateUpdater(
        mock<StateUpdateRepository>(),
        mock<MerkleTreeRepository<PositionLeaf>>(),
        mock<EthereumClient>(),
        mock<UserTransactionRepository>(),
        Logger.SILENT,
        EMPTY_STATE_HASH,
        PositionLeaf.EMPTY
      )
      const hashA = PedersenHash.fake('a')
      const hashB = PedersenHash.fake('b')
      await stateUpdater.ensureStateTree(hashA, 64n)
      expect(await stateUpdater.stateTree?.hash()).toEqual(hashA)
      await stateUpdater.ensureStateTree(hashB, 64n)
      expect(await stateUpdater.stateTree?.hash()).toEqual(hashB)
    })

    it('leaves state intact before a subsequent state transition', async () => {
      const stateUpdater = new StateUpdater(
        mock<StateUpdateRepository>(),
        mock<MerkleTreeRepository<PositionLeaf>>(),
        mock<EthereumClient>(),
        mock<UserTransactionRepository>(),
        Logger.SILENT,
        EMPTY_STATE_HASH,
        PositionLeaf.EMPTY
      )
      const hash = PedersenHash.fake()
      const rollupStateA = await stateUpdater.ensureStateTree(hash, 64n)
      const rollupStateB = await stateUpdater.ensureStateTree(hash, 64n)
      expect(rollupStateA).toReferentiallyEqual(rollupStateB)
    })
  })

  describe(StateUpdater.prototype.discardAfter.name, () => {
    it('deletes updates after block number', async () => {
      const stateUpdateRepository = mock<StateUpdateRepository>({
        deleteAfter: async () => 0,
      })

      const stateUpdater = new StateUpdater(
        stateUpdateRepository,
        mock<MerkleTreeRepository<PositionLeaf>>(),
        mock<EthereumClient>(),
        mock<UserTransactionRepository>(),
        Logger.SILENT,
        EMPTY_STATE_HASH,
        PositionLeaf.EMPTY
      )

      await stateUpdater.discardAfter(20)
      await stateUpdater.discardAfter(40)

      expect(stateUpdateRepository.deleteAfter).toHaveBeenCalledExactlyWith([
        [20],
        [40],
      ])
    })
  })

  describe(StateUpdater.prototype.extractTransactionHashes.name, () => {
    it('throws if forced transaction missing in database', async () => {
      const userTransactionRepository = mock<UserTransactionRepository>({
        getNotIncluded: async () => [],
      })

      const stateUpdater = new StateUpdater(
        mock<StateUpdateRepository>(),
        mock<MerkleTreeRepository<PositionLeaf>>(),
        mock<EthereumClient>(),
        userTransactionRepository,
        Logger.SILENT,
        EMPTY_STATE_HASH,
        PositionLeaf.EMPTY
      )

      await expect(
        stateUpdater.extractTransactionHashes([
          {
            type: 'withdrawal',
            amount: 1n,
            positionId: 12n,
            starkKey: StarkKey.fake(),
          },
          {
            type: 'trade',
            positionIdA: 12n,
            positionIdB: 34n,
            starkKeyA: StarkKey.fake(),
            starkKeyB: StarkKey.fake(),
            collateralAmount: 123n,
            syntheticAmount: 456n,
            isABuyingSynthetic: true,
            nonce: 123n,
            syntheticAssetId: AssetId('ETH-7'),
          },
        ])
      ).toBeRejected(
        'Forced action included in state update does not have a matching mined transaction'
      )
    })

    it('correctly matches transactions', async () => {
      const transactions: UserTransactionRecord[] = [
        {
          transactionHash: Hash256.fake('111'),
          id: 1,
          blockNumber: 1,
          timestamp: Timestamp(1),
          starkKeyA: StarkKey.fake('aaa'),
          vaultOrPositionIdA: 12n,
          data: {
            type: 'ForcedWithdrawal',
            starkKey: StarkKey.fake('aaa'),
            positionId: 12n,
            quantizedAmount: 1n,
          },
        },
        {
          transactionHash: Hash256.fake('222'),
          id: 2,
          blockNumber: 2,
          timestamp: Timestamp(2),
          starkKeyA: StarkKey.fake('aaa'),
          vaultOrPositionIdA: 12n,
          data: {
            type: 'ForcedWithdrawal',
            starkKey: StarkKey.fake('aaa'),
            positionId: 12n,
            quantizedAmount: 1n,
          },
        },
        {
          transactionHash: Hash256.fake('333'),
          id: 3,
          blockNumber: 3,
          timestamp: Timestamp(3),
          starkKeyA: StarkKey.fake('aaa'),
          starkKeyB: StarkKey.fake('bbb'),
          vaultOrPositionIdA: 12n,
          vaultOrPositionIdB: 34n,
          data: {
            type: 'ForcedTrade',
            positionIdA: 12n,
            positionIdB: 34n,
            starkKeyA: StarkKey.fake('aaa'),
            starkKeyB: StarkKey.fake('bbb'),
            collateralAmount: 123n,
            collateralAssetId: AssetId.USDC,
            syntheticAmount: 456n,
            syntheticAssetId: AssetId('ETH-7'),
            isABuyingSynthetic: true,
            nonce: 123n,
          },
        },
        {
          transactionHash: Hash256.fake('444'),
          id: 4,
          blockNumber: 2,
          timestamp: Timestamp(2),
          starkKeyA: StarkKey.fake('aaa'),
          vaultOrPositionIdA: 45n,
          data: {
            type: 'FullWithdrawal',
            starkKey: StarkKey.fake('aaa'),
            vaultId: 45n,
          },
        },
      ]

      const userTransactionRepository = mock<UserTransactionRepository>({
        async getNotIncluded() {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return transactions as UserTransactionRecord<any>[]
        },
      })

      const stateUpdater = new StateUpdater(
        mock<StateUpdateRepository>(),
        mock<MerkleTreeRepository<PositionLeaf>>(),
        mock<EthereumClient>(),
        userTransactionRepository,
        Logger.SILENT,
        EMPTY_STATE_HASH,
        PositionLeaf.EMPTY
      )

      expect(
        await stateUpdater.extractTransactionHashes([
          {
            type: 'withdrawal',
            starkKey: StarkKey.fake('aaa'),
            positionId: 12n,
            amount: 1n,
          },
          {
            type: 'trade',
            positionIdA: 12n,
            positionIdB: 34n,
            starkKeyA: StarkKey.fake('aaa'),
            starkKeyB: StarkKey.fake('bbb'),
            collateralAmount: 123n,
            syntheticAmount: 456n,
            syntheticAssetId: AssetId('ETH-7'),
            isABuyingSynthetic: true,
            nonce: 123n,
          },
          {
            type: 'fullWithdrawal',
            starkKey: StarkKey.fake('aaa'),
            assetHash: AssetHash.fake('fff1'),
            vaultId: 45n,
            balanceDifference: 100n,
          },
        ])
      ).toEqual([Hash256.fake('111'), Hash256.fake('333'), Hash256.fake('444')])
    })

    it("doesn't match identical transaction twice", async () => {
      const transactions: UserTransactionRecord[] = [
        {
          transactionHash: Hash256.fake('111'),
          id: 1,
          blockNumber: 2,
          timestamp: Timestamp(2),
          starkKeyA: StarkKey.fake('aaa'),
          vaultOrPositionIdA: 45n,
          data: {
            type: 'FullWithdrawal',
            starkKey: StarkKey.fake('aaa'),
            vaultId: 45n,
          },
        },
        {
          transactionHash: Hash256.fake('222'),
          id: 1,
          blockNumber: 2,
          timestamp: Timestamp(2),
          starkKeyA: StarkKey.fake('aaa'),
          vaultOrPositionIdA: 45n,
          data: {
            type: 'FullWithdrawal',
            starkKey: StarkKey.fake('aaa'),
            vaultId: 45n,
          },
        },
      ]

      const userTransactionRepository = mock<UserTransactionRepository>({
        async getNotIncluded() {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return transactions as UserTransactionRecord<any>[]
        },
      })

      const stateUpdater = new StateUpdater(
        mock<StateUpdateRepository>(),
        mock<MerkleTreeRepository<PositionLeaf>>(),
        mock<EthereumClient>(),
        userTransactionRepository,
        Logger.SILENT,
        EMPTY_STATE_HASH,
        PositionLeaf.EMPTY
      )

      expect(
        await stateUpdater.extractTransactionHashes([
          {
            type: 'fullWithdrawal',
            starkKey: StarkKey.fake('aaa'),
            assetHash: AssetHash.fake('fff1'),
            vaultId: 45n,
            balanceDifference: 100n,
          },
          {
            type: 'fullWithdrawal',
            starkKey: StarkKey.fake('aaa'),
            assetHash: AssetHash.fake('fff1'),
            vaultId: 45n,
            balanceDifference: 100n,
          },
        ])
      ).toEqual([Hash256.fake('111'), Hash256.fake('222')])
    })
  })

  describe(StateUpdater.prototype.processStateTransition.name, () => {
    it('throws if calculated root hash does not match the one from verifier', async () => {
      const stateUpdater = new StateUpdater(
        mock<StateUpdateRepository>(),
        mock<MerkleTreeRepository<PositionLeaf>>(),
        mock<EthereumClient>(),
        mock<UserTransactionRepository>(),
        Logger.SILENT,
        EMPTY_STATE_HASH,
        PositionLeaf.EMPTY,
        mock<MerkleTree<PositionLeaf>>({
          update: async () =>
            ({
              hash: async () => PedersenHash.fake('1234'),
            } as unknown as MerkleTree<PositionLeaf>),
        })
      )

      await expect(
        stateUpdater.processStateTransition(
          mock<StateTransitionRecord>(),
          PedersenHash.fake('987'),
          [],
          [],
          []
        )
      ).toBeRejected('State transition calculated incorrectly')
    })
  })
})
