export interface Timestamp extends Number {
  _TimestampBrand: string
}

export function Timestamp(milliseconds: number | bigint) {
  const numberMilliseconds = Number(milliseconds)
  if (!Number.isInteger(numberMilliseconds)) {
    throw new TypeError('Value must be an integer')
  }
  return numberMilliseconds as unknown as Timestamp
}

Timestamp.fromSeconds = function fromSeconds(seconds: number | bigint) {
  return Timestamp(Number(seconds) * 1000)
}
