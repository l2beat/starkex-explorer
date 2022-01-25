import { expect } from 'earljs'

import { InMemoryRollupStorage } from '../src/InMemoryRollupStorage'
import { RollupState } from '../src/RollupState'

describe(RollupState.name, () => {
  describe(RollupState.prototype.update.name, () => {
    it('can update a single position', async () => {
      const storage = new InMemoryRollupStorage()
      let rollup = await RollupState.empty(storage, 3n)
      rollup = await rollup.update({
        funding: [],
        positions: [
          {
            positionId: 5n,
            collateralBalance: 555n,
            fundingTimestamp: 0n,
            publicKey: `0x${'0'.repeat(63)}5`,
            balances: [],
          },
        ],
      })

      const updated = await rollup.positions.getLeaf(5n)
      expect(updated.getData()).toEqual({
        publicKey: `0x${'0'.repeat(63)}5`,
        collateralBalance: 555n,
        assets: [],
      })
    })

    it('can update a single position with assets', async () => {
      const storage = new InMemoryRollupStorage()
      let rollup = await RollupState.empty(storage, 3n)
      rollup = await rollup.update({
        funding: [
          {
            timestamp: 1001n,
            indices: [
              { assetId: 'BTC-10', value: 1n },
              { assetId: 'ETH-9', value: -1n },
            ],
          },
        ],
        positions: [
          {
            positionId: 5n,
            collateralBalance: 555n,
            fundingTimestamp: 1001n,
            publicKey: `0x${'0'.repeat(63)}5`,
            balances: [
              { assetId: 'BTC-10', balance: 5n },
              { assetId: 'ETH-9', balance: 55n },
            ],
          },
        ],
      })

      const updated = await rollup.positions.getLeaf(5n)
      expect(updated.getData()).toEqual({
        publicKey: `0x${'0'.repeat(63)}5`,
        collateralBalance: 555n,
        assets: [
          { assetId: 'BTC-10', balance: 5n, fundingIndex: 1n },
          { assetId: 'ETH-9', balance: 55n, fundingIndex: -1n },
        ],
      })
    })

    it('can update a multiple positions with assets', async () => {
      const storage = new InMemoryRollupStorage()
      let rollup = await RollupState.empty(storage, 3n)
      rollup = await rollup.update({
        funding: [
          {
            timestamp: 1001n,
            indices: [
              { assetId: 'BTC-10', value: 1n },
              { assetId: 'ETH-9', value: -1n },
            ],
          },
          {
            timestamp: 1002n,
            indices: [
              { assetId: 'BTC-10', value: 2n },
              { assetId: 'ETH-9', value: -2n },
            ],
          },
        ],
        positions: [
          {
            positionId: 5n,
            collateralBalance: 555n,
            fundingTimestamp: 1001n,
            publicKey: `0x${'0'.repeat(63)}5`,
            balances: [
              { assetId: 'BTC-10', balance: 5n },
              { assetId: 'ETH-9', balance: 55n },
            ],
          },
          {
            positionId: 6n,
            collateralBalance: 666n,
            fundingTimestamp: 1002n,
            publicKey: `0x${'0'.repeat(63)}6`,
            balances: [
              { assetId: 'BTC-10', balance: 6n },
              { assetId: 'ETH-9', balance: 66n },
            ],
          },
          {
            positionId: 7n,
            collateralBalance: 777n,
            fundingTimestamp: 1002n,
            publicKey: `0x${'0'.repeat(63)}7`,
            balances: [
              { assetId: 'BTC-10', balance: 7n },
              { assetId: 'ETH-9', balance: 77n },
            ],
          },
        ],
      })

      const [five, six, seven] = await rollup.positions.getLeaves([5n, 6n, 7n])
      expect(five.getData()).toEqual({
        publicKey: `0x${'0'.repeat(63)}5`,
        collateralBalance: 555n,
        assets: [
          { assetId: 'BTC-10', balance: 5n, fundingIndex: 1n },
          { assetId: 'ETH-9', balance: 55n, fundingIndex: -1n },
        ],
      })
      expect(six.getData()).toEqual({
        publicKey: `0x${'0'.repeat(63)}6`,
        collateralBalance: 666n,
        assets: [
          { assetId: 'BTC-10', balance: 6n, fundingIndex: 2n },
          { assetId: 'ETH-9', balance: 66n, fundingIndex: -2n },
        ],
      })
      expect(seven.getData()).toEqual({
        publicKey: `0x${'0'.repeat(63)}7`,
        collateralBalance: 777n,
        assets: [
          { assetId: 'BTC-10', balance: 7n, fundingIndex: 2n },
          { assetId: 'ETH-9', balance: 77n, fundingIndex: -2n },
        ],
      })
    })

    it('can persist last known funding', async () => {
      const storage = new InMemoryRollupStorage()
      let rollup = await RollupState.empty(storage, 3n)

      rollup = await rollup.update({
        funding: [
          {
            timestamp: 1001n,
            indices: [
              { assetId: 'BTC-10', value: 1n },
              { assetId: 'ETH-9', value: -1n },
            ],
          },
          {
            timestamp: 1002n,
            indices: [
              { assetId: 'BTC-10', value: 2n },
              { assetId: 'ETH-9', value: -2n },
            ],
          },
        ],
        positions: [],
      })

      const params = await storage.getParameters(await rollup.positions.hash())
      expect(params).toEqual({
        timestamp: 1002n,
        funding: new Map([
          ['BTC-10', 2n],
          ['ETH-9', -2n],
        ]),
      })

      rollup = await rollup.update({
        funding: [],
        positions: [
          {
            positionId: 5n,
            collateralBalance: 555n,
            fundingTimestamp: 1002n,
            publicKey: `0x${'0'.repeat(63)}5`,
            balances: [
              { assetId: 'BTC-10', balance: 5n },
              { assetId: 'ETH-9', balance: 55n },
            ],
          },
        ],
      })

      const position = await rollup.positions.getLeaf(5n)
      expect(position.getData()).toEqual({
        publicKey: `0x${'0'.repeat(63)}5`,
        collateralBalance: 555n,
        assets: [
          { assetId: 'BTC-10', balance: 5n, fundingIndex: 2n },
          { assetId: 'ETH-9', balance: 55n, fundingIndex: -2n },
        ],
      })
    })
  })
})
