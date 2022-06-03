export function parseAttribute<T>(
  attribute: string | undefined,
  parse: (text: string) => T
): T {
  if (!attribute) {
    throw new Error(`Data attribute ${attribute} not found in form.`)
  }
  return parse(attribute)
}
