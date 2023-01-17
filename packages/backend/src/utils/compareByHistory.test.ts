import { Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { compareByHistory } from './compareByHistory'

describe(compareByHistory.name, () => {
  it('returns 0 if both records have no history', () => {
    const record1 = { history: [] }
    const record2 = { history: [] }
    expect(compareByHistory(record1, record2)).toEqual(0)
    expect(compareByHistory(record2, record1)).toEqual(0)
  })

  it('similar but longer history is greater', () => {
    const record1 = {
      history: [{ timestamp: Timestamp(100) }, { timestamp: Timestamp(200) }],
    }
    const record2 = {
      history: [{ timestamp: Timestamp(200) }],
    }
    expect(compareByHistory(record1, record2)).toEqual(-1)
    expect(compareByHistory(record2, record1)).toEqual(1)
  })

  it('single entry', () => {
    const record1 = {
      history: [{ timestamp: Timestamp(100) }],
    }
    const record2 = {
      history: [{ timestamp: Timestamp(200) }],
    }
    expect(compareByHistory(record1, record2)).toEqual(-1)
    expect(compareByHistory(record2, record1)).toEqual(1)
  })

  it('multiple entries - equal', () => {
    const record1 = {
      history: [
        { timestamp: Timestamp(100) },
        { timestamp: Timestamp(200) },
        { timestamp: Timestamp(300) },
      ],
    }
    const record2 = {
      history: [
        { timestamp: Timestamp(100) },
        { timestamp: Timestamp(200) },
        { timestamp: Timestamp(300) },
      ],
    }
    expect(compareByHistory(record1, record2)).toEqual(0)
    expect(compareByHistory(record2, record1)).toEqual(0)
  })

  it('multiple entries - unequal', () => {
    const record1 = {
      history: [
        { timestamp: Timestamp(100) },
        { timestamp: Timestamp(300) },
        { timestamp: Timestamp(400) },
      ],
    }
    const record2 = {
      history: [
        { timestamp: Timestamp(200) },
        { timestamp: Timestamp(300) },
        { timestamp: Timestamp(400) },
      ],
    }
    expect(compareByHistory(record1, record2)).toEqual(-1)
    expect(compareByHistory(record2, record1)).toEqual(1)
  })
})
