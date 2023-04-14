import { z } from 'zod'

export type TradingMode = z.infer<typeof TradingMode>
export const TradingMode = z.union([z.literal('perpetual'), z.literal('spot')])
