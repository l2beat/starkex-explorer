export function toJsonWithoutBigInts(value: unknown) {
  return JSON.stringify(value, (k, v) =>
    typeof v === 'bigint' ? v.toString() : v
  )
}
