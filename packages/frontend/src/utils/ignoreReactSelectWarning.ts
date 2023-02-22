export function ignoreReactSelectWarning() {
  const consoleError = console.error
  const SUPPRESSED_ERRORS = [
    // makes sense for client side react, but not for server side rendering
    'Warning: Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>.',
  ]

  console.error = function filterWarnings(msg, ...args: unknown[]) {
    if (
      typeof msg !== 'string' ||
      !SUPPRESSED_ERRORS.some((entry) => msg.includes(entry))
    ) {
      consoleError(msg, ...args)
    }
  }
}
