# All about Forced Actions

For an introduction to the StarkEx Explorer, see this guide:

- [Introduction to StarkEx Explorer](/tutorials/introduction)

Forced Actions are special operations initiated via the Ethereum blockchain. They are emergency measures that **should not be used under normal conditions** due to their high cost and slow execution time. They are useful when:

- the StarkEx system (e.g., an exchange) is operating normally,
- but the user cannot access the system's native interface (e.g., the exchange's website), for example, due to censorship.

In such scenarios, forced actions provide an emergency exit route for users to withdraw their assets to Ethereum.

If the StarkEx system is not operating normally (e.g., the operator's servers have been shut down completely), users will need to use the Escape Hatch, which is an expensive last-resort solution.

### Forced Withdrawal

Forced Withdrawals are used to withdraw user assets, except for "perpetual assets". If any perpetual positions are open, they must be closed via a "Forced Trade" before attempting a Forced Withdrawal.

To initiate a Forced Withdrawal, users should:

1. Open their User Page.
2. Click on the "Withdraw" button next to their token (collateral) entry in the "Assets" table.
3. Optional: If the user's Ethereum address has not been registered on Ethereum (meaning that Ethereum contracts do not recognize which StarkKey belongs to that Ethereum address), they will be prompted to do so via an Ethereum transaction.
4. Enter the requested amount to withdraw. StarkEx in Spot trading mode will only allow the withdrawal of the full balance.
5. Click on the "Prepare for withdrawal" button and send the requested transaction to Ethereum.

The created Forced Withdrawal request will be visible on the User Page in the "Forced transactions" panel.

After initiating a Forced Withdrawal, StarkEx operators have a predefined amount of time (usually 7 or 14 days) to process the requested withdrawal. When they do, the User Page will display a "Withdrawable assets" section with a "Withdraw now" button to trigger the final transfer of funds to the user's Ethereum account.

If the StarkEx Operator does not honor the user's Forced Withdrawal request within the given time, the user will be able to trigger an Exchange Freeze and engage the Escape Hatch functionality, described in a separate guide ([Escape Hatch explained](/tutorials/escapehatch)).

It is important to note that users can manually initiate Forced Withdrawals with incorrect amounts. Such requests will be processed by the StarkEx system, but due to their invalid data, they will not trigger the final withdrawal.

### Forced Trades

Forced Trades are required to close open perpetual positions.

To initiate a Forced Trade, users should:

1. Open their User Page.
2. Click on the "Close" button next to their perpetual asset entry in the "Assets" table. If the user's position is "long", this would trigger a "Sell" trade, or a "Buy" if the position is "short".
3. Optional: If the user's Ethereum address has not been registered on Ethereum (meaning that Ethereum contracts do not recognize which StarkKey belongs to that Ethereum address), they will be prompted to do so via an Ethereum transaction.
4. Enter the desired trade data (perpetual amount and price).
5. Click on the "Create buy/sell offer" button, which will require the user to sign with their MetaMask wallet.

Such a trade will be visible on the StarkEx Explorer Home Page and on the user's User Page in the "Offers" panel.

Offers are internal to the StarkEx Explorer and are not visible on Ethereum or within the StarkEx system.

An offer needs to be accepted by a counterpart via interaction with the offer on the Explorer. When a user "Accepts" the offer, the original creator can either cancel or approve it by sending a Forced Withdrawal transaction to Ethereum.

Just like with the Forced Withdrawal process, the StarkEx Operator has limited time to honor this trade. If they do, the position will disappear from the user's User Page, and the collateral asset balance will be updated accordingly. Otherwise, the user will be able to use the Escape Hatch functionality.
