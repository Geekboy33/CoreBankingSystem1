import { pool, withTx } from './db.js';
import Decimal from 'decimal.js';

async function upsertAccountsFromStaging(limit = 100000) {
  const res = await pool.query(`select distinct account_id from staging.accounts_raw where account_id is not null limit $1`, [limit]);
  for (const r of res.rows) {
    await pool.query(`insert into accounts(id, currency) values ($1,'EUR') on conflict (id) do nothing`, [r.account_id]);
  }
  return res.rowCount;
}

async function promoteTransactions(limit = 1000) {
  const { rows } = await pool.query(`
    select id, from_account, to_account, amount, coalesce(nullif(currency,''),'EUR') as currency, timestamp, status, type, source
    from staging.transactions_raw
    where processed_at is null
    order by timestamp nulls last
    limit $1
  `, [limit]);

  let posted = 0;
  for (const t of rows) {
    const amount = new Decimal(t.amount || 0);
    if (amount.lte(0) || !t.from_account || !t.to_account) {
      await pool.query('update staging.transactions_raw set processed_at = now() where id=$1', [t.id]);
      continue;
    }
    await withTx(async (c) => {
      await c.query(`insert into accounts(id,currency) values ($1,$2) on conflict (id) do nothing`, [t.from_account, t.currency]);
      await c.query(`insert into accounts(id,currency) values ($1,$2) on conflict (id) do nothing`, [t.to_account, t.currency]);

      const when = t.timestamp || new Date().toISOString();
      const j = await c.query(`insert into journals(reference, as_of) values ($1,$2) returning id`, [`ingest:${t.id}`, when]);
      const jid = j.rows[0].id;

      await c.query(`insert into ledger_entries (journal_id, account_id, currency, amount, side) values
        ($1,$2,$3,$4,'debit'), ($1,$5,$3,$6,'credit')`,
        [jid, t.to_account, t.currency, amount.toString(), t.from_account, amount.toString()]
      );

      await c.query('update staging.transactions_raw set processed_at = now() where id=$1', [t.id]);
      posted++;
    });
  }
  return posted;
}

export async function promoteAll(limitBatch = 1000) {
  const up = await upsertAccountsFromStaging();
  let total = 0;
  while (true) {
    const n = await promoteTransactions(limitBatch);
    total += n;
    if (n === 0) break;
  }
  return { accountsUpserted: up, transactionsPosted: total };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = Number(process.env.PROMOTE_BATCH || 1000);
  promoteAll(limit).then((r) => {
    console.log('Promoted:', r);
    process.exit(0);
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
