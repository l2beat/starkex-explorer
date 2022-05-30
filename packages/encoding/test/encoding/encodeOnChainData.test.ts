import {
  AssetId,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earljs'

import { decodeOnChainData, encodeOnChainData, OnChainData } from '../../src'
import { ByteReader } from '../../src/decoding/ByteReader'
import { readAssetConfigHashes } from '../../src/decoding/readAssetConfigHashes'
import { readConditions } from '../../src/decoding/readConditions'
import { readForcedActions } from '../../src/decoding/readForcedActions'
import { readFundingEntries } from '../../src/decoding/readFundingEntries'
import { readFundingIndices } from '../../src/decoding/readFundingIndices'
import { readModifications } from '../../src/decoding/readModifications'
import { readOraclePrices } from '../../src/decoding/readOraclePrices'
import { readPositionUpdate } from '../../src/decoding/readPositionUpdate'
import { readState } from '../../src/decoding/readState'
import { ByteWriter } from '../../src/encoding/ByteWriter'
import { encodeForcedActions } from '../../src/encoding/encodeForcedActions'
import { writeAssetConfigHashes } from '../../src/encoding/writeAssetConfigHashes'
import { writeConditions } from '../../src/encoding/writeConditions'
import { writeFundingEntries } from '../../src/encoding/writeFundingEntries'
import { writeFundingIndices } from '../../src/encoding/writeFundingIndices'
import { writeModifications } from '../../src/encoding/writeModifications'
import { writeOraclePrices } from '../../src/encoding/writeOraclePrices'
import { writePositionUpdate } from '../../src/encoding/writePositionUpdate'
import { writeState } from '../../src/encoding/writeState'

describe(encodeOnChainData.name, () => {
  const data: OnChainData = {
    configurationHash: Hash256.fake(),
    assetConfigHashes: [
      { assetId: AssetId('ABC-3'), hash: PedersenHash.fake() },
      { assetId: AssetId('DEF-6'), hash: PedersenHash.fake() },
      { assetId: AssetId('GHI-9'), hash: PedersenHash.fake() },
    ],
    oldState: {
      positionRoot: PedersenHash.fake(),
      positionHeight: 64,
      orderRoot: PedersenHash.fake(),
      orderHeight: 64,
      indices: [
        { assetId: AssetId('ABC-3'), value: 123n },
        { assetId: AssetId('DEF-6'), value: -456n },
        { assetId: AssetId('GHI-9'), value: 789n },
      ],
      timestamp: Timestamp.fromSeconds(69_420n),
      oraclePrices: [
        { assetId: AssetId('ABC-3'), price: 10_000n },
        { assetId: AssetId('DEF-6'), price: 200_000n },
        { assetId: AssetId('GHI-9'), price: 3_000_000n },
      ],
      systemTime: Timestamp.fromSeconds(1337n),
    },
    newState: {
      positionRoot: PedersenHash.fake(),
      positionHeight: 64,
      orderRoot: PedersenHash.fake(),
      orderHeight: 64,
      indices: [
        { assetId: AssetId('ABC-3'), value: 1234n },
        { assetId: AssetId('DEF-6'), value: -4567n },
        { assetId: AssetId('GHI-9'), value: 7890n },
      ],
      timestamp: Timestamp.fromSeconds(69_421n),
      oraclePrices: [
        { assetId: AssetId('ABC-3'), price: 20_000n },
        { assetId: AssetId('DEF-6'), price: 300_000n },
        { assetId: AssetId('GHI-9'), price: 4_000_000n },
      ],
      systemTime: Timestamp.fromSeconds(1338n),
    },
    minimumExpirationTimestamp: 123456n,
    modifications: [
      { positionId: 1n, publicKey: StarkKey.fake(), difference: 2n },
      { positionId: 2n, publicKey: StarkKey.fake(), difference: -3n },
    ],
    forcedActions: [
      {
        type: 'withdrawal',
        positionId: 100n,
        publicKey: StarkKey.fake(),
        amount: 50_000n,
      },
      {
        type: 'trade',
        positionIdA: 100n,
        positionIdB: 200n,
        publicKeyA: StarkKey.fake(),
        publicKeyB: StarkKey.fake(),
        collateralAmount: 20_000n,
        syntheticAmount: 10_000n,
        isABuyingSynthetic: true,
        nonce: 1234n,
        syntheticAssetId: AssetId('ABC-3'),
      },
    ],
    conditions: [PedersenHash.fake(), PedersenHash.fake()],
    funding: [
      {
        indices: [
          { assetId: AssetId('ABC-3'), value: 1234n },
          { assetId: AssetId('DEF-6'), value: -4567n },
        ],
        timestamp: Timestamp.fromSeconds(123456n),
      },
      {
        indices: [
          { assetId: AssetId('ABC-3'), value: 12345n },
          { assetId: AssetId('DEF-6'), value: -45678n },
          { assetId: AssetId('GHI-9'), value: 78901n },
        ],
        timestamp: Timestamp.fromSeconds(234567n),
      },
    ],
    positions: [
      {
        positionId: 1n,
        publicKey: StarkKey.fake(),
        collateralBalance: 50_000n,
        balances: [
          { assetId: AssetId('ABC-3'), balance: 1234n },
          { assetId: AssetId('DEF-6'), balance: -4567n },
        ],
        fundingTimestamp: Timestamp.fromSeconds(123456n),
      },
      {
        positionId: 2n,
        publicKey: StarkKey.fake(),
        collateralBalance: -50_000n,
        balances: [
          { assetId: AssetId('ABC-3'), balance: -1234n },
          { assetId: AssetId('DEF-6'), balance: 4567n },
        ],
        fundingTimestamp: Timestamp.fromSeconds(234567n),
      },
    ],
  }

  it(`is compatible with ${decodeOnChainData.name}`, () => {
    const encoded = encodeOnChainData(data)
    const decoded = decodeOnChainData(encoded)
    expect(decoded).toEqual(data)
  })

  describe(writeAssetConfigHashes.name, () => {
    it('encodes no hashes', () => {
      const writer = new ByteWriter()
      writeAssetConfigHashes(writer, [])
      const encoded = writer.getBytes()
      const reader = new ByteReader(encoded)
      const decoded = readAssetConfigHashes(reader)
      expect(decoded).toEqual([])
    })

    it('encodes some hashes', () => {
      const writer = new ByteWriter()
      writeAssetConfigHashes(writer, data.assetConfigHashes)
      const encoded = writer.getBytes()
      const reader = new ByteReader(encoded)
      const decoded = readAssetConfigHashes(reader)
      expect(decoded).toEqual(data.assetConfigHashes)
    })
  })

  describe(writeState.name, () => {
    it(`is compatible with ${readState.name}`, () => {
      const writer = new ByteWriter()
      writeState(writer, data.oldState)
      const encoded = writer.getBytes()
      const reader = new ByteReader(encoded)
      const decoded = readState(reader)
      expect(decoded).toEqual(data.oldState)
    })
  })

  describe(writeFundingIndices.name, () => {
    it(`is compatible with ${readFundingIndices.name}`, () => {
      const writer = new ByteWriter()
      writeFundingIndices(writer, data.oldState.indices)
      const encoded = writer.getBytes()
      const reader = new ByteReader(encoded)
      const decoded = readFundingIndices(reader)
      expect(decoded).toEqual(data.oldState.indices)
    })
  })

  describe(writeOraclePrices.name, () => {
    it(`is compatible with ${readOraclePrices.name}`, () => {
      const writer = new ByteWriter()
      writeOraclePrices(writer, data.oldState.oraclePrices)
      const encoded = writer.getBytes()
      const reader = new ByteReader(encoded)
      const decoded = readOraclePrices(reader)
      expect(decoded).toEqual(data.oldState.oraclePrices)
    })
  })

  describe(writeModifications.name, () => {
    it(`is compatible with ${readModifications.name}`, () => {
      const writer = new ByteWriter()
      writeModifications(writer, data.modifications)
      const encoded = writer.getBytes()
      const reader = new ByteReader(encoded)
      const decoded = readModifications(reader)
      expect(decoded).toEqual(data.modifications)
    })
  })

  describe(encodeForcedActions.name, () => {
    it(`is compatible with ${readForcedActions.name}`, () => {
      const encoded = encodeForcedActions(data.forcedActions)
      const reader = new ByteReader(encoded)
      const decoded = readForcedActions(reader)
      expect(decoded).toEqual(data.forcedActions)
    })
  })

  describe(writeConditions.name, () => {
    it(`is compatible with ${readConditions.name}`, () => {
      const writer = new ByteWriter()
      writeConditions(writer, data.conditions)
      const encoded = writer.getBytes()
      const reader = new ByteReader(encoded)
      const decoded = readConditions(reader)
      expect(decoded).toEqual(data.conditions)
    })
  })

  describe(writeFundingEntries.name, () => {
    it(`is compatible with ${readFundingEntries.name}`, () => {
      const writer = new ByteWriter()
      writeFundingEntries(writer, data.funding)
      const encoded = writer.getBytes()
      const reader = new ByteReader(encoded)
      const decoded = readFundingEntries(reader)
      expect(decoded).toEqual(data.funding)
    })
  })

  describe(writePositionUpdate.name, () => {
    it(`is compatible with ${readPositionUpdate.name}`, () => {
      const writer = new ByteWriter()
      writePositionUpdate(writer, data.positions[0])
      const encoded = writer.getBytes()
      const reader = new ByteReader(encoded)
      const decoded = readPositionUpdate(reader)
      expect(decoded).toEqual(data.positions[0])
    })
  })
})
