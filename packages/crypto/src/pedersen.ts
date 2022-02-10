import workerpool from 'workerpool'

import { PedersenHash } from './PedersenHash'

const pool = workerpool.pool(
  require.resolve('@explorer/crypto/worker/worker.js')
)

export async function pedersen(
  a: PedersenHash,
  b: PedersenHash
): Promise<PedersenHash> {
  return PedersenHash(await pool.exec('pedersenSync', [a, b]))
}

export function terminateWorkerPool() {
  return pool.terminate()
}
