
export async function initPopup() {
  const popup = document.getElementsByClassName('popup')
  const globalConnectButton = document.querySelector<HTMLButtonElement>(
      '#connect-with-global-button'
    )
    const popupCloseBtn = document.querySelector<HTMLButtonElement>(
        '#close-popup'
    )

    if(popupCloseBtn){
      popupCloseBtn.addEventListener('click',()=>{
        popup?.item(0)?.setAttribute('hidden','true')
      })
    }
  
  
    if(globalConnectButton){
      globalConnectButton.addEventListener('click',()=>{
        popup?.item(0)?.removeAttribute('hidden')
        
      })
    }    
}