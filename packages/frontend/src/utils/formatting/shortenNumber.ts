export function shortenNumber(count: number) {
  if (count < 1000) {
    return count.toString()
  }
  if (count < 1000000) {
    return `${Math.floor(count / 1000)}k`
  }
  return `${Math.floor(count / 1000000)}m`
}
