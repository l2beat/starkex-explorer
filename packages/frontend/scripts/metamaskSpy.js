/*
  This file contains a scripts that can be injected inside console of the browser where Metamask is installed.
  These scripts help to debug Metamask.
*/

const oldRequest = window.ethereum.request
window.ethereum.request = function (...args) {
  console.log('[REQUEST] args', args)
  return Promise.resolve(oldRequest.apply(this, args)).then((value) => {
    console.log('[REQUEST] result', value)
    return value
  })
}

const oldSend = window.ethereum.send
window.ethereum.send = function (...args) {
  console.log('[SEND] args', args)
  return Promise.resolve(
    oldSend.apply(this, args).then((value) => {
      console.log('[SEND] result', value)
      return value
    })
  )
}

const oldSendAsync = window.ethereum.sendAsync
window.ethereum.sendAsync = function (...args) {
  console.log('[SEND ASYNC] args', args)
  return Promise.resolve(oldSendAsync.apply(this, args)).then((value) => {
    console.log('[SEND ASYNC] result', value)
    return value
  })
}
