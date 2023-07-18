import { getEnv } from '@l2beat/backend-tools'

import { Application } from './Application'
import { getConfig } from './config'
import { reportError } from './tools/ErrorReporter'

try {
  const env = getEnv()
  const config = getConfig(env)
  const app = new Application(config)
  app.start().catch(onError)
} catch (e) {
  onError(e)
}

function onError(e: unknown) {
  console.error(e)
  reportError(e)
  process.exit(1)
}
