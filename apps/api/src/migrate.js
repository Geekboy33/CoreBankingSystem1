import { pool } from './db.js';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  const dir = path.join(process.cwd(), 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log('Applying', f);
    await pool.query(sql);
  }
  await pool.end();
  console.log('Migrations applied');
}
run().catch((e) => { console.error(e); process.exit(1); });
