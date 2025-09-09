import fs from 'node:fs';
import path from 'node:path';
import { bestDecode } from './decoder.js';
import { REGEX } from './patterns.js';

const INPUT_PATH = process.env.INPUT_PATH || 'E:/dtc1b';
const OUTPUT_DIR = process.env.OUTPUT_DIR || 'E:/outputs/ingest';
const CHUNK_SIZE = Number(process.env.CHUNK_SIZE || 64 * 1024 * 1024);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const outAccounts = path.join(OUTPUT_DIR, 'accounts.ndjson');
const outTx = path.join(OUTPUT_DIR, 'transactions.ndjson');
const outLog = path.join(OUTPUT_DIR, 'ingest.log');

const log = (msg: string) => fs.appendFileSync(outLog, `[${new Date().toISOString()}] ${msg}\n`);

function* slidingWindow(lines: string[], size = 5) {
  for (let i = 0; i < lines.length; i++) {
    const slice = lines.slice(Math.max(0, i - size), i + size + 1);
    yield { i, ctx: slice.join(' ') };
  }
}

function parseContext(ctx: string) {
  const ibans = new Set((ctx.match(REGEX.IBAN) || []).map((s) => s.trim()));
  const bics = new Set((ctx.match(REGEX.BIC) || []).map((s) => s.trim()));
  const dates = new Set((ctx.match(REGEX.DATE) || []).map((s) => s.trim()));
  const amounts = (ctx.match(REGEX.AMOUNT) || []).map((s) => s.replace(/\./g, '').replace(',', '.'));
  return { ibans: [...ibans], bics: [...bics], dates: [...dates], amounts };
}

function writeNDJSON(file: string, obj: unknown) {
  fs.appendFileSync(file, JSON.stringify(obj) + '\n');
}

async function ingestFile(filePath: string) {
  log(`Start ingest: ${filePath}`);
  const stat = fs.statSync(filePath);
  const stream = fs.createReadStream(filePath, { highWaterMark: CHUNK_SIZE });
  let tail = '';
  let chunkIndex = 0;

  for await (const chunk of stream) {
    chunkIndex++;
    const { text, encoding } = bestDecode(chunk as Buffer);
    const current = tail + text;
    const parts = current.split(/\r?\n|\0|\u0001|\u0002/g);
    tail = parts.pop() || '';
    const lines = parts.map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);

    for (const { ctx } of slidingWindow(lines, 2)) {
      const hit = parseContext(ctx);
      if (hit.ibans.length && hit.amounts.length) {
        const amount = Number(hit.amounts[0]);
        const when = hit.dates[0] || new Date().toISOString();
        for (const acc of hit.ibans) {
          writeNDJSON(outAccounts, { accountId: acc, bic: hit.bics[0] || null, discoveredAt: new Date().toISOString(), source: path.basename(filePath), encoding });
        }
        if (hit.ibans.length >= 2) {
          writeNDJSON(outTx, {
            id: `${path.basename(filePath)}:${chunkIndex}:${Math.random().toString(36).slice(2, 10)}`,
            fromAccount: hit.ibans[0], toAccount: hit.ibans[1], amount, currency: 'UNKNOWN',
            description: 'auto-extracted', timestamp: when, status: 'completed', type: 'transfer',
            source: path.basename(filePath), encoding
          });
        }
      }
    }
    if (chunkIndex % 10 === 0) log(`chunk #${chunkIndex}/${Math.ceil(stat.size / CHUNK_SIZE)}`);
  }

  if (tail.trim().length > 0) {
    const hit = parseContext(tail);
    if (hit.ibans.length) for (const acc of hit.ibans) writeNDJSON(outAccounts, { accountId: acc, discoveredAt: new Date().toISOString(), source: path.basename(filePath) });
  }
  log(`Done ingest: ${filePath}`);
}

(async () => {
  const src = INPUT_PATH;
  const files = fs.statSync(src).isDirectory()
    ? fs.readdirSync(src).map(f => path.join(src, f)).filter(f => fs.statSync(f).isFile())
    : [src];

  for (const f of files) await ingestFile(f);

  const toCsv = (arr: any[], cols: string[]) => {
    const lines = [cols.join(',')];
    for (const obj of arr) lines.push(cols.map(c => (obj[c] ?? '')).join(','));
    return lines.join('\n');
  };

  const ndA = fs.existsSync(outAccounts) ? fs.readFileSync(outAccounts, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  const ndT = fs.existsSync(outTx) ? fs.readFileSync(outTx, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];

  fs.writeFileSync(path.join(OUTPUT_DIR, 'accounts.csv'), toCsv([...new Map(ndA.map((a: any) => [a.accountId, a])).values()], ['accountId','bic','discoveredAt','source']));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'transactions.csv'), toCsv(ndT, ['id','fromAccount','toAccount','amount','currency','timestamp','status','type','source']));

  // Persistir a Postgres (opcional si DB_* definidos)
  const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env as any;
  if (DB_HOST) {
    const { Client } = await import('pg');
    const client = new Client({ host: DB_HOST, port: Number(DB_PORT || 5432), user: DB_USER || 'core', password: DB_PASS || 'corepass', database: DB_NAME || 'corebank' });
    await client.connect();
    for (const a of ndA) {
      await client.query('insert into staging.accounts_raw(account_id,bic,discovered_at,source) values ($1,$2,$3,$4) on conflict do nothing',
        [a.accountId, a.bic || null, a.discoveredAt || new Date().toISOString(), a.source || null]);
    }
    for (const t of ndT) {
      await client.query('insert into staging.transactions_raw(id,from_account,to_account,amount,currency,timestamp,status,type,source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict do nothing',
        [t.id, t.fromAccount, t.toAccount, t.amount, t.currency || null, t.timestamp || new Date().toISOString(), t.status || null, t.type || null, t.source || null]);
    }
    await client.end();
    log('Persisted to Postgres staging.*');
  }

  log('Artifacts ready: accounts.ndjson, transactions.ndjson, accounts.csv, transactions.csv');
})();
