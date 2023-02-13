import * as z from 'zod'

const UnsignedIntAsString = z.string().regex(/^([1-9]\d*|0)$/)
const SignedIntAsString = z.string().regex(/^(-?[1-9]\d*|0)$/)
const PedersenHash = z.string().regex(/^0[a-f\d]{63}$/)
const PedersenHash0x = z.string().regex(/^0x[a-f\d]{0,63}$/)
const AssetHash0x = z.string().regex(/^0x[a-f\d]{0,63}$/)
const AssetId = z.string().regex(/^0x[a-f\d]{30}$/)

// https://github.com/starkware-libs/starkex-data-availability-committee/blob/7d72f8e05d6d9ccda5b99444f313a7248ca479b5/src/services/perpetual/public/business_logic/state_objects.py
export type PerpetualBatchResponse = z.infer<typeof PerpetualBatchResponse>
export const PerpetualBatchResponse = z.strictObject({
  update: z.union([
    z.null(),
    z.strictObject({
      prev_batch_id: z.number(),
      position_root: PedersenHash,
      order_root: PedersenHash,
      positions: z.record(
        // position_id
        UnsignedIntAsString,
        z.strictObject({
          public_key: PedersenHash0x,
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
    }),
  ]),
})

// https://github.com/starkware-libs/starkex-data-availability-committee/blob/7d72f8e05d6d9ccda5b99444f313a7248ca479b5/src/starkware/starkware_utils/objects/starkex_state.py
export type SpotBatchResponse = z.infer<typeof SpotBatchResponse>
export const SpotBatchResponse = z.strictObject({
  update: z.union([
    z.null(),
    z.strictObject({
      prev_batch_id: z.number(),
      order_root: PedersenHash,
      vault_root: PedersenHash,
      vaults: z.record(
        // vault_id
        UnsignedIntAsString,
        z.strictObject({
          token: AssetHash0x,
          balance: UnsignedIntAsString,
          stark_key: PedersenHash0x,
        })
      ),
      orders: z.record(
        // order_id
        UnsignedIntAsString,
        z.strictObject({
          fulfilled_amount: UnsignedIntAsString,
        })
      ),
    }),
  ]),
})
