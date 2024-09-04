import { z } from 'zod'

export const UnsignedIntAsString = z.string().regex(/^([1-9]\d*|0)$/)
export const SignedIntAsString = z.string().regex(/^(-?[1-9]\d*|0)$/)
export const PedersenHash = z.string().regex(/^0[a-f\d]{63}$/)
export const Hash256_0x = z.string().regex(/^0x[a-f\d]{1,64}$/)
export const Hash256 = z.string().regex(/^[a-f\d]{1,64}$/)
export const StarkKey0x = z.string().regex(/^0x[a-f\d]{1,64}$/)
export const AssetHash0x = z.string().regex(/^0x[a-f\d]{1,64}$/)
export const AssetId = z.string().regex(/^0x[a-f\d]{30}$/)
export const EthereumAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/)
