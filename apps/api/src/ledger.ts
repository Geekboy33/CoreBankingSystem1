import Decimal from 'decimal.js';
import { withTx, pool } from './db';

export interface TransferInput {
  from_account_id: string;
  to_account_id: string;
  amount: string;   // decimal como string
  currency: string;
  reference?: string;
  as_of?: string;
  idempotency_key?: string;
}

export async function postTransfer(input: TransferInput) {
  const { from_account_id, to_account_id, amount, currency, reference, as_of, idempotency_key } = input;
  if (!from_account_id || !to_account_id || !amount || !currency) throw new Error('Missing required fields');
  if (from_account_id === to_account_id) throw new Error('from and to must differ');
  const amt = new Decimal(amount);
  if (amt.lte(0)) throw new Error('amount must be > 0');

  return await withTx(async (c) => {
    if (idempotency_key) {
      const idem = await c.query('select journal_id from idempotency_keys where key=$1 for update', [idempotency_key]);
      if (idem.rowCount && idem.rowCount > 0) return { status: 'duplicate', journal_id: idem.rows[0].journal_id };
    }

    await c.query(`insert into accounts(id, currency) values ($1,$2) on conflict (id) do nothing`, [from_account_id, currency]);
    await c.query(`insert into accounts(id, currency) values ($1,$2) on conflict (id) do nothing`, [to_account_id, currency]);

    const ts = as_of ? new Date(as_of) : new Date();
    const j = await c.query(`insert into journals (reference, as_of) values ($1,$2) returning id`, [reference || null, ts.toISOString()]);
    const journal_id = j.rows[0].id;

    // double-entry: debit to_account, credit from_account
    await c.query(
      `insert into ledger_entries (journal_id, account_id, currency, amount, side) values
       ($1,$2,$3,$4,'debit'), ($1,$5,$3,$6,'credit')`,
      [journal_id, to_account_id, currency, amt.toString(), from_account_id, amt.toString()]
    );

    if (idempotency_key) {
      await c.query('insert into idempotency_keys(key, journal_id) values ($1,$2) on conflict do nothing', [idempotency_key, journal_id]);
    }

    return { status: 'posted', journal_id };
  });
}

export async function getBalances() {
  const res = await pool.query(`
    select account_id, currency,
           sum(case when side='debit' then amount else -amount end)::text as balance
    from ledger_entries
    group by account_id, currency
    order by account_id
  `);
  return res.rows;
}
