import { Mock as MockFunction, mockFn } from 'earljs'

export type MockedObject<T> = T & {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? MockFunction.Of<T[P]>
    : T[P]
}

export function mock<T>(overrides: Partial<T> = {}): MockedObject<T> {
  const clone = replaceFunctionsWithMocks(overrides)

  const proxy = new Proxy(clone as unknown as MockedObject<T>, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)
      if (value !== undefined) {
        return value
      }
      const name = String(property)
      return () => {
        throw new Error(
          `Cannot call .${name}() - no mock implementation provided.`
        )
      }
    },
  })

  return proxy
}

function replaceFunctionsWithMocks<T>(object: T) {
  const clone = { ...object }
  for (const key of Object.keys(clone) as (keyof T)[]) {
    const value = clone[key]
    if (typeof value === 'function') {
      if (!isMockFunction(value)) {
        clone[key] = mockFn(value as any) as any
      }
    }
  }
  return clone
}

function isMockFunction(x: unknown) {
  return typeof x === 'function' && 'calls' in x
}
