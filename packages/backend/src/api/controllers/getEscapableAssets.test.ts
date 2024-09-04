import { CollateralAsset } from '@explorer/shared'
import {
  AssetHash,
  AssetId,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'

import {
  SentTransactionRecord,
  SentTransactionRepository,
} from '../../peripherals/database/transactions/SentTransactionRepository'
import {
  UserTransactionRecord,
  UserTransactionRepository,
} from '../../peripherals/database/transactions/UserTransactionRepository'
import { VaultRepository } from '../../peripherals/database/VaultRepository'
import { getPerpetualEscapables, getSpotEscapables } from './getEscapableAssets'

const fakeCollateralAsset: CollateralAsset = {
  assetId: AssetId('USDC-6'),
  assetHash: AssetHash(
    '0x02893294412a4c8f915f75892b395ebbf6859ec246ec365c3b1f56f47c3a0a5d'
  ),
  price: 1_000_000n,
}

const fakeStarkKey = StarkKey.fake('a1a1a1')

const fakeVerifyEscape: UserTransactionRecord<'VerifyEscape'> = {
  id: 123,
  blockNumber: 456000,
  starkKeyA: fakeStarkKey,
  starkKeyB: undefined,
  timestamp: Timestamp(123000),
  transactionHash: Hash256.fake('beaf'),
  vaultOrPositionIdA: 1234n,
  vaultOrPositionIdB: undefined,
  included: undefined,
  data: {
    type: 'VerifyEscape',
    positionId: 1234n,
    withdrawalAmount: 5000n,
    starkKey: fakeStarkKey,
    sharedStateHash: Hash256.fake('aaaa'),
  },
}

const fakeFinalizeEscape: UserTransactionRecord<'FinalizeEscape'> = {
  id: 567,
  blockNumber: 899000,
  starkKeyA: fakeStarkKey,
  starkKeyB: undefined,
  timestamp: Timestamp(456000),
  transactionHash: Hash256.fake('beaf'),
  vaultOrPositionIdA: fakeVerifyEscape.vaultOrPositionIdA,
  vaultOrPositionIdB: undefined,
  included: undefined,
  data: {
    type: 'FinalizeEscape',
    starkKey: fakeStarkKey,
    assetType: fakeCollateralAsset.assetHash,
    quantizedAmount: 5000n,
    nonQuantizedAmount: 5000000000n,
  },
}

const fakeSentVerifyEscape: SentTransactionRecord<'VerifyEscape'> = {
  mined: {
    blockNumber: 456000,
    timestamp: Timestamp(123000),
    reverted: false,
  },
  starkKey: fakeStarkKey,
  sentTimestamp: Timestamp(122000),
  transactionHash: Hash256.fake('beaf'),
  vaultOrPositionId: 1234n,
  data: {
    type: 'VerifyEscape',
    positionOrVaultId: 1234n,
    starkKey: fakeStarkKey,
  },
}

const fakeSentSpotFinalizeEscape: SentTransactionRecord<'FinalizeSpotEscape'> =
  {
    mined: {
      blockNumber: 899000,
      timestamp: Timestamp(463000),
      reverted: false,
    },
    starkKey: fakeStarkKey,
    sentTimestamp: Timestamp(455000),
    transactionHash: Hash256.fake('beaf'),
    vaultOrPositionId: 1234n,
    data: {
      type: 'FinalizeSpotEscape',
      starkKey: fakeStarkKey,
      vaultId: 1234n,
      quantizedAmount: 5000n,
      assetHash: fakeCollateralAsset.assetHash,
    },
  }
describe('getEscapableAssets', () => {
  describe(getPerpetualEscapables.name, () => {
    it('returns empty result when there are no verified escapes', async () => {
      const userTransactionRepository = mockObject<UserTransactionRepository>({
        getByStarkKey: mockFn().resolvesTo([]),
      })
      const result = await getPerpetualEscapables(
        userTransactionRepository,
        StarkKey.fake(),
        fakeCollateralAsset
      )
      expect(result).toEqual({})
    })

    it('returns result with positive amount when not finalized', async () => {
      const userTransactionRepository = mockObject<UserTransactionRepository>({
        getByStarkKey: mockFn()
          .given(fakeStarkKey, ['VerifyEscape'])
          .resolvesToOnce([fakeVerifyEscape])
          .given(fakeStarkKey, ['FinalizeEscape'])
          .resolvesToOnce([]),
      })
      const result = await getPerpetualEscapables(
        userTransactionRepository,
        fakeVerifyEscape.starkKeyA,
        fakeCollateralAsset
      )
      expect(result).toEqual({
        [fakeVerifyEscape.data.positionId.toString()]: {
          assetHash: fakeCollateralAsset.assetHash,
          amount: fakeVerifyEscape.data.withdrawalAmount,
        },
      })
    })

    it('returns result with 0 amount when finalized', async () => {
      const userTransactionRepository = mockObject<UserTransactionRepository>({
        getByStarkKey: mockFn()
          .given(fakeStarkKey, ['VerifyEscape'])
          .resolvesToOnce([fakeVerifyEscape])
          .given(fakeStarkKey, ['FinalizeEscape'])
          .resolvesToOnce([fakeFinalizeEscape]),
      })
      const result = await getPerpetualEscapables(
        userTransactionRepository,
        fakeVerifyEscape.starkKeyA,
        fakeCollateralAsset
      )
      expect(result).toEqual({
        [fakeVerifyEscape.data.positionId.toString()]: {
          assetHash: fakeCollateralAsset.assetHash,
          amount: 0n,
        },
      })
    })
  })

  describe(getSpotEscapables.name, () => {
    it('returns empty result when there are no verified escapes', async () => {
      const sentTransactionRepository = mockObject<SentTransactionRepository>({
        getByStarkKey: mockFn().resolvesTo([]),
      })
      const result = await getSpotEscapables(
        sentTransactionRepository,
        mockObject<VaultRepository>(),
        fakeStarkKey
      )
      expect(result).toEqual({})
    })

    it('returns empty result when sent tx not mined', async () => {
      const sentTransactionRepository = mockObject<SentTransactionRepository>({
        getByStarkKey: mockFn()
          .given(fakeStarkKey, ['VerifyEscape'])
          .resolvesToOnce([
            {
              ...fakeSentVerifyEscape,
              mined: undefined,
            },
          ])
          .given(fakeStarkKey, ['FinalizeSpotEscape'])
          .resolvesToOnce([]),
      })

      const result = await getSpotEscapables(
        sentTransactionRepository,
        mockObject<VaultRepository>(),
        fakeStarkKey
      )
      expect(result).toEqual({})
    })

    it('returns empty result when sent tx reverted', async () => {
      const sentTransactionRepository = mockObject<SentTransactionRepository>({
        getByStarkKey: mockFn()
          .given(fakeStarkKey, ['VerifyEscape'])
          .resolvesToOnce([
            {
              ...fakeSentVerifyEscape,
              mined: {
                ...fakeSentVerifyEscape.mined,
                reverted: true,
              },
            },
          ])
          .given(fakeStarkKey, ['FinalizeSpotEscape'])
          .resolvesToOnce([]),
      })

      const result = await getSpotEscapables(
        sentTransactionRepository,
        mockObject<VaultRepository>(),
        fakeStarkKey
      )
      expect(result).toEqual({})
    })

    it('returns result with positive amount when mined but not finalized', async () => {
      const sentTransactionRepository = mockObject<SentTransactionRepository>({
        getByStarkKey: mockFn()
          .given(fakeStarkKey, ['VerifyEscape'])
          .resolvesToOnce([fakeSentVerifyEscape])
          .given(fakeStarkKey, ['FinalizeSpotEscape'])
          .resolvesToOnce([]),
      })
      const vaultRepository = mockObject<VaultRepository>({
        findById: mockFn()
          .given(fakeSentVerifyEscape.vaultOrPositionId)
          .resolvesToOnce({
            vaultId: fakeVerifyEscape.vaultOrPositionIdA,
            assetHash: fakeCollateralAsset.assetHash,
            balance: 9000n,
          }),
      })

      const result = await getSpotEscapables(
        sentTransactionRepository,
        vaultRepository,
        fakeStarkKey
      )
      expect(result).toEqual({
        [fakeVerifyEscape.data.positionId.toString()]: {
          assetHash: fakeCollateralAsset.assetHash,
          amount: 9000n,
        },
      })
    })

    it('returns result with 0 amount when finalized', async () => {
      const sentTransactionRepository = mockObject<SentTransactionRepository>({
        getByStarkKey: mockFn()
          .given(fakeStarkKey, ['VerifyEscape'])
          .resolvesToOnce([fakeSentVerifyEscape])
          .given(fakeStarkKey, ['FinalizeSpotEscape'])
          .resolvesToOnce([fakeSentSpotFinalizeEscape]),
      })
      const vaultRepository = mockObject<VaultRepository>({
        findById: mockFn()
          .given(fakeSentVerifyEscape.vaultOrPositionId)
          .resolvesToOnce({
            vaultId: fakeVerifyEscape.vaultOrPositionIdA,
            assetHash: fakeCollateralAsset.assetHash,
            balance: 9000n,
          }),
      })

      const result = await getSpotEscapables(
        sentTransactionRepository,
        vaultRepository,
        fakeStarkKey
      )
      expect(result).toEqual({
        [fakeVerifyEscape.data.positionId.toString()]: {
          assetHash: fakeCollateralAsset.assetHash,
          amount: 0n,
        },
      })
    })

    it('returns result with positive amount when finalization reverted', async () => {
      const sentTransactionRepository = mockObject<SentTransactionRepository>({
        getByStarkKey: mockFn()
          .given(fakeStarkKey, ['VerifyEscape'])
          .resolvesToOnce([fakeSentVerifyEscape])
          .given(fakeStarkKey, ['FinalizeSpotEscape'])
          .resolvesToOnce([
            {
              ...fakeSentSpotFinalizeEscape,
              mined: {
                ...fakeSentSpotFinalizeEscape.mined,
                reverted: true,
              },
            },
          ]),
      })
      const vaultRepository = mockObject<VaultRepository>({
        findById: mockFn()
          .given(fakeSentVerifyEscape.vaultOrPositionId)
          .resolvesToOnce({
            vaultId: fakeVerifyEscape.vaultOrPositionIdA,
            assetHash: fakeCollateralAsset.assetHash,
            balance: 9000n,
          }),
      })

      const result = await getSpotEscapables(
        sentTransactionRepository,
        vaultRepository,
        fakeStarkKey
      )
      expect(result).toEqual({
        [fakeVerifyEscape.data.positionId.toString()]: {
          assetHash: fakeCollateralAsset.assetHash,
          amount: 9000n,
        },
      })
    })
  })
})
