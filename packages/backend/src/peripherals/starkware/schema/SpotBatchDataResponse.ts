import { z } from 'zod'

import {
  AssetHash0x,
  PedersenHash,
  StarkKey0x,
  UnsignedIntAsString,
} from './regexes'

// https://github.com/starkware-libs/starkex-data-availability-committee/blob/7d72f8e05d6d9ccda5b99444f313a7248ca479b5/src/starkware/starkware_utils/objects/starkex_state.py
export type SpotBatchDataResponse = z.infer<typeof SpotBatchDataResponse>
export const SpotBatchDataResponse = z.strictObject({
  update: z
    .strictObject({
      prev_batch_id: z.number(),
      order_root: PedersenHash,
      vault_root: PedersenHash,
      vaults: z.record(
        // vault_id
        UnsignedIntAsString,
        z.strictObject({
          token: AssetHash0x,
          balance: UnsignedIntAsString,
          stark_key: StarkKey0x,
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
