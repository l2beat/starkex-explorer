# Escape Hatch Explained

For an introduction to StarkEx Explorer, see this guide:

- [Introduction to StarkEx Explorer](/tutorials/introduction)

Escape Hatch is a functionality available as the last resort for users to withdraw their funds from the StarkEx system to Ethereum.

When the StarkEx system is operating normally but a user is unable to use the regular interface (e.g., an exchange's web page), they should initiate a Forced Action request, as described in a separate guide ([All about Forced Actions](/tutorials/forcedactions)), to attempt the withdrawal of their funds. If Forced Action is not honored within a predefined amount of time (configured by StarkEx, usually 7 or 14 days), either due to inaction or because the operator is not functioning, the StarkEx Explorer will detect this state and display an option in the website header to "Request Freeze" of the StarkEx system.

## Exchange Freeze

Freezing the StarkEx system can be initiated by any user if at least one Forced Action has not been honored by the StarkEx Operator within the predefined time. By clicking on the "Request Freeze" button and confirming the Metamask transaction, the entire StarkEx system will enter a frozen state, in which no off-chain (L2) operations can be performed (e.g., no trades), and users will only be able to request the withdrawal of their full balances.

The StarkEx Explorer's interface will change accordingly, with the webpage header displaying an appropriate message on each page, and operations available to users will be altered as well.

## Performing an Escape

The Escape Hatch is a crucial functionality that allows users to withdraw their funds from the StarkEx system directly to Ethereum when the exchange itself is frozen and operators no longer function. This is achieved by interacting with Ethereum contracts, providing so called "Merkle Proof" of the ownership of funds and performing a few transactions. Due to the amount of data and logic required to process those transactions, they can be very costly (in terms of Ethereum gas cost).

Here's a detailed guide on how to perform an Escape:

### Initiating an Escape

1. Navigate to your User Page on the StarkEx Explorer.
2. Look for the "Escape" button next to your non-perpetual token in the Assets panel.
3. Click on the "Escape" button to begin the process.

It's important to note that the Escape Hatch functionality is permissionless. This means that not only can you initiate an Escape for your own funds, but you can also do so for other users. However, it's crucial to understand that even if someone else triggers the Escape Hatch for a user, the funds will always be made available for withdrawal (and ultimately withdrawn) to that user's Ethereum address. The person performing these actions only pays for the gas costs on Ethereum.

If you're initiating an Escape for another user, you'll need to go to their User Page and look for an option to "Perform user actions" for that user instead and then follow the regular Escape process.

### The Three-Step Escape Process

Escaping funds is a three-step process:

1. **Initiate Escape**:

   - Escape process is initiated by clicking on the "Escape" button on the User Page.
   - You will be redirected to the Escape initialization page which will describe the whole process.
   - Click on the "Initiate Escape" button and confirm the transaction in your MetaMask wallet.
   - Be aware that this transaction may be costly due to the inclusion of a Merkle Proof, which verifies your ownership of the assets.

2. **Finalize Escape**:

   - After the initiation is confirmed on Ethereum, return to the User Page.
   - You'll now see a new "Pending Escapes" section on the page.
   - In this section, find the "Finalize Escape" button next to the perpetual asset.
   - Click on "Finalize Escape" and confirm another MetaMask transaction.

3. **Withdraw Funds**:
   - Once the finalization is complete, the funds become withdrawable.
   - Return to the User Page.
   - Look for a new "Withdrawable Assets" section.
   - Click on the "Withdraw now" button to complete the transfer of funds to the original user's Ethereum wallet.

Remember, each step requires a separate Ethereum transaction, which means you'll need to pay gas fees for each action.

Whether you're escaping your own funds or assisting another user, always double-check the details before confirming any transactions. The Explorer interface will guide you through each step, providing necessary information and confirmation prompts along the way.

## Read more

To learn more about Escape Hatch process, see:

- [Escape Hatch FAQ](/tutorials/faqescapehatch)
