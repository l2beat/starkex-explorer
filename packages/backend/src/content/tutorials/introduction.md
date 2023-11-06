# Introduction to StarkEx Explorer

StarkEx Explorer is an open-source tool with a Web interface that allows users to independently download, verify, and browse data published to Ethereum by StarkEx systems. Additionally, it provides an interface to perform so-called "Forced Actions" and trigger "Escape Hatch" functionalities, which are the main guarantees of self-custody of funds.

## What is StarkEx

StarkEx is an Ethereum Layer 2 (L2) system targeting DeFi and trading applications. While most operations (like trading and creating orders) are created and executed off-chain for speed and low cost, users' balances are periodically hashed (in the form of a "Merkle Root") and published to Ethereum. If StarkEx operates in a "rollup mode," changes to users' balances are also published to Ethereum. In "validium" mode, that data is published to a set of trusted operators, known as the Data Availability Committee (DAC). Although L2 transactions are not published to Ethereum, their validity is ensured via validity proofs (specifically STARK Zero-Knowledge proofs) which are published to Ethereum. This architecture allows users, in case of emergency (such as censorship or exchange shutdown), to independently and trustlessly withdraw their funds and tokens to Ethereum using one of two mechanisms:

- Forced Actions - operations that must be included by StarkEx operators within a limited amount of time
- Escape Hatch - direct interaction with Ethereum contracts if Forced Actions are not honored by StarkEx operators

This guide will explore how the StarkEx Explorer can be used to browse data published by StarkEx systems.

To learn how it helps users ensure that their funds are safe and trades are valid, see:

- [Accessing User Page](/tutorials/userpage)

To learn how to perform Forced Actions and trigger Escape Hatch operations, see the following guides:

- [All about Forced Actions](/tutorials/forcedactions)
- [Escape Hatch Explained](/tutorials/escapehatch)

## Understanding Data Available on StarkEx Explorer

A notable feature of the StarkEx system is that users are identified by their StarkKey, not their Ethereum address, although they are related. Specifically, forced actions and the escape hatch require a user's StarkKey to be explicitly mapped to their Ethereum address. This can happen automatically or via user action at any time, depending on the decision made by the StarkEx operator.

### State Updates

Off-chain (L2) operations performed on the StarkEx system update the system state (which includes users' balances). For instance, when a user trades with another user, their balances change accordingly. After some time (typically a few hours, but this depends on the StarkEx Operator), a "State Update" is published to Ethereum (and to the DAC in validium mode). It includes the _changes_ that were made to users' balances since the last published state update.

Users can browse all published state updates in the "State Updates" table. Clicking on any given state update displays its details, which includes the Balance Changes for each StarkKey. It's important to remember that these are not real transactions but the total change that occurred since the previous state update. Specifically, a user could have performed multiple operations in the time between two state updates, but only the final difference between the two will be presented in the Balance Changes table.

### User Page

Clicking on a specific Balance Change entry or searching for an existing StarkKey or previously mapped Ethereum address presents the "User Page," which displays:

- Assets - the balances of the user's assets **during the last state update**. This means that the most recent updates to the balance will not be reflected until the next state update. On the other hand, the balance displayed on the Explorer is "proved" on Ethereum, which means that in the case of triggering Escape Hatch functionality, that balance will be used to return funds to the user.
- Balance Changes - updates to users' balances in past state updates. It's important to remember that these are not single operations performed by the user, but their cumulative effect between subsequent state updates.

Forced Transactions and Offers are described in a separate guide ([All about Forced Actions](/tutorials/forcedactions)). The Transactions (L2) panel is an optional feature available via custom integration with the StarkEx operator, but the validity of that data cannot be verified.
