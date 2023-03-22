// Copy the code below and paste it into the console of the browser where Metamask is installed

const oldRequest = window.ethereum.request
window.ethereum.request = function (...args) {
  console.log('request.args', args)
  return Promise.resolve(oldRequest.apply(this, args)).then((value) => {
    console.log('request.result', value)
    return value
  })
}

// TODO: add send, sendAsync support for dYdX
