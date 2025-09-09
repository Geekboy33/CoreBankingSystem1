create index if not exists idx_ledger_entries_account on ledger_entries(account_id);
create index if not exists idx_ledger_entries_currency on ledger_entries(currency);

alter table staging.transactions_raw add column if not exists processed_at timestamptz;
do $$ begin
  alter table staging.transactions_raw add constraint transactions_raw_pkey primary key (id);
exception when duplicate_table then null; end $$;

create index if not exists idx_staging_tx_unprocessed on staging.transactions_raw(processed_at) where processed_at is null;
