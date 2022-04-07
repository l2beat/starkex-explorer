import { writeFileSync } from 'fs'

import { getOnChainData } from './getOnChainData'

run()
async function run() {
  const data = await getOnChainData(
    '0x46c212912be05a090a9300cf87fd9434b8e8bbca15878d070ba83375a5dbaebd'
    // '0x5a81a54eb926a240264f9a481810242987ae566e82f29bcdd8cd32063e1976c5'
  )
  writeFileSync(
    'test/data/encoded-example.json',
    JSON.stringify(data, null, 2) + '\n'
  )
}
