import Cookie from 'js-cookie'

import { getUsersInfo } from './metamask'

const chainIdToNetworkName: Record<string, string> = {
  1: 'Mainnet',
  5: 'Goerli',
  539: 'Ganache',
}

export class MetamaskClient {
  constructor(
    private readonly provider: Provider,
    private readonly instanceChainId: number
  ) {
    this.initializeListeners()
  }

  async getChainId(): Promise<string> {
    return (await this.provider.request({ method: 'eth_chainId' })) as string
  }

  async switchToInstanceNetwork() {
    return await this.switchToNetwork(`0x${this.instanceChainId.toString(16)}`)
  }

  async switchToNetwork(chainId: `0x${string}`) {
    return await this.provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
  }

  async requestAccounts() {
    return await this.provider.request({ method: 'eth_requestAccounts' })
  }

  private initializeListeners() {
    this.provider.on('accountsChanged', (accounts) =>
      this.updateAccounts(accounts)
    )

    this.provider.on('chainChanged', (chainId) => this.updateChainId(chainId))
  }

  private updateChainId(chainId: string) {
    if (Number(chainId) !== this.instanceChainId) {
      alert(
        `Please change your metamask to ${
          chainIdToNetworkName[this.instanceChainId]
        } network`
      )
    }
  }

  private updateAccounts(accounts: string[]) {
    this.deleteDisconnectedAccountsFromUsersInfo(accounts)
    const connectedAccount = accounts.at(0)
    const currentAccount = Cookie.get('account')

    const accountsMap = getUsersInfo()

    if (connectedAccount !== currentAccount) {
      if (connectedAccount) {
        Cookie.set('account', connectedAccount.toString())
        const accountMap = accountsMap[connectedAccount]
        if (accountMap?.starkKey) {
          Cookie.set('starkKey', accountMap.starkKey.toString())
        } else {
          Cookie.remove('starkKey')
        }
      } else {
        localStorage.removeItem('accountsMap')
        Cookie.remove('account')
        Cookie.remove('starkKey')
      }
      location.reload()
    }
  }

  private deleteDisconnectedAccountsFromUsersInfo(connectedAccounts: string[]) {
    const usersInfo = getUsersInfo()
    Object.keys(usersInfo).forEach((userAccount) => {
      if (!connectedAccounts.includes(userAccount)) {
        //eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete usersInfo[userAccount]
      }
    })

    localStorage.setItem('accountsMap', JSON.stringify(usersInfo))
  }
}
