export function makeError(err: unknown) {
  return err instanceof Error ? err : new Error(JSON.stringify(err))
}
