// import KnexConstructor, { Knex } from 'knex'
import * as helpers from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { ethers } from 'ethers'

export class HardhatUtils {
  PERPETUAL_ABI = [
    'function isFrozen() public view returns (bool)',
    'function forcedWithdrawalRequest(uint256,uint256,uint256,bool) external',
    'function freezeRequest(uint256,uint256,uint256) external',
    'function escape(uint256,uint256,uint256) external',
    'function withdraw(uint256,uint256) external',
    'function FREEZE_GRACE_PERIOD() view returns (uint256)',
    'event LogWithdrawalAllowed(uint256 ownerKey, uint256 assetType, uint256 nonQuantizedAmount, uint256 quantizedAmount)',
  ]
  FORCED_WITHDRAWAL
  perpetualAddress: string

  constructor(
    private readonly provider: ethers.providers.JsonRpcProvider,
    params: {
      perpetualAddress: string
      starkKey: string
      ethereumAddress: string
    }
  ) {
    this.perpetualAddress = params.perpetualAddress
    this.FORCED_WITHDRAWAL = {
      positionId: 1,
      starkKey: params.starkKey,
      ethereumAddress: params.ethereumAddress,
      quantizedAmount: 10n * 10n ** 6n,
    }

    this.impersonateAccount(params.ethereumAddress).finally(() => {
      this.setBalanceOf(params.ethereumAddress, 5n).finally(() => {
        console.log('Finished impersonating and setting balance')
      })
    })
  }

  async getBlockNumber() {
    return this.provider.getBlockNumber()
  }

  async getChainId() {
    return this.provider.getNetwork().then((network) => network.chainId)
  }

  getPerpetualContract() {
    return new ethers.Contract(
      this.perpetualAddress,
      this.PERPETUAL_ABI,
      this.provider
    )
  }

  async getTxReceipt(txId: string) {
    return this.provider.getTransactionReceipt(txId)
  }

  async isFrozen() {
    const contract = this.getPerpetualContract()
    return contract.isFrozen()
  }

  async impersonateAccount(address: string) {
    await helpers.impersonateAccount(address)
  }

  async setBalanceOf(address: string, ethAmount: bigint) {
    await helpers.setBalance(address, ethAmount * 10n ** 18n)
  }

  async triggerFreezable() {
    // Forced withdrawal data (for user at Position #1)
    const premiumCost = false
    const signer = this.provider.getSigner(
      this.FORCED_WITHDRAWAL.ethereumAddress
    ) // Use the correct signer here
    const perpetualContract = this.getPerpetualContract()
    const perpetualContractWithSigner = perpetualContract.connect(signer)
    await perpetualContractWithSigner.forcedWithdrawalRequest(
      this.FORCED_WITHDRAWAL.starkKey,
      this.FORCED_WITHDRAWAL.positionId,
      this.FORCED_WITHDRAWAL.quantizedAmount,
      premiumCost
    )

    await this.mineGracePeriod()
  }

  async mineBlock() {
    await helpers.mine(1)
  }

  async mineGracePeriod() {
    const perpetualContract = this.getPerpetualContract()
    const freezeGracePeriod = (
      await perpetualContract.FREEZE_GRACE_PERIOD()
    ).toNumber()
    await helpers.mine(2, { interval: freezeGracePeriod })
  }

  async freeze() {
    const signer = this.provider.getSigner(
      this.FORCED_WITHDRAWAL.ethereumAddress
    ) // Use the correct signer here
    const perpetualContract = this.getPerpetualContract()
    const perpetualContractWithSigner = perpetualContract.connect(signer)
    await perpetualContractWithSigner.freezeRequest(
      this.FORCED_WITHDRAWAL.starkKey,
      this.FORCED_WITHDRAWAL.positionId,
      this.FORCED_WITHDRAWAL.quantizedAmount
    )
  }

  async escape() {
    const signer = this.provider.getSigner(
      this.FORCED_WITHDRAWAL.ethereumAddress
    ) // Use the correct signer here
    const perpetualContract = this.getPerpetualContract()
    const perpetualContractWithSigner = perpetualContract.connect(signer)
    await perpetualContractWithSigner.escape(
      this.FORCED_WITHDRAWAL.starkKey,
      this.FORCED_WITHDRAWAL.positionId,
      this.FORCED_WITHDRAWAL.quantizedAmount
    )
  }
}
