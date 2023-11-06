# Accessing User Page

For introduction to StarkEx explorer, see this guide:

* [Introduction to StarkEx Explorer](/tutorials/introduction)

Accessing user page is possible in multiple ways. 

* If user knows the StarkKey, they can simply search for it using the search box. 
* If user knows the Ethereum address, they can also search for it, but only if that address was previously **registered as an owner of a StarkKey**. On some exchanges this process happens automatically, but due to its high cost it is currently discouraged.
* Connecting via Metamask to calculate their StarkKey using their Ethereum account

# Connecting via Metamask

When user clicks on the "Connect wallet" button and approves the connection in Metamask wallet, the Explorer checks if user's Ethereum address is already "registered", i.e. mapped to a StarkKey. If it's not, user will be presented with an option to "Recover StarkKey". This operation is free of cost. By clicking on the "Recover" button, user will be presented with a "Signature request" by the Metamask interface. It is important to read the message that is supposed to be signed - it should be a sign-on request to an exchange. By "clicking" on the "Sign" button, user's StarkKey will be calculated based on their Ethereum account (using private key signature) and user will be redirected to their User Page.


