import React from "react";

import { ContentWrapper } from "../../components/page/ContentWrapper";
import { Page } from "../../components/page/Page";
import { WithdrawalPageProps } from "./common";

interface PerpetualWithdrawalPageProps extends WithdrawalPageProps {
  positionId: string
}

export function WithdrawalPage(props: PerpetualWithdrawalPageProps) {
  return(
    <Page user={props.user} path="TODO: path" description="TODO: description">
        <ContentWrapper className="flex flex-col gap-12">
            
        </ContentWrapper>
    </Page>
  )
}
