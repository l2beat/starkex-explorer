import { Timestamp } from '@explorer/types'
import { expect } from 'earl'
import { it } from 'mocha'

import { calculateAge } from './calculateAge'

describe(calculateAge.name, () => {
  describe('Just now', () => {
    it('should return "Just now" when the timestamp is less than 10 seconds ago', () => {
      const now = new Date()
      const timestamp = Timestamp(now.getTime() - 1000)

      const result = calculateAge(timestamp)

      expect(result).toEqual('Just now')
    })
  })

  describe('Seconds ago', () => {
    it('should return the number of seconds ago when the timestamp is less than 60 seconds ago', () => {
      const now = new Date()
      const timestamp = Timestamp(now.getTime() - 10000)

      const result = calculateAge(timestamp)

      expect(result).toEqual('10 secs ago')
    })
  })

  describe('Minutes ago', () => {
    it('should return the number of minutes ago when the timestamp is less than 60 minutes ago', () => {
      const now = new Date()
      const timestamp = Timestamp(now.getTime() - 1000 * 60 * 10)

      const result = calculateAge(timestamp)

      expect(result).toEqual('10 mins ago')
    })

    it('should not pluralize min', () => {
      const now = new Date()
      const timestamp = Timestamp(now.getTime() - 1000 * 60)

      const result = calculateAge(timestamp)

      expect(result).toEqual('1 min ago')
    })
  })

  describe('Hours ago', () => {
    it('should return the number of hours ago when the timestamp is less than 24 hours ago', () => {
      const now = new Date()
      const timestamp = Timestamp(now.getTime() - 1000 * 60 * 60 * 10)

      const result = calculateAge(timestamp)

      expect(result).toEqual('10 hours ago')
    })

    it('should not pluralize hour', () => {
      const now = new Date()
      const timestamp = Timestamp(now.getTime() - 1000 * 60 * 60)

      const result = calculateAge(timestamp)

      expect(result).toEqual('1 hour ago')
    })
  })

  describe('Days ago', () => {
    it('should return the number of days ago when the timestamp is more than 24 hours ago', () => {
      const now = new Date()
      const timestamp = Timestamp(now.getTime() - 1000 * 60 * 60 * 24 * 10)

      const result = calculateAge(timestamp)

      expect(result).toEqual('10 days ago')
    })

    it('should not pluralize day', () => {
      const now = new Date()
      const timestamp = Timestamp(now.getTime() - 1000 * 60 * 60 * 24)

      const result = calculateAge(timestamp)

      expect(result).toEqual('1 day ago')
    })
  })
})
