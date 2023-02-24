import React from "react";

import { Link } from "../../../components/Link";
import { FORCED_TRANSACTION_INCLUDED } from "../common";

interface IncludedWithStateUpdateIdProps {
    stateUpdateId: number | undefined;
}

export function IncludedWithStateUpdateId(props: IncludedWithStateUpdateIdProps) {
  return <p>{FORCED_TRANSACTION_INCLUDED} {props.stateUpdateId && (
    <Link href={`/state-updates/${props.stateUpdateId}`}>
    #{props.stateUpdateId}
    </Link>
  )} ', you can now send a withdrawal transaction'</p>;
}
