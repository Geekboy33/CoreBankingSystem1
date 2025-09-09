import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Leer datos en tiempo real del archivo JSON generado por el script
    const dataPath = path.join(process.cwd(), '..', '..', 'extracted-data', 'real-ethereum-realtime.json');
    
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json({
        error: 'No hay datos en tiempo real disponibles',
        timestamp: new Date().toISOString(),
        mode: 'REAL_ETHEREUM_BLOCKCHAIN',
        scanId: 'NO_DATA',
        progress: {
          currentBlock: 0,
          totalBlocks: 0,
          percentage: 0,
          elapsedMinutes: 0,
          estimatedRemaining: 0
        },
        balances: {
          EUR: 0,
          USD: 0,
          GBP: 0,
          ETH: 0,
          BTC: 0
        },
        performance: {
          averageSpeedMBps: 0,
          memoryUsageMB: 0,
          bytesProcessed: 0,
          blocksProcessed: 0,
          dataExtracted: 0,
          ethereumConversions: 0,
          ethereumTransactions: 0,
          apiCalls: 0
        },
        statistics: {
          balancesFound: 0,
          transactionsFound: 0,
          accountsFound: 0,
          creditCardsFound: 0,
          usersFound: 0,
          daesDataFound: 0,
          ethereumWalletsFound: 0,
          ethereumTransactionsFound: 0
        },
        recentData: {
          balances: [],
          transactions: [],
          accounts: [],
          creditCards: [],
          users: [],
          ethereumWallets: [],
          ethereumTransactions: []
        }
      });
    }

    const fileContent = fs.readFileSync(dataPath, 'utf8');
    let data;
    try {
      data = JSON.parse(fileContent);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      // Crear datos por defecto si hay error de parsing
      data = {
        timestamp: new Date().toISOString(),
        scanId: 'NO_DATA',
        mode: 'REAL_ETHEREUM_BLOCKCHAIN',
        progress: {
          currentBlock: 0,
          totalBlocks: 0,
          percentage: 0,
          elapsedMinutes: 0,
          estimatedRemaining: 0
        },
        balances: {
          EUR: 0,
          USD: 0,
          GBP: 0,
          ETH: 0,
          BTC: 0
        },
        performance: {
          averageSpeedMBps: 0,
          memoryUsageMB: 0,
          bytesProcessed: 0,
          blocksProcessed: 0,
          dataExtracted: 0,
          ethereumConversions: 0,
          ethereumTransactions: 0,
          apiCalls: 0
        },
        statistics: {
          balancesFound: 0,
          transactionsFound: 0,
          accountsFound: 0,
          creditCardsFound: 0,
          usersFound: 0,
          daesDataFound: 0,
          ethereumWalletsFound: 0,
          ethereumTransactionsFound: 0
        },
        recentData: {
          balances: [],
          transactions: [],
          accounts: [],
          creditCards: [],
          users: [],
          ethereumWallets: [],
          ethereumTransactions: []
        }
      };
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading real-time data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
