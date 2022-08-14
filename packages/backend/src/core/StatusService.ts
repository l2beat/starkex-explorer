import { json } from '@explorer/types'

interface StatusReporter {
  getStatus(): json
}

export class StatusService {
  constructor(private readonly reporters: Record<string, StatusReporter>) {}

  getStatus() {
    const result: Record<string, json> = {}
    for (const [name, reporter] of Object.entries(this.reporters)) {
      result[name] = reporter.getStatus()
    }
    return result
  }

  getReporters() {
    return Object.keys(this.reporters)
  }

  getReporterStatus(name: string) {
    const reporter = this.reporters[name]
    if (!reporter) {
      throw new Error(`Unknown reporter ${name}!`)
    }
    return reporter.getStatus()
  }
}
