# dYdX Escape Hatch FAQ

## Why is the dYdX exchange frozen?

The dYdX exchange has been frozen because it has been sunset by the operators and will no longer function. For detailed information about why this has occurred, please refer to the official dYdX blog post: https://dYdX.exchange/blog/v3-product-sunset

## Do I need the StarkEx Explorer to use the Escape Hatch functionality?

No, the Escape Hatch functionality is based on smart contracts deployed on the Ethereum blockchain, which users can interact with directly. The StarkEx Explorer is simply a user-friendly interface built on top of these smart contracts. While it provides a convenient way to interact with the Escape Hatch functionality, it is not necessary to use the Explorer to perform the escape process. Users are free to interact with the smart contracts directly if they prefer.

## Can a different user perform an Escape Hatch for me?

Yes, the Escape Hatch operations are permissionless, which means they can be performed by any user. However, it's crucial to understand that even if someone else triggers the Escape Hatch process for a given position, the funds will always be withdrawn to the position owner's Ethereum address. The person performing the transactions will only pay for the gas costs associated with the process.

## What if I don't have a MetaMask-compatible wallet?

Currently, the StarkEx Explorer only supports MetaMask or MetaMask-compatible wallets, such as Rabby. If you don't have access to a MetaMask-compatible wallet, you have a couple of options:

1. You can create a new MetaMask wallet specifically for this purpose. With this new wallet, you can trigger the Escape Hatch process for your position, as long as the wallet has enough funds to cover the gas costs.

2. Alternatively, you can ask someone else who has a MetaMask-compatible wallet to trigger the Escape Hatch process for your position.

In both cases, it's important to note that while anyone can trigger the Escape Hatch process, the funds will always be withdrawn to the Ethereum address of the original position owner.

## How long does the Escape Hatch process take?

The Escape Hatch process consists of three main steps: Initiate Escape, Finalize Escape, and Withdraw Funds. Each step requires a separate Ethereum transaction, which means the total time can vary depending on network congestion and gas prices. Typically, if all transactions are processed without delays, the entire process can take anywhere from 30 minutes to a few hours.

## Are there any fees associated with using the Escape Hatch?

Yes, there are fees associated with using the Escape Hatch functionality. These fees come in the form of Ethereum gas costs for each transaction in the process (Initiate, Finalize, and Withdraw). The exact cost will depend on the current Ethereum network congestion and gas prices at the time of each transaction. It's important to ensure that the wallet you're using has enough ETH to cover these gas costs.

## What happens if I start the Escape Hatch process but don't complete all steps?

If you start the Escape Hatch process but don't complete all steps, your funds will remain safe but inaccessible until you complete the process. You can always return to the StarkEx Explorer at a later time to continue from where you left off. There's no time limit for completing the process once it's initiated.

## Can I cancel an Escape Hatch process once it's started?

No, once the Escape Hatch process has been initiated, it cannot be cancelled. However, you're not obligated to complete the process immediately. You can wait and complete the remaining steps at a later time if needed.

For any additional questions or concerns, please refer to the official dYdX documentation or contact their support team.

## What happens to my open positions when I use the Escape Hatch?

When the exchange is frozen and the user triggers Escape Hatch process, the collateral (USDC) amount that will be withdrawn will include the value of user's every open position, valued at the oracle prices at the time when the trading halted. You cannot selectively close or maintain specific positions – all positions are "closed" as part of the Escape Hatch procedure.

## Can I use the Escape Hatch for all types of assets on dYdX?

Escape process allows to withdraw only the collateral token (USDC). When the exchange is frozen and the user triggers Escape Hatch process, the collateral (USDC) amount that will be withdrawn will include the value of user's every open position, valued at the oracle prices at the time when the trading halted.

## What should I do if I encounter an error during the Escape Hatch process?

If you encounter an error during any step of the Escape Hatch process, the first step is to check that you have sufficient ETH in your wallet to cover gas fees. If the error persists, try the following:

1. Refresh the page and attempt the action again.
2. Clear your browser cache and reconnect your wallet.
3. Try using a different browser or device.

If you continue to experience issues, you can seek help from the dYdX community forums or contact the dYdX support team. Remember, the Explorer is just a graphical interface, so if all else fails, you can interact with the smart contracts directly, though this requires technical knowledge.

## Can I use a hardware wallet for the Escape Hatch process?

Yes, you can use a hardware wallet like Ledger or Trezor for the Escape Hatch process, as long as it's connected through a MetaMask-compatible interface. Hardware wallets provide an extra layer of security for your transactions. Just ensure that your hardware wallet is properly set up and connected to MetaMask or a similar interface before starting the Escape Hatch process.

Remember to always verify the transaction details on your hardware wallet's screen before confirming any transactions.
