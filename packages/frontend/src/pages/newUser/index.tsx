import React from 'react'

import { reactToHtml } from '../reactToHtml'
import { User } from './User'
import { UserProps } from './UserProps'

export * from './UserProps'

export function renderUserPage(props: UserProps) {
  return reactToHtml(<User {...props} />)
}
