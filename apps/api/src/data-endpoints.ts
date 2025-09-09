import { FastifyInstance } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';

export async function registerDataEndpoints(app: FastifyInstance) {
  const dataPath = path.join(process.cwd(), 'extracted-data');

  // Endpoint para obtener datos financieros
  app.get('/api/v1/data/financial', async (request, reply) => {
    try {
      const filePath = path.join(dataPath, 'dashboard-data.json');
      
      if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ error: 'Datos financieros no disponibles aún' });
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Endpoint para obtener datos DAES
  app.get('/api/v1/data/daes', async (request, reply) => {
    try {
      const filePath = path.join(dataPath, 'final-results.json');
      
      if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ error: 'Datos DAES no disponibles aún' });
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data.DecodedData?.DAESData || [];
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Endpoint para obtener datos binarios
  app.get('/api/v1/data/binary', async (request, reply) => {
    try {
      const filePath = path.join(dataPath, 'final-results.json');
      
      if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ error: 'Datos binarios no disponibles aún' });
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data.DecodedData?.BinaryData || [];
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Endpoint para obtener progreso del escaneo
  app.get('/api/v1/data/progress', async (request, reply) => {
    try {
      const filePath = path.join(dataPath, 'final-results.json');
      
      if (!fs.existsSync(filePath)) {
        // Buscar archivos de bloques intermedios para calcular progreso
        const blockFiles = fs.readdirSync(dataPath).filter(file => file.startsWith('block-') && file.endsWith('-data.json'));
        
        if (blockFiles.length === 0) {
          return { percentage: 0, status: 'Iniciando escaneo...' };
        }

        const latestBlock = Math.max(...blockFiles.map(file => {
          const match = file.match(/block-(\d+)-data\.json/);
          return match ? parseInt(match[1]) : 0;
        }));

        return { 
          percentage: Math.min((latestBlock / 1000) * 100, 99), // Asumiendo ~1000 bloques para 800GB
          status: `Procesando bloque ${latestBlock}...`,
          processedBlocks: latestBlock
        };
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { 
        percentage: 100, 
        status: 'Escaneo completado',
        processedBlocks: data.ScanInfo?.ProcessedBlocks || 0,
        totalTime: data.ScanInfo?.TotalTime || 0
      };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Endpoint para obtener resumen de datos
  app.get('/api/v1/data/summary', async (request, reply) => {
    try {
      const filePath = path.join(dataPath, 'final-results.json');
      
      if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ error: 'Resumen no disponible aún' });
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      return {
        scanInfo: data.ScanInfo,
        totals: data.Totals,
        statistics: {
          balances: data.FinancialData?.Balances?.length || 0,
          transactions: data.FinancialData?.Transactions?.length || 0,
          accounts: data.FinancialData?.Accounts?.length || 0,
          creditCards: data.FinancialData?.CreditCards?.length || 0,
          users: data.FinancialData?.Users?.length || 0,
          daesData: data.DecodedData?.DAESData?.length || 0,
          binaryData: data.DecodedData?.BinaryData?.length || 0
        }
      };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Endpoint para obtener datos específicos por tipo
  app.get('/api/v1/data/:type', async (request: any, reply) => {
    try {
      const { type } = request.params;
      const filePath = path.join(dataPath, 'final-results.json');
      
      if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ error: 'Datos no disponibles aún' });
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      switch (type) {
        case 'balances':
          return data.FinancialData?.Balances || [];
        case 'transactions':
          return data.FinancialData?.Transactions || [];
        case 'accounts':
          return data.FinancialData?.Accounts || [];
        case 'creditcards':
          return data.FinancialData?.CreditCards || [];
        case 'users':
          return data.FinancialData?.Users || [];
        case 'daes':
          return data.DecodedData?.DAESData || [];
        case 'binary':
          return data.DecodedData?.BinaryData || [];
        default:
          return reply.code(400).send({ error: 'Tipo de datos no válido' });
      }
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Endpoint para crear transacciones usando datos extraídos
  app.post('/api/v1/data/create-transaction', async (request: any, reply) => {
    try {
      const { fromAccount, toAccount, amount, currency, description } = request.body;
      
      // Validar que los datos existen en los datos extraídos
      const filePath = path.join(dataPath, 'final-results.json');
      
      if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ error: 'Datos no disponibles para crear transacciones' });
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Verificar que las cuentas existen
      const accounts = data.FinancialData?.Accounts || [];
      const fromAccountExists = accounts.some((acc: any) => acc.AccountNumber === fromAccount);
      const toAccountExists = accounts.some((acc: any) => acc.AccountNumber === toAccount);
      
      if (!fromAccountExists || !toAccountExists) {
        return reply.code(400).send({ error: 'Una o ambas cuentas no existen en los datos extraídos' });
      }

      // Crear la transacción
      const transaction = {
        id: `TXN-${Date.now()}`,
        fromAccount,
        toAccount,
        amount: parseFloat(amount),
        currency: currency || 'EUR',
        description: description || 'Transacción creada desde datos DTC1B',
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      // Aquí podrías guardar la transacción en la base de datos
      // Por ahora, solo la devolvemos
      
      return {
        success: true,
        transaction,
        message: 'Transacción creada exitosamente usando datos DTC1B'
      };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Endpoint para obtener balances por cuenta
  app.get('/api/v1/data/balances/:accountNumber', async (request: any, reply) => {
    try {
      const { accountNumber } = request.params;
      const filePath = path.join(dataPath, 'final-results.json');
      
      if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ error: 'Datos no disponibles aún' });
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const balances = data.FinancialData?.Balances || [];
      
      // Buscar balances relacionados con la cuenta
      const accountBalances = balances.filter((balance: any) => {
        // Aquí podrías implementar lógica más sofisticada para relacionar balances con cuentas
        return true; // Por ahora, devolvemos todos los balances
      });

      return {
        accountNumber,
        balances: accountBalances,
        totalEUR: accountBalances.filter((b: any) => b.Currency === 'EUR').reduce((sum: number, b: any) => sum + b.Balance, 0),
        totalUSD: accountBalances.filter((b: any) => b.Currency === 'USD').reduce((sum: number, b: any) => sum + b.Balance, 0),
        totalGBP: accountBalances.filter((b: any) => b.Currency === 'GBP').reduce((sum: number, b: any) => sum + b.Balance, 0)
      };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });
}
