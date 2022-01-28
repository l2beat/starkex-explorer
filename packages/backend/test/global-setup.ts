import waitForExpect from 'wait-for-expect'

export const mochaHooks = {
  beforeAll(this: Mocha.Context) {
    // We set this to ensure waitForExpect timeout is shorter than Mocha timeout
    // and we get proper errors from our assertions instead of Mocha timeout errors.
    waitForExpect.defaults.timeout = this.timeout() - 500
  },
}
