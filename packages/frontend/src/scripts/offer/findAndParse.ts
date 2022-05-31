export function findAndParse<T>(
  form: HTMLFormElement,
  name: string,
  parse: (text: string) => T
): T {
  const value = form.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value
  if (!value) {
    throw new Error(`Element ${name} not found in form`)
  }
  return parse(value)
}
