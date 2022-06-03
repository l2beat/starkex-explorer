function toCamelCase(name: string) {
  let result = ''
  let uppercaseNext = false
  for (let i = 0; i < name.length; i++) {
    if (name[i] === '-') {
      uppercaseNext = true
      continue
    }
    if (uppercaseNext) {
      result += name[i].toUpperCase()
      uppercaseNext = false
    }
    result += name[i]
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
