export function sumNumericValuesByKey<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<any, number>,
  V extends T[keyof T]
>(a: T, b: T, ...rest: T[]): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = [a, b, ...rest].reduce<Record<any, number>>((result, obj) => {
    for (const k in obj) {
      result[k as keyof T] = (((result[k] ?? 0) as V) +
        (obj[k as keyof T] ?? 0)) as V
    }
    return result
  }, {})
  return res as T
}
