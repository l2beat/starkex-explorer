import React from 'react'

import { Page } from '../common/page/Page';
import { AssetsTable } from './AssetsTable';
import { UserProps } from './UserProps';

export function User(props: UserProps) {
    return(
        <Page path='/newUser' description='User page' account={props.account}>
            <AssetsTable assets={props.assets} />
        </Page>
    )
}
