import { ExternalProvider } from '@ethersproject/providers'
import { Hash256 } from '@explorer/types'
import { expect } from 'earljs'
import { ethers } from 'ethers'
import * as ganache from 'ganache'

import { EthereumClient } from '../../../src/peripherals/ethereum/EthereumClient'
import { TransactionMonitor } from '../../../src/peripherals/ethereum/TransactionMonitor'
import { mock } from '../../mock'

describe(TransactionMonitor.name, () => {
  describe(TransactionMonitor.prototype.waitForTransaction.name, () => {
    it('returns transaction if found right away', async () => {
      const ganacheProvider = ganache.provider({
        miner: { blockTime: 199 },
        logging: { quiet: true },
      })
      const [from, to] = Object.keys(ganacheProvider.getInitialAccounts())
      const provider = new ethers.providers.Web3Provider(
        // typings are incorrect - this comes from official ganache example
        ganacheProvider as unknown as ExternalProvider
      )
      const ethereumClient = new EthereumClient(provider)
      const monitor = new TransactionMonitor(ethereumClient)
      const transaction = await provider
        .getSigner(from)
        .sendTransaction({ to, value: ethers.utils.parseEther('1.0') })
      const hash = Hash256(transaction.hash)
      const awaitedTransaction = await monitor.waitForTransaction(hash)
      expect(awaitedTransaction).toBeDefined()
    })
    it('follows exponential back-off when waiting', async () => {
      const delays: number[] = []
      const wait = (delay: number) =>
        new Promise<void>((resolve) => {
          delays.push(delay)
          resolve()
        })
      const monitor = new TransactionMonitor(
        mock<EthereumClient>({
          async getTransaction() {
            return null
          },
        }),
        wait
      )
      const transaction = await monitor.waitForTransaction(Hash256.fake(), 3)
      expect(transaction).not.toBeDefined()
      expect(delays).toEqual([1000, 2000, 4000])
    })
  })
  describe(TransactionMonitor.prototype.getFinalStatus.name, () => {
    it('returns forgotten', async () => {
      const monitor = new TransactionMonitor(
        mock<EthereumClient>({
          async getTransaction() {
            return null
          },
        })
      )

      const status = await monitor.getFinalStatus(Hash256.fake(), 0)

      expect(status).toEqual('forgotten')
    })
    it('returns mined', async () => {
      const ganacheProvider = ganache.provider({
        miner: { blockTime: 199 },
        logging: { quiet: true },
      })
      const [from, to] = Object.keys(ganacheProvider.getInitialAccounts())
      const provider = new ethers.providers.Web3Provider(
        // typings are incorrect - this comes from official ganache example
        ganacheProvider as unknown as ExternalProvider
      )
      const ethereumClient = new EthereumClient(provider)
      const monitor = new TransactionMonitor(ethereumClient)
      const tx = await provider
        .getSigner(from)
        .sendTransaction({ to, value: ethers.utils.parseEther('1.0') })
      const hash = Hash256(tx.hash)
      await ganacheProvider.send('evm_mine')
      const status = await monitor.getFinalStatus(hash)
      expect(status).toEqual('mined')
    })
  })
})
