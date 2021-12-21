import workerpool from 'workerpool'

const pool = workerpool.pool(
  require.resolve('@explorer/crypto/worker/worker.js')
)

export async function pedersen(a: string, b: string): Promise<string> {
  return pool.exec('pedersenSync', [a, b])
}

export function terminateWorkerPool() {
  return pool.terminate()
}
