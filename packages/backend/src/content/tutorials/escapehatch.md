# Escape Hatch Explained

For an introduction to StarkEx Explorer, see this guide:

* [Introduction to StarkEx Explorer](/tutorials/introduction)

Escape Hatch is a functionality available as the last resort for users to withdraw their funds from the StarkEx system to Ethereum.

When the StarkEx system is operating normally but a user is unable to use the regular interface (e.g., an exchange's web page), they should initiate a Forced Action request, as described in a separate guide ([All about Forced Actions](/tutorials/forcedactions)), to attempt the withdrawal of their funds. If Forced Action is not honored within a predefined amount of time (configured by StarkEx, usually 7 or 14 days), either due to inaction or because the operator is not functioning, the StarkEx Explorer will detect this state and display an option in the website header to "Request Freeze" of the StarkEx system.
    
## Exchange Freeze

Freezing the StarkEx system can be initiated by any user if at least one Forced Action has not been honored by the StarkEx Operator within the predefined time. By clicking on the "Request Freeze" button and confirming the Metamask transaction, the entire StarkEx system will enter a frozen state, in which no off-chain (L2) operations can be performed (e.g., no trades), and users will only be able to request the withdrawal of their full balances.

The StarkEx Explorer's interface will change accordingly, with the webpage header displaying an appropriate message on each page, and operations available to users will be altered as well.

## Performing an Escape

After visiting their User Page, users will find an "Escape" button next to their non-perpetual tokens in the Assets panel (the values of perpetual positions are automatically included in the collateral escape). Upon clicking this button, if a user's Ethereum address has not been registered on Ethereum (which implies that Ethereum contracts do not recognize which StarkKey belongs to that Ethereum address), they will need to register it via an Ethereum transaction. Next, the user will be presented with a description of the escape process and prompted to click on the "Initiate Escape" button. This action will prompt a Metamask transaction, which may incur significant cost due to the amount of data, specifically a Merkle Proof, which proves to the Ethereum smart contract that the user indeed owns the claimed assets as of the last state update.

Once the transaction has been confirmed on Ethereum, the User Page will display a "Pending Escapes" section. By clicking on the "Finalize Escape" button next to an asset, the user will be prompted to send a transaction via Metamask, which will complete the transfer of funds to the user's Ethereum wallet.
