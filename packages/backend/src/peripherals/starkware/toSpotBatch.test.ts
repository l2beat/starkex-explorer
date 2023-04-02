import { AssetHash, PedersenHash, StarkKey } from '@explorer/types'
import { expect } from 'earl'

import { EXAMPLE_SPOT_BATCH } from '../../test/starkwareData'
import { SpotBatchResponse } from './schema'
import { toSpotBatch } from './toSpotBatch'

describe(toSpotBatch.name, () => {
  it('transforms a null update batch', () => {
    expect(toSpotBatch({ update: null })).toEqual(undefined)
  })

  it('transforms the parsed batch', () => {
    const parsed = SpotBatchResponse.parse(EXAMPLE_SPOT_BATCH)
    expect(toSpotBatch(parsed)).toEqual({
      previousBatchId: 2129,
      vaultRoot: PedersenHash(
        '01b1059a3c2810e257ae9e0fee6f798ebaec6727923bae072e4160746f37e95e'
      ),
      orderRoot: PedersenHash(
        '039b5a639f426e2a2364eaca3b03796d52da9eec76cbb80332caf38ac7d49625'
      ),
      vaults: [
        {
          balance: 1n,
          starkKey: StarkKey(
            '0x061b721a3f7b04524dc8919840b83094e080ad41de44caee78ccc36b61b07fea'
          ),
          assetHash: AssetHash(
            '0400d54c002305c535c5cc0cfb43b675ecb0776391be0b5a6231523df643f361'
          ),
          vaultId: 272051n,
        },
        {
          balance: 1n,
          starkKey: StarkKey(
            '0x061b721a3f7b04524dc8919840b83094e080ad41de44caee78ccc36b61b07fea'
          ),
          assetHash: AssetHash(
            '0400771e0ad43c760b0b49d9f9ce5b85e9f8a7745079ced44af6bdb6edc69936'
          ),
          vaultId: 272052n,
        },
        {
          balance: 1n,
          starkKey: StarkKey(
            '0x061b721a3f7b04524dc8919840b83094e080ad41de44caee78ccc36b61b07fea'
          ),
          assetHash: AssetHash(
            '04004ccd8ff8dbf262ea16708f8fe51b7169a605b15086b437aacbb07462fb7e'
          ),
          vaultId: 272053n,
        },
      ],
      orders: [
        {
          orderId:
            5528795308638913688983516265329825249594975031333247410549920057936650915n,
          amount: 1n,
        },
        {
          orderId:
            22603428961528533473192364795137722761861704087037625825006983052623508499n,
          amount: 1n,
        },
        {
          orderId:
            25009210736250622976039693600200497838256637516449072470104608642836003849n,
          amount: 1n,
        },
        {
          orderId:
            29166437620670220529360060623748355602425744826458493727527634221864173127n,
          amount: 1n,
        },
      ],
    })
  })
})
