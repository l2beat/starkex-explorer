export function assertUnreachable(_: never): never {
  throw new Error('There are more values to handle.')
}
