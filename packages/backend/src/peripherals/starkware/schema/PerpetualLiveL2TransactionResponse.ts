import { z } from 'zod'

import { PerpetualL2Transaction } from './PerpetualBatchInfoResponse'

const PerpetualLiveL2TransactionResponseTransactionInfo = z.strictObject({
  tx: PerpetualL2Transaction,
  tx_id: z.number(),
})
const PerpetualLiveL2TransactionResponseTransaction = z.strictObject({
  apex_id: z.number(),
  tx_info: z
    .string()
    .transform((s) =>
      PerpetualLiveL2TransactionResponseTransactionInfo.parse(JSON.parse(s))
    ),
})

export type PerpetualLiveL2TransactionResponse = z.infer<
  typeof PerpetualLiveL2TransactionResponse
>
export const PerpetualLiveL2TransactionResponse = z.strictObject({
  count: z.number(),
  txs: z.array(PerpetualLiveL2TransactionResponseTransaction),
})
