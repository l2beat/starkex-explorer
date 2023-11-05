# Introduction to StarkEx Explorer

StarkEx Explorer is an open-source tool with Web interface which allows users to independently download, verify and browse data published to Ethereum by StarkEx systems. Additionally, it provides interface to perform so called "Forced Actions" and trigger "Escape hatch" functionalities, which are the main guarantees of self-custody of funds.

## What is StarkEx

StarkEx is an Ethereum Layer 2 (L2) system targeting DeFi and trading game applications. While most operations (like trading and creating orders) are created and executed off-chain for speed and low cost, users' balances are periodically hashed (in the form of a "Merkle Root") and published to Ethereum. If StarkEx works in a "rollup mode", changes to user's balances are also published to Ethereum. In a "validium" mode, that data is published to a set of trusted operators, called Data Availability Committee (DAC). Even though L2 transactions are not published to Ethereum, their validity is ensured via validity proofs (specifically STARK Zero Knowledge proofs) which are published to Ethereum. This architecture allows users to independently and trustlessly withdraw their funds and tokens to Ethereum via one of 2 mechanisms:

* Forced Actions - operations which must be included by StarkEx operators in a limited amount of time
* Escape Hatch - direct interaction with Ethereum contracts if Forced Actions are not honored by StarkEx operators

This guide will explore how the StarkEx Explorer can be used to browse data published by StarkEx systems.

To learn how it helps users in ensuring that their funds are safe and trades are valid see:

* Accessing personal account data on StarkEx Explorer

To learn how to perform Forced Actions and trigger Escape Hatch operations, see the following guides:

* Performing Forced Actions
* Triggering Escape Hatch

## Understanding data available on StarkEx Explorer

An important feature of StarkEx system is that users are identified by their StarkKey, not their Ethereum address, even though they are related. Specifically, forced actions and escape hatch requires user's StarkKey to be explicitly mapped on Ethereum to their StarkKey. This can happen automatically or via user action at any time, depending on the decision made by StarkEx operator.

# State Updates

Off-chain (L2) operations performed on StarkEx system update the system state (which includes users' balances). For example, when a user performs a trade with another user, their balances change accordingly. After some time (typically a few hours, but that depends on StarkEx Operator) a "State Update" is published to Ethereum (and DAC in validium mode). It includes *changes* that were made to user's balances since the last published state update. 

Users can browse all published state updates in the "State Updates" table. Clicking on any given state update displays its details, which includes Balance Changes for each StarkEKy. It's important to remember that they are not real transactions, but a total change that happened since previous state update. Specifically, user could have performed multiple operations in the time between two state updates, but only the final difference between the two will be presented in the Balance Changes table.

# User Page

Clicking on a specific Balance Change entry or searching for existing StarkKe or previously mapped Ethereum address presents "User Page", which displays:

* Assets - balances of user's assets **during last state update**. This means that the most recent updates to balance will not be reflected until the next state update. On the other hand, balance displayed on the Explorer is "proved" on Ethereum, which means that in case of triggering Escape Hatch functionality, that balance will be used to return funds to the user.
* Balance Changes - updates to users' balances in past state updates. It's important to remember that these are not single operations performed by the user, but their cumulative effect performed between subsequent state updates. 

Forced Transactions and Offers are described in a separate guide. Transactions (L2) are an optional panel which is available via custom integration with StarkEx operator but validity of that data can't be verified.