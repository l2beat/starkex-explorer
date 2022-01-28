export interface PedersenHash extends String {
  _PedersenHashBrand: string
}

export function PedersenHash(value: string) {
  if (value.startsWith('0x')) {
    value = value.slice(2)
  }
  if (!/^[\da-fA-F]+$/.test(value)) {
    throw new TypeError('Value must be a hex string')
  }
  if (value.length > 64) {
    throw new TypeError('Value too large')
  }
  value = value.padStart(64, '0')
  if (!value.startsWith('0')) {
    throw new TypeError('Value too large')
  }
  return value.toLowerCase() as unknown as PedersenHash
}

const MAX_PEDERSEN_HASH = BigInt('0x' + 'f'.repeat(63))

PedersenHash.ZERO = PedersenHash('0'.repeat(64))

PedersenHash.fromNumber = function fromNumber(value: number | bigint) {
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new TypeError('Value cannot be floating point')
    }
    if (value > Number.MAX_SAFE_INTEGER) {
      throw new TypeError('Value too large')
    }
  }
  if (value < 0) {
    throw new TypeError('Value cannot be negative')
  }
  if (value > MAX_PEDERSEN_HASH) {
    throw new TypeError('Value too large')
  }
  return value.toString(16).padStart(64, '0') as unknown as PedersenHash
}
