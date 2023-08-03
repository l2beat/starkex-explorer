import { z } from 'zod'

import { PerpetualL2Transaction } from './PerpetualBatchInfoResponse'

const PerpetualLiveL2TransactionResponseTransactionInfo = z.object({
  tx: PerpetualL2Transaction,
  tx_id: z.number(),
})
const PerpetualLiveL2TransactionResponseTransaction = z.object({
  apex_id: z.number(),
  tx_info: z
    .string()
    .transform((s) =>
      PerpetualLiveL2TransactionResponseTransactionInfo.parse(JSON.parse(s))
    ),
  time_created: z.number().optional(), // Temporarily optional, only on goerli API
})

export type PerpetualLiveL2TransactionResponse = z.infer<
  typeof PerpetualLiveL2TransactionResponse
>
export const PerpetualLiveL2TransactionResponse = z.object({
  count: z.number(),
  txs: z.array(PerpetualLiveL2TransactionResponseTransaction),
})
