import { ContractFactory, Wallet } from 'ethers'

import PerpetualArtifact from '../build/Perpetual.json'
import RegistryArtifact from '../build/Registry.json'
import VerifierArtifact from '../build/Verifier.json'

type ContractsPromise = ReturnType<typeof deployContracts>
export type Contracts = ContractsPromise extends Promise<infer T> ? T : never

export async function deployContracts(deployer: Wallet) {
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

  const perpetualFactory = new ContractFactory(
    PerpetualArtifact.abi,
    PerpetualArtifact.bytecode,
    deployer
  )
  const perpetual = await perpetualFactory.deploy()

  console.log('Perpetual', perpetual.address)

  return {
    registry,
    verifier,
    perpetual,
  }
}
