# Accessing User Page

For an introduction to StarkEx Explorer, see this guide:

- [Introduction to StarkEx Explorer](/tutorials/introduction)

Accessing the user page is possible in multiple ways:

- If the user knows their StarkKey, they can simply search for it using the search box.
- If the user knows their Ethereum address, they can also search for it, but only if that address was previously **registered as an owner of a StarkKey**. On some exchanges, this process happens automatically, but due to its high cost, it is currently discouraged.
- Connecting via MetaMask to calculate their StarkKey using their Ethereum account.

## Connecting via MetaMask

When a user clicks on the "Connect wallet" button and approves the connection in their MetaMask wallet, the Explorer checks if the user's Ethereum address is already "registered," i.e., mapped to a StarkKey. If it's not, the user will be presented with an option to "Recover StarkKey." This operation is free of cost. By clicking on the "Recover" button, the user will be presented with a "Signature request" by the MetaMask interface. It is important to read the message that is supposed to be signed—it should be a sign-on request to an exchange. By "clicking" on the "Sign" button, the user's StarkKey will be calculated based on their Ethereum account (using the private key signature), and the user will be redirected to their User Page.
