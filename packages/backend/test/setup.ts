import { terminateWorkerPool } from '@explorer/crypto'
import { config } from 'dotenv'
import waitForExpect from 'wait-for-expect'

config()

process.env.NODE_ENV = 'test'

after(terminateWorkerPool)

before(function (this) {
  // We set this to ensure waitForExpect timeout is shorter than Mocha timeout
  // and we get proper errors from our assertions instead of Mocha timeout errors.
  waitForExpect.defaults.timeout = this.timeout() - 500
})
