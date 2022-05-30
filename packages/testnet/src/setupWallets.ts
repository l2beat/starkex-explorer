import { providers, Wallet } from 'ethers'

import { ALICE_PK, BOB_PK, CHARLIE_PK, DEPLOYER_PK } from './constants'

export function setupWallets(provider: providers.Provider) {
  return {
    deployer: new Wallet(DEPLOYER_PK, provider),
    alice: new Wallet(ALICE_PK, provider),
    bob: new Wallet(BOB_PK, provider),
    charlie: new Wallet(CHARLIE_PK, provider),
  }
}
