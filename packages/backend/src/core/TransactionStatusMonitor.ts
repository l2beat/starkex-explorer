import { TransactionStatusService } from './TransactionStatusService'

const MINUTE = 1000 * 60

export class TransactionStatusMonitor {
  private timeout?: NodeJS.Timeout

  constructor(
    private readonly transactionStatusService: TransactionStatusService,
    private readonly syncInterval = MINUTE
  ) {}

  private scheduleNextCheck() {
    this.timeout = setTimeout(async () => {
      await this.transactionStatusService.syncTransactions()
      this.scheduleNextCheck()
    }, this.syncInterval)
  }

  start() {
    this.scheduleNextCheck()
  }

  stop() {
    if (!this.timeout) {
      return
    }
    clearTimeout(this.timeout)
  }
}
