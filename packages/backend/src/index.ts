import { Application } from './Application'
import { getConfig } from './config'

const env = process.env.NODE_ENV === 'production' ? 'production' : 'local'

if (require.main === module) {
  try {
    const config = getConfig(env)
    const app = new Application(config)
    app.start().catch(onError)
  } catch (e) {
    onError(e)
  }
}

function onError(e: unknown) {
  console.error(e)
  process.exit(1)
}

// Public API exposed for encoding tests

export { getOnChainData } from './peripherals/onchain'
