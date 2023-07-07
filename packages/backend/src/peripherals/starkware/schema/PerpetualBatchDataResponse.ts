import { z } from 'zod'

import {
  AssetId,
  PedersenHash,
  SignedIntAsString,
  StarkKey0x,
  UnsignedIntAsString,
} from './regexes'

// https://github.com/starkware-libs/starkex-data-availability-committee/blob/7d72f8e05d6d9ccda5b99444f313a7248ca479b5/src/services/perpetual/public/business_logic/state_objects.py
export type PerpetualBatchDataResponse = z.infer<
  typeof PerpetualBatchDataResponse
>
export const PerpetualBatchDataResponse = z.strictObject({
  update: z
    .strictObject({
      prev_batch_id: z.number(),
      position_root: PedersenHash,
      order_root: PedersenHash,
      positions: z.record(
        // position_id
        UnsignedIntAsString,
        z.strictObject({
          public_key: StarkKey0x,
          collateral_balance: SignedIntAsString,
          assets: z.record(
            AssetId,
            z.strictObject({
              cached_funding_index: SignedIntAsString,
              balance: SignedIntAsString,
            })
          ),
        })
      ),
      orders: z.record(
        // order_id
        UnsignedIntAsString,
        z.strictObject({
          fulfilled_amount: UnsignedIntAsString,
        })
      ),
    })
    .nullable(),
})
