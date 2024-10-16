import * as helpers from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { ethers } from 'ethers'

export class HardhatUtils {
  USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  ERC20_ABI = [
    'function balanceOf(address _owner) public view returns (uint256 balance)'
  ]
  PERPETUAL_ABI = [
    'function isFrozen() public view returns (bool)',
    'function forcedWithdrawalRequest(uint256,uint256,uint256,bool) external',
    'function freezeRequest(uint256,uint256,uint256) external',
    'function escape(uint256,uint256,uint256) external',
    'function withdraw(uint256,uint256) external',
    'function FREEZE_GRACE_PERIOD() view returns (uint256)',
    'event LogWithdrawalAllowed(uint256 ownerKey, uint256 assetType, uint256 nonQuantizedAmount, uint256 quantizedAmount)',
  ]
  FORCED_WITHDRAWAL = {
    positionId: 1,
    starkKey:
      '0x027cda895fbaa174bf10c8e0f57561fa9aa6a93cfec32b87f1bdfe55a161e358',
    ethereumAddress: '0x271bdA3c58B9C1e6016d1256Dad1C8C3Ca0590eF',
    quantizedAmount: 10n * 10n ** 6n,
  }

  constructor(
    private readonly provider: ethers.providers.JsonRpcProvider,
    private readonly perpetualAddress: string
  ) {}

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

  async getBalanceOf(address: string) {
    return this.provider.getBalance(address)
  }

  async getUSDCBalance(address: string) {
    const usdc = new ethers.Contract(
      this.USDC_ADDRESS,
      this.ERC20_ABI,
      this.provider
    )
    return await usdc.balanceOf(address)
  }

  async triggerFreezable() {
    // Impersonate the user of position #1
    await helpers.impersonateAccount(this.FORCED_WITHDRAWAL.ethereumAddress)
    // Give them some eth for gas
    await this.setBalanceOf(this.FORCED_WITHDRAWAL.ethereumAddress, 5n)
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
}
