import { assertUnreachable } from '@explorer/shared'
import { Agent } from 'https'
import { RequestInit } from 'node-fetch'

import { GatewayAuth } from '../../config/starkex/StarkexConfig'

export abstract class GatewayClient {
  protected requestInit: RequestInit

  constructor(auth: GatewayAuth) {
    this.requestInit = this.getRequestInit(auth)
  }

  private getRequestInit(auth: GatewayAuth): RequestInit {
    switch (auth.type) {
      case 'certificates':
        return {
          agent: new Agent({
            ca: auth.serverCertificate,
            cert: auth.userCertificate,
            key: auth.userKey,
          }),
        }
      case 'bearerToken':
        return {
          headers: {
            Authorization: `Bearer ${auth.bearerToken}`,
          },
        }
      default:
        assertUnreachable(auth)
    }
  }
}
