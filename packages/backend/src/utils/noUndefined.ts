export function noUndefined<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error('value cannot be undefined')
  }
  return value
}
