const workerpool = require('workerpool')
const { pedersenSync } = require('@explorer/crypto')

workerpool.worker({ pedersenSync })
