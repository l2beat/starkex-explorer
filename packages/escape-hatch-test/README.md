# @explorer/escapetest

## Scripts

- `yarn test` - run tests

## Setup

Script to reset the explorer to a specific block number:
```sql
BEGIN;
    delete from blocks where number > ${blockNumber};
    delete from withdrawable_assets where block_number > ${blockNumber};
    delete from user_transactions where block_number > ${blockNumber};
    delete from transaction_status where block_number > ${blockNumber};
    delete from state_updates where block_number > ${blockNumber};
    delete from state_transitions where block_number > ${blockNumber};
    delete from preprocessed_user_statistics where block_number > ${blockNumber};
    delete from preprocessed_state_details where block_number > ${blockNumber};
    delete from sent_transactions where sent_transactions.mined_block_number > ${blockNumber} OR sent_transactions.mined_block_number IS NULL;
    update key_values SET value = ${blockNumber} where key = 'lastBlockNumberSynced';
    update key_values SET value = 'not-frozen' where key = 'freezeStatus';
COMMIT;
```