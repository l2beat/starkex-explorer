import { AssetId, PedersenHash, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { Position } from '../src'
import { InMemoryRollupStorage } from '../src/InMemoryRollupStorage'
import { RollupState } from '../src/RollupState'

describe(RollupState.name, () => {
  describe(RollupState.empty.name, () => {
    it('has a specific root hash', async () => {
      const storage = new InMemoryRollupStorage()
      const empty = await RollupState.empty(storage)
      expect(await empty.positions.hash()).toEqual(
        PedersenHash(
          '052ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
        )
      )
    })
  })

  describe(RollupState.prototype.update.name, () => {
    it('can update a single position', async () => {
      const storage = new InMemoryRollupStorage()
      let rollup = await RollupState.empty(storage, 3n)
      let newPositions: { index: bigint; value: Position }[] = []

      ;[rollup, newPositions] = await rollup.update({
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

      const updated = await rollup.positions.getLeaf(5n)
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
      const storage = new InMemoryRollupStorage()
      let rollup = await RollupState.empty(storage, 3n)
      ;[rollup] = await rollup.update({
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

      const updated = await rollup.positions.getLeaf(5n)
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
      const storage = new InMemoryRollupStorage()
      let rollup = await RollupState.empty(storage, 3n)
      ;[rollup] = await rollup.update({
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

      const [five, six, seven] = await rollup.positions.getLeaves([5n, 6n, 7n])
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

    it('can persist last known funding', async () => {
      const storage = new InMemoryRollupStorage()
      let rollup = await RollupState.empty(storage, 3n)

      ;[rollup] = await rollup.update({
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
        positions: [],
      })

      const params = await storage.getParameters(await rollup.positions.hash())
      expect(params).toEqual({
        timestamp: Timestamp(1002),
        funding: new Map([
          [AssetId('BTC-10'), 2n],
          [AssetId('ETH-9'), -2n],
        ]),
      })
      ;[rollup] = await rollup.update({
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

      const position = await rollup.positions.getLeaf(5n)
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
      const storage = new InMemoryRollupStorage()
      let rollup = await RollupState.empty(storage, 3n)

      ;[rollup] = await rollup.update({
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
      ;[rollup] = await rollup.update({
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

      const updated = await rollup.positions.getLeaf(5n)
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
      const storage = new InMemoryRollupStorage()
      const rollup = await RollupState.empty(storage, 3n)

      await expect(
        rollup.update({
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
        rollup.update({
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
      const storage = new InMemoryRollupStorage()
      let rollup = await RollupState.empty(storage, 3n)
      ;[rollup] = await rollup.update({
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

      const recovered = RollupState.recover(
        storage,
        await rollup.positions.hash(),
        3n
      )

      expect(await recovered.getParameters()).toEqual({
        timestamp: Timestamp(1001),
        funding: new Map([
          [AssetId('BTC-10'), 1n],
          [AssetId('ETH-9'), -1n],
        ]),
      })
      const position = await recovered.positions.getLeaf(5n)
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
