import { ContractFactory, providers, Wallet } from 'ethers'
import ganache from 'ganache'

import RegistryArtifact from '../build/Registry.json'
import VerifierArtifact from '../build/Verifier.json'

main()
async function main() {
  const DEPLOYER_PK =
    '0x9fd525080ae361bf1494de90b8c673ddbdedae9740d2ce8e65ef0bb6c13a487f'

  const server = ganache.server({
    wallet: {
      accounts: [
        {
          balance: 1234n * 10n ** 18n,
          secretKey: DEPLOYER_PK,
        },
      ],
    },
    logging: {
      quiet: true,
    },
  })
  server.listen(8545)
  const provider = new providers.Web3Provider(
    server.provider as unknown as providers.ExternalProvider
  )
  const deployer = new Wallet(DEPLOYER_PK, provider)

  const registryFactory = new ContractFactory(
    RegistryArtifact.abi,
    RegistryArtifact.bytecode,
    deployer
  )
  const registry = await registryFactory.deploy()

  console.log('Registry', registry.address)

  const verifierFactory = new ContractFactory(
    VerifierArtifact.abi,
    VerifierArtifact.bytecode,
    deployer
  )
  const verifier = await verifierFactory.deploy()

  console.log('Verifier', verifier.address)
}
