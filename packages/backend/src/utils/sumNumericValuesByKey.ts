export function sumNumericValuesByKey<
  T extends Record<any, number>,
  V extends T[keyof T]
>(a: T, b: T, ...rest: T[]): T {
  const res = [a, b, ...rest].reduce<T>((result, obj) => {
    for (const k in obj) {
      result[k as keyof T] = (((result[k] ?? 0) as V) +
        (obj[k as keyof T] ?? 0)) as V
    }
    return result
  }, {} as T)
  return res
}
