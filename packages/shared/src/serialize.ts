export function toJsonWithoutBigInts(
  value: unknown,
  space?: string | number | undefined
) {
  return JSON.stringify(
    value,
    (k, v) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      typeof v === 'bigint' ? v.toString() : v,
    space
  )
}
