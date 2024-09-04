import { z } from 'zod'

import { PerpetualL2Transaction } from './PerpetualBatchInfoResponse'

const PerpetualLiveL2TransactionResponseTransactionInfo = z.object({
  tx: PerpetualL2Transaction,
  tx_id: z.number(),
})

export interface L2TransactionParseError {
  errors: z.ZodIssue[]
  payload: string
}

// A discriminated union of a properly parsed transaction and a parse error.
// Discriminated by `parseError` field
type ParsedL2TransactionInfo =
  | {
      tx: PerpetualL2Transaction
      tx_id: number
      parseError: undefined
    }
  | {
      parseError: L2TransactionParseError
    }

const PerpetualLiveL2TransactionResponseTransaction = z.object({
  apex_id: z.number(),
  tx_info: z.string().transform((payload) => {
    const parsed = PerpetualLiveL2TransactionResponseTransactionInfo.safeParse(
      JSON.parse(payload)
    )
    return (
      parsed.success
        ? { ...parsed.data, parseError: undefined }
        : { parseError: { errors: parsed.error.errors, payload } }
    ) as ParsedL2TransactionInfo
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
