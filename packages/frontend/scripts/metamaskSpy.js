/*
  This file contains a scripts that can be injected inside console of the browser where Metamask is installed.
  These scripts help to debug Metamask.
*/

const oldRequest = window.ethereum.request
window.ethereum.request = function (...args) {
  console.log('request.args', args)
  return Promise.resolve(oldRequest.apply(this, args)).then((value) => {
    console.log('request.result', value)
    return value
  })
}

// TODO: add send, sendAsync support for dYdX
