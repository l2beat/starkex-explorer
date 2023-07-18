type IntervalUnit = 's' | 'm' | 'h' | 'd'
type Interval = `${number}${IntervalUnit}`

export class Clock {
  onEvery(interval: Interval, callback: () => void) {
    callback()
    setInterval(() => {
      callback()
    }, this.toMiliseconds(interval))
  }

  toMiliseconds(interval: Interval) {
    const unit = interval.slice(-1)
    const number = Number(interval.slice(0, -1))

    switch (unit) {
      case 's':
        return number * 1000
      case 'm':
        return number * 60 * 1000
      case 'h':
        return number * 60 * 60 * 1000
      case 'd':
        return number * 24 * 60 * 60 * 1000
    }
  }
}
