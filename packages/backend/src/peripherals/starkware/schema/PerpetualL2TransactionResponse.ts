import { z } from 'zod'

import { PerpetualL2Transaction } from './PerpetualBatchInfoResponse'

const PerpetualL2TransactionResponseTransactionInfo = z.strictObject({
  tx: PerpetualL2Transaction,
  tx_id: z.number(),
})
const PerpetualL2TransactionResponseTransaction = z.strictObject({
  apex_id: z.number(),
  tx_info: z
    .string()
    .transform((s) =>
      PerpetualL2TransactionResponseTransactionInfo.parse(JSON.parse(s))
    ),
})

export type PerpetualL2TransactionResponse = z.infer<
  typeof PerpetualL2TransactionResponse
>
export const PerpetualL2TransactionResponse = z.strictObject({
  count: z.number(),
  txs: z.array(PerpetualL2TransactionResponseTransaction),
})
