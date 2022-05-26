import { Wallet } from 'ethers'

import { deployContracts } from './deployContracts'
import { setupGanache } from './setupGanache'

main()
async function main() {
  const DEPLOYER_PK =
    '0x9fd525080ae361bf1494de90b8c673ddbdedae9740d2ce8e65ef0bb6c13a487f'

  const { provider } = await setupGanache([DEPLOYER_PK])
  const deployer = new Wallet(DEPLOYER_PK, provider)
  await deployContracts(deployer)

  console.log('--- FINISHED DEPLOYING CONTRACTS ---')
}
