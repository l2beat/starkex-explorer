export interface Timestamp extends BigInt {
  _TimestampBrand: string
}

export function Timestamp(milliseconds: Parameters<BigIntConstructor>[0]) {
  const bigIntMilliseconds = BigInt(milliseconds)
  return bigIntMilliseconds as unknown as Timestamp
}

Timestamp.now = function now() {
  return Timestamp(Date.now())
}

Timestamp.fromSeconds = function fromSeconds(seconds: number | bigint) {
  return Timestamp(BigInt(seconds) * 1000n)
}

Timestamp.fromHours = function fromHours(hours: number | bigint) {
  return Timestamp(BigInt(hours) * 1000n * 3600n)
}

Timestamp.toHours = function toHours(timestamp: Timestamp) {
  return timestamp.valueOf() / 3600n / 1000n
}

Timestamp.toSeconds = function toSeconds(timestamp: Timestamp) {
  return timestamp.valueOf() / 1000n
}

Timestamp.roundDownToHours = function roundUpToHours(timestamp: Timestamp) {
  return Timestamp.fromHours(Timestamp.toHours(timestamp))
}
