export class MetamaskClient {
  constructor(
    private readonly provider: Provider,
    private readonly instanceChainId: number
  ) {}

  async getChainId(): Promise<string> {
    return this.provider.request({ method: 'eth_chainId' }) as Promise<string>
  }

  async switchToInstanceNetwork() {
    return this.switchToNetwork(`0x${this.instanceChainId.toString(16)}`)
  }

  async switchToNetwork(chainId: `0x${string}`) {
    return this.provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
  }

  async requestAccounts() {
    return this.provider.request({ method: 'eth_requestAccounts' }) as Promise<string[]>
  }
}
