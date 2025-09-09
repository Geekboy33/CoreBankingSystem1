create table if not exists fx_rates (
  currency text primary key,
  rate_to_eur numeric(38,10) not null,
  updated_at timestamptz default now()
);
insert into fx_rates(currency, rate_to_eur) values ('EUR', 1) on conflict do nothing;
