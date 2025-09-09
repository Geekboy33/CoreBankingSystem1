create table if not exists accounts (
  id text primary key,
  currency text not null,
  name text,
  created_at timestamptz default now()
);

create table if not exists journals (
  id bigserial primary key,
  reference text,
  as_of timestamptz not null default now(),
  created_at timestamptz default now()
);

create table if not exists ledger_entries (
  id bigserial primary key,
  journal_id bigint references journals(id) on delete cascade,
  account_id text references accounts(id),
  currency text not null,
  amount numeric(38, 10) not null,
  side text check (side in ('debit','credit')) not null,
  created_at timestamptz default now()
);

create table if not exists idempotency_keys (
  key text primary key,
  journal_id bigint references journals(id),
  created_at timestamptz default now()
);

create schema if not exists staging;
create table if not exists staging.accounts_raw (
  account_id text,
  bic text,
  discovered_at timestamptz,
  source text
);
create table if not exists staging.transactions_raw (
  id text,
  from_account text,
  to_account text,
  amount numeric(38,10),
  currency text,
  timestamp timestamptz,
  status text,
  type text,
  source text
);
