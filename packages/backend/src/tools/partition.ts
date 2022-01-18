/**
 * Takes a predicate and a list of values and returns a a tuple (2-item array),
 * with each item containing the subset of the list that matches the predicate
 * and the complement of the predicate respectively
 *
 * @param predicate A predicate to determine which side the element belongs to.
 * @param xs The list to partition
 */
export function partition<T, S extends T>(
  xs: T[],
  predicate: (val: T) => val is S
): [S[], Exclude<T, S>[]]
export function partition<T>(xs: T[], predicate: (x: T) => boolean): [T[], T[]]
export function partition<T, S extends T>(
  xs: T[],
  predicate: ((val: T) => val is S) | ((val: T) => boolean)
): [S[], Exclude<T, S>[]] {
  const yays: S[] = []
  const nays: Exclude<T, S>[] = []

  for (const x of xs) {
    if (predicate(x)) yays.push(x)
    else nays.push(x as Exclude<T, S>)
  }

  return [yays, nays]
}
