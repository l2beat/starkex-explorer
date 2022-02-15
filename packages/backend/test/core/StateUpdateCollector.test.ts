import { PedersenHash } from '@explorer/crypto'
import { AssetId, OnChainData } from '@explorer/encoding'
import { Position } from '@explorer/state'
import { expect } from 'earljs'
import type { providers } from 'ethers'
import { MessagePort } from 'worker_threads'

import {
  ROLLUP_STATE_EMPTY_HASH,
  StateUpdateCollector,
} from '../../src/core/StateUpdateCollector'
import { Hash256 } from '../../src/model'
import type { PageRepository } from '../../src/peripherals/database/PageRepository'
import type { RollupStateRepository } from '../../src/peripherals/database/RollupStateRepository'
import type { StateTransitionFactRecord } from '../../src/peripherals/database/StateTransitionFactsRepository'
import type {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../src/peripherals/database/StateUpdateRepository'
import type { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { mock } from '../mock'

describe(StateUpdateCollector.name, () => {
  describe(StateUpdateCollector.prototype.save.name, () => {
    it('saves updates', async () => {
      const pageRepository = mock<PageRepository>({
        getAllForFacts: async (_factHashes) => [
          {
            factHash: Hash256.fake('f1'),
            pages: [''],
          },
        ],
      })
      const stateUpdateRepository = mock<StateUpdateRepository>({
        getLast: async () =>
          ({
            rootHash: ROLLUP_STATE_EMPTY_HASH,
            id: 123456,
          } as StateUpdateRecord),
        add: async () => {},
      })
      const ethereumClient = mock<EthereumClient>({
        getBlock: async () => ({ timestamp: 10 } as providers.Block),
      })

      const position = new Position(
        'deadbeef',
        123n,
        [{ assetId: AssetId('ETH-9'), balance: 456n, fundingIndex: 789n }],
        PedersenHash.fake('abc')
      )

      const rollupStateRepository = mock<RollupStateRepository>({
        recover: async () => {
          return position
        },
        getParameters: async (_rootHash) => {
          return {
            funding: new Map([[AssetId('ETH-9'), 123n]]),
            timestamp: 123n,
          }
        },
        persist: async (_nodes) => {},
        setParameters: async (_rootHash, _parameters) => {},
      })
      const decodeOnChainData = (_pages: string[]): OnChainData => {
        return {
          oldState: {} as any,
          newState: {} as any,
          assetDataHashes: [],
          configurationHash: '',
          funding: [
            {
              indices: [{ assetId: AssetId('ETH-9'), value: 123n }],
              timestamp: 20n,
            },
          ],
          positions: [
            {
              positionId: 5n,
              collateralBalance: 555n,
              fundingTimestamp: 0n,
              publicKey: `0x${'0'.repeat(63)}5`,
              balances: [],
            },
          ],
        }
      }

      const stateUpdateCollector = new StateUpdateCollector(
        pageRepository,
        stateUpdateRepository,
        rollupStateRepository,
        ethereumClient,
        decodeOnChainData
      )

      const stateTransitionFacts: StateTransitionFactRecord[] = [
        { blockNumber: 1, hash: Hash256.fake() },
        { blockNumber: 2, hash: Hash256.fake() },
      ]

      await stateUpdateCollector.save(stateTransitionFacts)

      expect(pageRepository.getAllForFacts).toHaveBeenCalledExactlyWith([
        [stateTransitionFacts.map((f) => f.hash)],
      ])
      expect(stateUpdateRepository.add).toHaveBeenCalledExactlyWith([
        [
          {
            positions: [
              {
                balances: [
                  expect.objectWith({
                    assetId: AssetId('ETH-9'),
                    balance: 456n,
                  }),
                ],
                collateralBalance: 555n,
                positionId: 5n,
                publicKey: `0x${'0'.repeat(63)}5`,
              },
            ],
            prices: expect.anything(),
            stateUpdate: {
              blockNumber: 1,
              factHash: Hash256.fake('f1'),
              id: 123457,
              rootHash: PedersenHash(
                '00240a8b9442c2735edc68f5bdcc896d1f99788512b4a7832600f09db39a3cdb'
              ),
              timestamp: 10,
            },
          },
        ],
      ])
    })
  })

  describe(StateUpdateCollector.prototype.discardAfter.name, () => {
    it('deletes updates after block number', async () => {
      const stateUpdateRepository = mock<StateUpdateRepository>({
        deleteAllAfter: async () => {},
      })

      const stateUpdateCollector = new StateUpdateCollector(
        mock<PageRepository>(),
        stateUpdateRepository,
        mock<RollupStateRepository>(),
        mock<EthereumClient>()
      )

      await stateUpdateCollector.discardAfter(20)
      await stateUpdateCollector.discardAfter(40)

      expect(stateUpdateRepository.deleteAllAfter).toHaveBeenCalledExactlyWith([
        [20],
        [40],
      ])
    })
  })
})
