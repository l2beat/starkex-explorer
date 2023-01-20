import { TransactionStatusService } from './TransactionStatusService'

const MINUTE = 1000 * 60

export class TransactionStatusMonitor {
  private running = false

  constructor(
    private readonly transactionStatusService: TransactionStatusService,
    private readonly syncInterval = MINUTE
  ) {}

  private scheduleNextCheck() {
    if (!this.running) {
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      if (!this.running) {
        return
      }
      try {
        await this.transactionStatusService.checkPendingTransactions()
      } finally {
        this.scheduleNextCheck()
      }
    }, this.syncInterval)
  }

  start() {
    this.running = true
    this.scheduleNextCheck()
  }

  stop() {
    this.running = false
  }
}
