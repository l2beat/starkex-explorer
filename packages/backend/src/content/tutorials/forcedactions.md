# All about Forced Actions

For introduction to StarkEx explorer, see this guide:

* [Introduction to StarkEx Explorer](/tutorials/introduction)

Forced Actions are special operations initiated via Ethereum blockchain. They are special emergency measures that should not be used under normal conditions due to their high cost and slow time of execution. They are useful when:

* the StarkEx system (e.g. exchange) is operating normally,
* but user is not able to access system's native interface (e.g. Exchange's website) for example due to censorship

In such scenario, forced actions provide an emergency exit route to withdraw user's assets to Ethereum.

If the StarkEx system is not operating normally (e.g. operator's servers have been shut down completely), user will need to use an Escape Hatch, which is an expensive, last resort solution.

### Forced Withdrawal

Forced Withdrawals can be used to withdraw user assets, except for "perpetuals". If there are any perpetual positions open, they should be closed via "Forced Trade" before a Forced Withdrawal is attempted.

To initiate a Forced Withdrawal, user should:

1. Open their User Page

1. Click on the "Withdraw" button next to their token (collateral) entry in "Assets" table.

1. Optional: if user's Ethereum address has not been registered on Ethereum (which means that Ethereum contracts don't know which StarkKey belongs to that Ethereum address), they will be asked to do it via an Ethereum transaction.

1. Enter requested amount to withdraw. StarkEx in a Spot trading mode will only allow to withdraw the full balance.

1. Click on "Prepare for withdrawal" button and send the requested transaction to Ethereum.

Created Forced Withdrawal request will be visible on User Page in "Forced transactions" panel.

After initiating Forced Withdrawal, StarkEx operators have a predefined amount of time (usually 7 or 14 days) to perform requested withdrawal. When they do, User Page will display a "Withdrawable assets" section with a "Withdraw now" button to trigger the final transfer of funds to user's Ethereum account.

If StarkEx Operator doesn't honor user's Forced Withdrawal request if given time, user will be able to trigger Exchange Freeze and trigger Escape Hatch functionality, described in a separate guide ([Escape Hatch explained](/tutorials/escapehatch)).

It's important to notice that nothing stops users from manually triggering Forced Withdrawals with incorrect amounts. Such requests will still be processed by StarkEx system, but due to their invalid data they will not trigger the final withdrawal.

### Forced Trades

Forced Trades are special actions required to close open perpetual positions. 

To initiate a Forced Trade, user should:

1. Open their User Page

1. Click on the "Close" button next to their perpetual asset entry in "Assets" table. If user's position is "long", it would trigger a "Sell" trade, or "Buy" in case of a "short" position.

1. Optional: if user's Ethereum address has not been registered on Ethereum (which means that Ethereum contracts don't know which StarkKey belongs to that Ethereum address), they will be asked to do it via an Ethereum transaction.

1. Enter desired trade data (perpetual amount and price)

1. Click on "Create buy/sell offer" button, which will require a user to sign with their Metamask wallet.


Such trade will be visible on the StarkEx Explorer Home Page and on user's User Page in the "Offers" panel.

Offers are internal to StarkEx explorer and are not visible neither on Ethereum nor on the StarkEx system.

Offer needs to be accepted by a counterpart via interaction with the offer on the Explorer. When some user "Accepts" the offer, original creator can either cancel or approve it by sending a Forced Withdrawal transaction to Ethereum.

Just like the Forced Withdrawal process, StarkEx Operator has limited time to honor this trade. If they do, the position will disappear from user's User Page and collateral asset balance will be updated accordingly. Otherwise, user will be able to use Escape Hatch Functionality.