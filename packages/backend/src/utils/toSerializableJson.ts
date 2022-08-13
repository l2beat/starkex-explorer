import { json } from '@explorer/types'

export function toSerializableJson(data: object): json {
  return Object.entries(data).reduce((acc, [key, val]) => {
    return {
      ...acc,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [key]: typeof val === 'bigint' ? val.toString() : val,
    }
  }, {})
}
