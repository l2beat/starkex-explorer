export function parseDataAttribute<T>(
  form: HTMLFormElement,
  name: string,
  parse: (text: string) => T
): T {
  const value = form.dataset[name]
  if (!value) {
    throw new Error(`Data attribute data-${name} not found in form.`)
  }
  return parse(value)
}
