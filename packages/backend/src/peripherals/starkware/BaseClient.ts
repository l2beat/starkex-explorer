import { assertUnreachable } from '@explorer/shared'
import { Agent } from 'https'
import { RequestInit } from 'node-fetch'

import { ClientAuth } from '../../config/starkex/StarkexConfig'

export abstract class BaseClient {
  protected requestInit: RequestInit

  constructor(auth: ClientAuth) {
    this.requestInit = this.getRequestInit(auth)
  }

  private getRequestInit(auth: ClientAuth): RequestInit {
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
