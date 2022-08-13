function toCamelCase(name: string) {
  let result = ''
  let uppercaseNext = false
  for (const character of name) {
    if (character === '-') {
      uppercaseNext = true
      continue
    }
    if (uppercaseNext) {
      result += character.toUpperCase()
      uppercaseNext = false
      continue
    }
    result += character
  }
  return result
}

export function getAttribute(form: HTMLFormElement, name: string): string {
  const attribute = form.dataset[toCamelCase(name)]
  if (!attribute) {
    throw new Error(
      `Attribute data-${name} not found in form.${form.className}.`
    )
  }
  return attribute
}
