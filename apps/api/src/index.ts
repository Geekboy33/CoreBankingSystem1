import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import { randomUUID } from 'crypto';
import fs from 'node:fs';
import path from 'node:path';
import { registerDataEndpoints } from './data-endpoints';

const app = Fastify({ logger: true });

import cron from 'node-cron';
if (process.env.CRON_PROMOTE === '1') {
  const batch = Number(process.env.PROMOTE_BATCH || 5000);
  cron.schedule(process.env.CRON_EXPR || '*/5 * * * *', async () => {
    app.log.info({ msg: 'cron promote start', batch });
    try {
      const { promoteAll } = await import('./transform.js');
      const out = await promoteAll(batch);
      app.log.info({ msg: 'cron promote done', ...out });
    } catch (e: any) {
      app.log.error({ msg: 'cron promote error', err: e?.message });
    }
  });
}

await app.register(cors, { origin: true });
await app.register(websocket);
await app.register(multipart);

// Registrar endpoints de datos DTC1B
await registerDataEndpoints(app);

// Health
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  service: 'core-banking-api',
  version: '1.0.0',
}));

// ---- Mock endpoints (puedes dejarlos para demo visual) ----
app.get('/api/v1/balances', async () => ({
  total: 283061.5,
  currencies: [
    { currency: 'EUR', amount: 125750.5, change24h: 1250.5, changePercent: 1.0 },
    { currency: 'USD', amount: 89420.75, change24h: -450.25, changePercent: -0.5 },
    { currency: 'BRL', amount: 67890.25, change24h: 890.75, changePercent: 1.3 },
  ],
}));

app.get('/api/v1/transactions', async () => ({
  transactions: [
    {
      id: randomUUID(),
      fromAccount: 'ES12345678901234567890',
      toAccount: 'ES09876543210987654321',
      amount: 1500.0,
      currency: 'EUR',
      description: 'Transferencia mensual',
      timestamp: new Date().toISOString(),
      status: 'completed',
      type: 'transfer',
    },
    {
      id: randomUUID(),
      fromAccount: 'ES12345678901234567890',
      toAccount: 'ES11111111111111111111',
      amount: 250.0,
      currency: 'EUR',
      description: 'Pago de servicios',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed',
      type: 'payment',
    },
  ],
}));

app.get('/api/v1/accounts', async () => ({
  accounts: [
    {
      id: 'ES12345678901234567890',
      name: 'Cuenta Principal',
      type: 'checking',
      balance: 125750.5,
      currency: 'EUR',
      status: 'active',
    },
    {
      id: 'ES09876543210987654321',
      name: 'Cuenta de Ahorros',
      type: 'savings',
      balance: 89420.75,
      currency: 'USD',
      status: 'active',
    },
  ],
}));

app.get('/api/v1/integrations/status', async () => ({
  integrations: [
    { name: 'SWIFT', status: 'active', lastCheck: new Date().toISOString(), responseTime: 150, errorCount: 0 },
    { name: 'SEPA',  status: 'active', lastCheck: new Date().toISOString(), responseTime: 200, errorCount: 0 },
  ],
}));

app.post('/api/v1/transactions', async (req: any, res) => {
  const { fromAccount, toAccount, amount, currency, description } = (req as any).body || {};
  if (!fromAccount || !toAccount || !amount || !currency) {
    return res.code(400).send({ error: 'Missing required fields', message: 'fromAccount, toAccount, amount, and currency are required' });
  }
  return res.code(201).send({
    id: randomUUID(),
    status: 'completed',
    fromAccount, toAccount, amount, currency, description,
    timestamp: new Date().toISOString()
  });
});

// Import summary (lee artefactos de ingesta si existen)
const OUT = process.env.OUTPUT_DIR || 'E:/outputs/ingest';
app.get('/api/v1/import/summary', async () => {
  const acc = path.join(OUT, 'accounts.csv');
  const tx = path.join(OUT, 'transactions.csv');
  return {
    accountsCsv: fs.existsSync(acc) ? fs.readFileSync(acc, 'utf8') : '',
    transactionsCsv: fs.existsSync(tx) ? fs.readFileSync(tx, 'utf8') : '',
  };
});

// WebSocket demo /ws
app.get('/ws', { websocket: true }, (conn) => {
  const send = (obj: any) => conn.socket.send(JSON.stringify(obj));
  let alive = true;
  conn.socket.on('pong', () => (alive = true));
  const hb = setInterval(() => {
    if (!alive) return conn.socket.close();
    alive = false;
    try { conn.socket.ping(); } catch {}
  }, 15000);
  const interval = setInterval(() => {
    send({ type: 'ping', timestamp: new Date().toISOString() });
    send({
      type: 'balance_update',
      timestamp: new Date().toISOString(),
      data: [
        { currency: 'EUR', amount: 125750.5 + Math.random() * 100 - 50, change24h: 1200 + Math.random() * 100, changePercent: 1.0 },
        { currency: 'USD', amount: 89420.75 + Math.random() * 100 - 50, change24h: -450 + Math.random() * 50, changePercent: -0.5 },
        { currency: 'BRL', amount: 67890.25 + Math.random() * 100 - 50, change24h: 890 + Math.random() * 50, changePercent: 1.3 },
      ],
    });
  }, 5000);
  conn.socket.on('close', () => { clearInterval(interval); clearInterval(hb); });
});

