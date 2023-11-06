# Escape Hatch explained

For introduction to StarkEx explorer, see this guide:

* [Introduction to StarkEx Explorer](/tutorials/introduction)

Escape Hatch is a functionality available as the last resort for a user to withdraw their funds from StarkEx system to Ethereum.

When the StarkEx system is operating normally but user is unable to use regular interface (e.g. Exchange's web page), they should trigger a Forced Action request, described in a separate guide ([All about Forced Actions](/tutorials/forcedactions)), to attempt withdrawal of their funds. When such Forced Action is not honored in a predefined amount of time (configured by StarkEx, usually 7 or 14 days), either due to inaction or because the operator is not functioning at all, StarkEx Explorer will detect this state and show an option in the website header to "Request Freeze" of the exchange.

## Exchange Freeze

Freezing the exchange can be performed by any user if at least one Forced Action hasn't been honored by StarkEx Operator in predefined time. By clicking on the "Requste Freeze" button and approving Metamask transaction, the whole StarkEx system will enter a frozen state, in which no off-chain (L2) operations can be performed (e.g. no trades) and the only option available to the users will be to request withdrawal of their full balances. 

StarkEx Explorer's interface will change accordingly, the webpage header will display appropriate message on each page, and operations available to users will also change accordingly.

## Performing Escape

After user visits their User Page, there will be an "Escape" button available next to their non-perpetual tokens in the Assets panel (perpatual positions' values are automatically included in the collateral escape). After clicking on the button, if user's Ethereum address has not been registered on Ethereum (which means that Ethereum contracts don't know which StarkKey belongs to that Ethereum address), they will be asked to do it via an Ethereum transaction. Next, user will be presented with description of the escape process and asked to click on the "Initiate Escape" button. This will trigger a Metamask transaction, which can be very costly due to the amount of data, specifically a Merkle Proof which proves to the Ethereum smart contract that user is indeed the owner of given amount of assets as of the last state update.

Once the transaction is mined on Ethereum, User Page will display a panel with "Pending escapes" section. Clicking on "Finalize Escape" button next to an asset will trigger user to send a transaction via Metamask which will perform the transfer of funds to user's Ethereum wallet.