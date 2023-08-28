import { z } from 'zod'

import { PerpetualL2Transaction } from './PerpetualBatchInfoResponse'

const PerpetualLiveL2TransactionResponseTransactionInfo = z.object({
  tx: PerpetualL2Transaction,
  tx_id: z.number(),
  parseError: z.undefined(),
})

const PerpetualLiveL2TransactionResponseTransaction = z.object({
  apex_id: z.number(),
  tx_info: z.string().transform((payload) => {
    const result = PerpetualLiveL2TransactionResponseTransactionInfo.safeParse(
      JSON.parse(payload)
    )
    return result.success
      ? result.data
      : { parseError: { errors: result.error.errors, payload } }
  }),
  time_created: z.number(),
})

export type PerpetualLiveL2TransactionResponse = z.infer<
  typeof PerpetualLiveL2TransactionResponse
>
export const PerpetualLiveL2TransactionResponse = z.object({
  count: z.number(),
  txs: z.array(PerpetualLiveL2TransactionResponseTransaction),
})
