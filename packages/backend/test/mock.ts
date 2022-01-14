import { Mock as MockFunction, mockFn } from 'earljs'

export type MockedObject<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? MockFunction.Of<T[P]>
    : T[P]
} & T

export function mock<T>(overrides: Partial<T> = {}): MockedObject<T> {
  const clone = { ...overrides } as any as MockedObject<T>
  const proxy = new Proxy(clone, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)
      if (value && typeof value !== 'function') {
        return value
      }
      if (isMockFunction(value)) {
        return value
      }
      const m = mockFn(value || (() => {}))
      Reflect.set(target, property, m, receiver)
      return m
    },
  })

  return proxy
}

function isMockFunction(x: unknown): x is MockFunction<any[], unknown> {
  return typeof x === 'function' && 'calls' in x
}
