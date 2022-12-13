export function packBytes(
  values: { bytes: number; value: string | bigint | number }[]
) {
  return values
    .map(({ bytes, value }) => {
      const string = typeof value === 'string' ? value : value.toString(16)
      return string.padStart(bytes * 2, '0')
    })
    .join('')
}
