import { terminateWorkerPool } from '@explorer/crypto'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

process.env.NODE_ENV = 'test'

chai.use(chaiAsPromised)

after(terminateWorkerPool)
