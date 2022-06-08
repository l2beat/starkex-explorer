import { Application } from './Application'
import { getConfig } from './config'
import { reportError } from './tools/ErrorReporter'

const env = process.env.NODE_ENV || 'local'

try {
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
