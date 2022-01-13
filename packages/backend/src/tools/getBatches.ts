export function getBatches(from: number, to: number, batchSize: number) {
  const batches: [number, number][] = []
  for (let start = from; start <= to; start += batchSize) {
    batches.push([start, Math.min(start + batchSize - 1, to)])
  }
  return batches
}
