// eslint-disable-next-line import/no-extraneous-dependencies
import manifest from '@explorer/frontend/build/manifest.json'

export function resolveStatic(file: string) {
  return (manifest as Record<string, string>)[file] ?? file
}
