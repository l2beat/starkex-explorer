import { terminateWorkerPool } from '@explorer/crypto'

process.env.NODE_ENV = 'test'

after(terminateWorkerPool)