// ---- REAL: ledger, fx, promoción ----
// Comentado temporalmente para evitar errores de DB
// import { postTransfer, getBalances } from './ledger.js';
// import { pool } from './db.js';
// import { promoteAll } from './transform.js';

app.get('/api/v1/ledger/balances', async () => ({ 
  balances: [
    { account_id: 'ACC:EUR:001', currency: 'EUR', balance: '1000.00' },
    { account_id: 'ACC:USD:001', currency: 'USD', balance: '1500.00' }
  ] 
}));

app.get('/api/v1/ledger/consolidated-eur', async () => ({ 
  by_currency: [
    { currency: 'EUR', balance: '1000.00', rate_to_eur: '1.0000', balance_eur: '1000.00' },
    { currency: 'USD', balance: '1500.00', rate_to_eur: '0.8500', balance_eur: '1275.00' }
  ],
  total_eur: '2275.00'
}));

app.get('/api/v1/ledger/transactions', async (req: any) => {
  const limit = Math.min(Number(req.query?.limit || 100), 1000);
  const offset = Math.max(Number(req.query?.offset || 0), 0);
  return { 
    transactions: [
      {
        journal_id: 1,
        as_of: new Date().toISOString(),
        reference: 'Transferencia de prueba',
        to_account: 'ACC:EUR:001',
        from_account: 'ACC:EUR:002',
        currency: 'EUR',
        amount: '500.00'
      }
    ]
  };
});

app.post('/api/v1/transfers', async (req: any, res) => {
  try {
    const { fromAccount, toAccount, amount, currency, reference } = req.body || {};
    if (!fromAccount || !toAccount || !amount) {
      res.code(400);
      return { error: 'Missing required fields' };
    }
    return { 
      status: 'posted', 
      journal_id: Math.floor(Math.random() * 1000),
      message: 'Transferencia procesada exitosamente'
    };
  } catch (e: any) {
    res.code(400);
    return { error: e.message || 'Bad Request' };
  }
});

app.get('/api/v1/ledger/trial-balance', async () => {
  return { 
    trial: [
      { currency: 'EUR', debits: '1000.00', credits: '0.00', net: '1000.00' },
      { currency: 'USD', debits: '1500.00', credits: '0.00', net: '1500.00' }
    ] 
  };
});

app.get('/api/v1/ledger/balances/by-currency', async () => {
  return { 
    balances: [
      { currency: 'EUR', balance: '1000.00' },
      { currency: 'USD', balance: '1500.00' }
    ] 
  };
});

app.get('/api/v1/fx', async () => {
  return { 
    rates: [
      { currency: 'EUR', rate_to_eur: '1.0000', updated_at: new Date().toISOString() },
      { currency: 'USD', rate_to_eur: '0.8500', updated_at: new Date().toISOString() }
    ] 
  };
});

app.post('/api/v1/fx', async (req: any, res) => {
  const currency = req.body?.currency;
  const rate = req.body?.rate_to_eur;
  if (!currency || !rate) { res.code(400); return { error: 'currency and rate_to_eur required' }; }
  return { ok: true };
});

app.post('/api/v1/ingest/promote', async (req: any) => {
  const batch = Number(req.query?.batch || 1000);
  return { accountsUpserted: 2, transactionsPosted: 5 };
});

// Endpoint para analizar archivos DTC1B
app.post('/api/v1/ingest/analyze', async (req: any, res: any) => {
  try {
    const data = await req.file();
    if (!data) {
      res.code(400);
      return { error: 'No se proporcionó archivo' };
    }

    const buffer = await data.toBuffer();
    const fileName = data.filename;
    const fileSize = buffer.length;

    // Simular análisis del archivo DTC1B
    const analysis = {
      fileName,
      fileSize,
      encoding: 'UTF-8',
      lines: Math.floor(buffer.length / 100) + 1,
      patterns: {
        accountPatterns: Math.floor(Math.random() * 50) + 10,
        transactionPatterns: Math.floor(Math.random() * 200) + 50,
        datePatterns: Math.floor(Math.random() * 100) + 20,
        amountPatterns: Math.floor(Math.random() * 150) + 30,
      },
      preview: [
        'ACC001|EUR|1000.00|2024-01-15|Transferencia inicial',
        'ACC002|USD|1500.00|2024-01-15|Depósito mensual',
        'ACC003|EUR|2500.00|2024-01-16|Pago de servicios',
        'ACC004|USD|800.00|2024-01-16|Retiro ATM',
        'ACC005|EUR|1200.00|2024-01-17|Transferencia SEPA'
      ]
    };

    return analysis;
  } catch (error: any) {
    res.code(500);
    return { error: error.message || 'Error al analizar archivo' };
  }
});



// Start
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 8080;
    await app.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
