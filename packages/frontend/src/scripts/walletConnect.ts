import Cookie from 'js-cookie'
import Client, { SignClient } from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";

const web3Modal = new Web3Modal({
    walletConnectVersion:2,
    projectId: "3a6ff9424d51410662045d2567fc9849"
  })
  

async function handleConnect(signClient: Client,connectButton: HTMLButtonElement){
    if (!signClient) throw Error("SignClient does not exist");
    console.log(signClient.session.getAll())
    const proposalNamespace = {
      eip155: {
          methods: ["eth_sendTransaction",
          "eth_signTransaction",
          "eth_sign",
          "personal_sign",
          "eth_signTypedData",],
          chains: ["eip155:1"],
          events: ["chainChanged", "accountsChanged"]
        }
      }
    const { uri , approval} = await signClient.connect({
      requiredNamespaces: proposalNamespace
    });
     console.log(uri)
    if (uri){
      web3Modal.openModal({ uri });
    }
    await approval().then((data: { namespaces: { [x: string]: { accounts: string[]; }; }; })=>{
      console.log("data",data)
      const id = data.namespaces['eip155']?.accounts[0]?.split(':')[2]
      updateAccount(id)
    });
    try {
      web3Modal.closeModal();
    } catch(e){
      console.log(e);
    }
}

function updateAccount(account: string | undefined) {
    console.log("account",account)
    const lower = account?.toLowerCase()
    const existing = Cookie.get('account')
    if (lower !== existing) {
      if (lower !== undefined) {
        Cookie.set("is_walletconnect","true")
        Cookie.set('account', lower)
      } else {
        Cookie.remove('account')
      }
      location.reload()
    }
  }


export async function initWalletConnect() {
   
    const signClient = await SignClient.init({
        projectId: "3a6ff9424d51410662045d2567fc9849",
    }) 

    const connectwalletButton = document.querySelector<HTMLButtonElement>(
        '#connect-with-wallet-connect'
    )
    const disconnectwalletButton = document.querySelector<HTMLButtonElement>(
        '#disconnect-wallet-connect'
    )

    if(disconnectwalletButton){
        disconnectwalletButton.addEventListener('click', () => {
        Cookie.remove('is_walletconnect')
        Cookie.remove('account')
        location.reload()
        })
    }
    if (connectwalletButton){
        Cookie.set("is_walletconnect","true")
        connectwalletButton.addEventListener('click', () => {
            handleConnect(signClient, connectwalletButton)
        })
    }

}