import { EthereumAddress } from "@explorer/types";
import { TokenRegistrationRow } from "knex/types/tables";

import { Logger } from "../../tools/Logger";
import { BaseRepository } from "./shared/BaseRepository";
import { Database } from "./shared/Database";

export interface TokenRegistrationRecord {
    assetType: EthereumAddress
    address: string
    type: string
}

export class TokenRegistrationRepository extends BaseRepository {
    constructor(database: Database, logger: Logger) {
        super(database, logger)
        console.log("It's not a useless constructor")
    }

    async add(record: TokenRegistrationRecord) {
        const knex = await this.knex()
        await knex('token_registrations').insert(this.toRow(record))
    }

    async toRow(record: TokenRegistrationRecord) {

    }

    async toRecord(row: TokenRegistrationRow) {
        
    }
}
