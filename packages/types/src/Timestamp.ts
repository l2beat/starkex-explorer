export interface Timestamp extends Number {
  _TimestampBrand: string
}

export function Timestamp(value: number) {
  if (!Number.isInteger(value)) {
    throw new TypeError('Value must be an integer')
  }
  return (value > 10_000_000_000 ? value : value * 1000) as unknown as Timestamp
}
