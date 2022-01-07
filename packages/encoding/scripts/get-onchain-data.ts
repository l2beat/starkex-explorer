import { getOnChainData } from '@explorer/backend'
import { writeFileSync } from 'fs'

run()
async function run() {
  const data = await getOnChainData(
    '0x46c212912be05a090a9300cf87fd9434b8e8bbca15878d070ba83375a5dbaebd'
  )
  writeFileSync(
    'test/data/onchain-example.json',
    JSON.stringify(data, null, 2) + '\n'
  )
}
