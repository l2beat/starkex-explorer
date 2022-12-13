import { State } from '@explorer/encoding'
import { AssetId, PedersenHash, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { PositionLeaf } from '../src'
import { InMemoryMerkleStorage } from '../src/InMemoryMerkleStorage'
import { RollupState } from '../src/RollupState'

const emptyState: State = {
  positionRoot: PedersenHash.ZERO,
  positionHeight: 0,
  orderRoot: PedersenHash.ZERO,
  orderHeight: 0,
  indices: [],
  timestamp: Timestamp(0),
  oraclePrices: [],
  systemTime: Timestamp(0),
}

describe(RollupState.name, () => {
  describe(RollupState.empty.name, () => {
    it('has a specific root hash', async () => {
      const storage = new InMemoryMerkleStorage<PositionLeaf>()
      const empty = await RollupState.empty(storage)
      expect(await empty.positionTree.hash()).toEqual(
        PedersenHash(
          '052ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
        )
      )
    })
  })

  describe(RollupState.prototype.update.name, () => {
    it('can update a single position', async () => {
      const storage = new InMemoryMerkleStorage<PositionLeaf>()
      let rollup = await RollupState.empty(storage, 3n)

      const newPositions = await rollup.calculateUpdatedPositions({
        oldState: emptyState,
        funding: [],
        positions: [
          {
            positionId: 5n,
            collateralBalance: 555n,
            fundingTimestamp: Timestamp(0),
            starkKey: StarkKey.fake('5'),
            balances: [],
          },
        ],
      })
      rollup = await rollup.update(newPositions)

      const updated = await rollup.positionTree.getLeaf(5n)
      const data = updated.getData()
      expect(data).toEqual({
        starkKey: StarkKey.fake('5'),
        collateralBalance: 555n,
        assets: [],
      })

      expect(newPositions).toEqual([
        {
          index: 5n,
          value: expect.objectWith({
            assets: [],
            collateralBalance: data.collateralBalance,
            starkKey: data.starkKey,
          }),
        },
      ])
    })

    it('can update a single position with assets', async () => {
      const storage = new InMemoryMerkleStorage<PositionLeaf>()
      let rollup = await RollupState.empty(storage, 3n)
      const newPositions = await rollup.calculateUpdatedPositions({
        oldState: emptyState,
        funding: [
          {
            timestamp: Timestamp(1001),
            indices: [
              { assetId: AssetId('BTC-10'), value: 1n },
              { assetId: AssetId('ETH-9'), value: -1n },
            ],
          },
        ],
        positions: [
          {
            positionId: 5n,
            collateralBalance: 555n,
            fundingTimestamp: Timestamp(1001),
            starkKey: StarkKey.fake('5'),
            balances: [
              { assetId: AssetId('BTC-10'), balance: 5n },
              { assetId: AssetId('ETH-9'), balance: 55n },
            ],
          },
        ],
      })
      rollup = await rollup.update(newPositions)

      const updated = await rollup.positionTree.getLeaf(5n)
      expect(updated.getData()).toEqual({
        starkKey: StarkKey.fake('5'),
        collateralBalance: 555n,
        assets: [
          { assetId: AssetId('BTC-10'), balance: 5n, fundingIndex: 1n },
          { assetId: AssetId('ETH-9'), balance: 55n, fundingIndex: -1n },
        ],
      })
    })

    it('can update a multiple positions with assets', async () => {
      const storage = new InMemoryMerkleStorage<PositionLeaf>()
      let rollup = await RollupState.empty(storage, 3n)
      const newPositions = await rollup.calculateUpdatedPositions({
        oldState: emptyState,
        funding: [
          {
            timestamp: Timestamp(1001),
            indices: [
              { assetId: AssetId('BTC-10'), value: 1n },
              { assetId: AssetId('ETH-9'), value: -1n },
            ],
          },
          {
            timestamp: Timestamp(1002),
            indices: [
              { assetId: AssetId('BTC-10'), value: 2n },
              { assetId: AssetId('ETH-9'), value: -2n },
            ],
          },
        ],
        positions: [
          {
            positionId: 5n,
            collateralBalance: 555n,
            fundingTimestamp: Timestamp(1001),
            starkKey: StarkKey.fake('5'),
            balances: [
              { assetId: AssetId('BTC-10'), balance: 5n },
              { assetId: AssetId('ETH-9'), balance: 55n },
            ],
          },
          {
            positionId: 6n,
            collateralBalance: 666n,
            fundingTimestamp: Timestamp(1002),
            starkKey: StarkKey.fake('6'),
            balances: [
              { assetId: AssetId('BTC-10'), balance: 6n },
              { assetId: AssetId('ETH-9'), balance: 66n },
            ],
          },
          {
            positionId: 7n,
            collateralBalance: 777n,
            fundingTimestamp: Timestamp(1002),
            starkKey: StarkKey.fake('7'),
            balances: [
              { assetId: AssetId('BTC-10'), balance: 7n },
              { assetId: AssetId('ETH-9'), balance: 77n },
            ],
          },
        ],
      })
      rollup = await rollup.update(newPositions)

      const [five, six, seven] = await rollup.positionTree.getLeaves([
        5n,
        6n,
        7n,
      ])
      expect(five?.getData()).toEqual({
        starkKey: StarkKey.fake('5'),
        collateralBalance: 555n,
        assets: [
          { assetId: AssetId('BTC-10'), balance: 5n, fundingIndex: 1n },
          { assetId: AssetId('ETH-9'), balance: 55n, fundingIndex: -1n },
        ],
      })
      expect(six?.getData()).toEqual({
        starkKey: StarkKey.fake('6'),
        collateralBalance: 666n,
        assets: [
          { assetId: AssetId('BTC-10'), balance: 6n, fundingIndex: 2n },
          { assetId: AssetId('ETH-9'), balance: 66n, fundingIndex: -2n },
        ],
      })
      expect(seven?.getData()).toEqual({
        starkKey: StarkKey.fake('7'),
        collateralBalance: 777n,
        assets: [
          { assetId: AssetId('BTC-10'), balance: 7n, fundingIndex: 2n },
          { assetId: AssetId('ETH-9'), balance: 77n, fundingIndex: -2n },
        ],
      })
    })

    it('reads funding data from ProgramOutput.oldState', async () => {
      const storage = new InMemoryMerkleStorage<PositionLeaf>()
      let rollup = await RollupState.empty(storage, 3n)

      const newPositions = await rollup.calculateUpdatedPositions({
        oldState: {
          ...emptyState,
          timestamp: Timestamp(1002),
          indices: [
            { assetId: AssetId('BTC-10'), value: 2n },
            { assetId: AssetId('ETH-9'), value: -2n },
          ],
        },
        funding: [],
        positions: [
          {
            positionId: 5n,
            collateralBalance: 555n,
            fundingTimestamp: Timestamp(1002),
            starkKey: StarkKey.fake('5'),
            balances: [
              { assetId: AssetId('BTC-10'), balance: 5n },
              { assetId: AssetId('ETH-9'), balance: 55n },
            ],
          },
        ],
      })
      rollup = await rollup.update(newPositions)

      const position = await rollup.positionTree.getLeaf(5n)
      expect(position.getData()).toEqual({
        starkKey: StarkKey.fake('5'),
        collateralBalance: 555n,
        assets: [
          { assetId: AssetId('BTC-10'), balance: 5n, fundingIndex: 2n },
          { assetId: AssetId('ETH-9'), balance: 55n, fundingIndex: -2n },
        ],
      })
    })

    it('correctly handles asset updates', async () => {
      const storage = new InMemoryMerkleStorage<PositionLeaf>()
      let rollup = await RollupState.empty(storage, 3n)

      let newPositions = await rollup.calculateUpdatedPositions({
        oldState: emptyState,
        funding: [
          {
            timestamp: Timestamp(1001),
            indices: [
              { assetId: AssetId('BTC-10'), value: 1n },
              { assetId: AssetId('ETH-9'), value: -1n },
              { assetId: AssetId('UNI-9'), value: 11n },
              { assetId: AssetId('MKR-9'), value: -11n },
            ],
          },
        ],
        positions: [
          {
            positionId: 5n,
            collateralBalance: 555n,
            fundingTimestamp: Timestamp(1001),
            starkKey: StarkKey.fake('5'),
            balances: [
              { assetId: AssetId('BTC-10'), balance: 5n },
              { assetId: AssetId('ETH-9'), balance: 55n },
              { assetId: AssetId('UNI-9'), balance: 555n },
            ],
          },
        ],
      })
      rollup = await rollup.update(newPositions)
      newPositions = await rollup.calculateUpdatedPositions({
        oldState: emptyState,
        funding: [
          {
            timestamp: Timestamp(1002),
            indices: [
              { assetId: AssetId('BTC-10'), value: 2n },
              { assetId: AssetId('ETH-9'), value: -2n },
              { assetId: AssetId('UNI-9'), value: 22n },
              { assetId: AssetId('MKR-9'), value: -22n },
            ],
          },
        ],
        positions: [
          {
            positionId: 5n,
            collateralBalance: 555n,
            fundingTimestamp: Timestamp(1002),
            starkKey: StarkKey.fake('5'),
            balances: [
              { assetId: AssetId('ETH-9'), balance: 0n },
              { assetId: AssetId('UNI-9'), balance: 20n },
              { assetId: AssetId('MKR-9'), balance: 30n },
            ],
          },
        ],
      })
      rollup = await rollup.update(newPositions)

      const updated = await rollup.positionTree.getLeaf(5n)
      expect(updated.getData()).toEqual({
        starkKey: StarkKey.fake('5'),
        collateralBalance: 555n,
        assets: [
          { assetId: AssetId('BTC-10'), balance: 5n, fundingIndex: 2n },
          { assetId: AssetId('UNI-9'), balance: 20n, fundingIndex: 22n },
          { assetId: AssetId('MKR-9'), balance: 30n, fundingIndex: -22n },
        ],
      })
    })

    it('fails for missing funding', async () => {
      const storage = new InMemoryMerkleStorage<PositionLeaf>()
      const rollup = await RollupState.empty(storage, 3n)

      await expect(
        rollup.calculateUpdatedPositions({
          oldState: emptyState,
          funding: [],
          positions: [
            {
              positionId: 5n,
              collateralBalance: 555n,
              fundingTimestamp: Timestamp.fromSeconds(1001),
              starkKey: StarkKey.fake('5'),
              balances: [{ assetId: AssetId('BTC-10'), balance: 5n }],
            },
          ],
        })
      ).toBeRejected(Error, 'Missing funding for timestamp: 1001000!')

      await expect(
        rollup.calculateUpdatedPositions({
          oldState: emptyState,
          funding: [
            {
              timestamp: Timestamp.fromSeconds(1001),
              indices: [],
            },
          ],
          positions: [
            {
              positionId: 5n,
              collateralBalance: 555n,
              fundingTimestamp: Timestamp.fromSeconds(1001),
              starkKey: StarkKey.fake('5'),
              balances: [{ assetId: AssetId('BTC-10'), balance: 5n }],
            },
          ],
        })
      ).toBeRejected(Error, 'Missing funding for asset: BTC-10!')
    })
  })

  describe(RollupState.recover.name, () => {
    it('recovers positions and indices', async () => {
      const storage = new InMemoryMerkleStorage<PositionLeaf>()
      let rollup = await RollupState.empty(storage, 3n)
      const newPositions = await rollup.calculateUpdatedPositions({
        oldState: emptyState,
        funding: [
          {
            timestamp: Timestamp(1001),
            indices: [
              { assetId: AssetId('BTC-10'), value: 1n },
              { assetId: AssetId('ETH-9'), value: -1n },
            ],
          },
        ],
        positions: [
          {
            positionId: 5n,
            collateralBalance: 555n,
            fundingTimestamp: Timestamp(1001),
            starkKey: StarkKey.fake('5'),
            balances: [
              { assetId: AssetId('BTC-10'), balance: 5n },
              { assetId: AssetId('ETH-9'), balance: 55n },
            ],
          },
        ],
      })
      rollup = await rollup.update(newPositions)

      const recovered = RollupState.recover(
        storage,
        await rollup.positionTree.hash(),
        3n
      )

      const position = await recovered.positionTree.getLeaf(5n)
      expect(position.getData()).toEqual({
        starkKey: StarkKey.fake('5'),
        collateralBalance: 555n,
        assets: [
          { assetId: AssetId('BTC-10'), balance: 5n, fundingIndex: 1n },
          { assetId: AssetId('ETH-9'), balance: 55n, fundingIndex: -1n },
        ],
      })
    })
  })
})
