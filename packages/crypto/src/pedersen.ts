import { PedersenHash } from '@explorer/types'
import workerpool from 'workerpool'

const pool = workerpool.pool(
  require.resolve('@explorer/crypto/worker/worker.js')
)

export async function pedersen(
  a: PedersenHash,
  b: PedersenHash
): Promise<PedersenHash> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return PedersenHash(await pool.exec('pedersenSync', [a, b]))
}

export function terminateWorkerPool() {
  return pool.terminate()
}
