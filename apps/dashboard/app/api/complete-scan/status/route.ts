import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const scanDataPath = path.join(process.cwd(), '..', '..', 'extracted-data', 'complete-total-balances-scan.json');
    
    if (fs.existsSync(scanDataPath)) {
      try {
        const rawData = fs.readFileSync(scanDataPath, 'utf8');
        
        // Limpiar datos si hay caracteres inválidos o BOM
        const cleanData = rawData
          .replace(/^\uFEFF/, '') // Remover BOM
          .replace(/[\x00-\x1F\x7F]/g, '') // Remover caracteres de control
          .trim();
        
        const data = JSON.parse(cleanData);
        return NextResponse.json(data);
      } catch (error) {
        console.error('Error parsing complete scan data:', error);
        console.error('File path:', scanDataPath);
        console.error('Raw data preview:', fs.readFileSync(scanDataPath, 'utf8').substring(0, 200));
      }
    }

    // Crear datos por defecto para el escaneo completo
    const defaultData = {
      scanId: 'COMPLETE_SCAN_20250905',
      mode: 'COMPLETE_TOTAL_BALANCES_SCAN',
      progress: {
        currentBlock: 0,
        totalBlocks: 16384,
        percentage: 0,
        elapsedMinutes: 0,
        estimatedRemaining: 0,
        bytesProcessed: 0,
        totalBytes: 800 * 1024 * 1024 * 1024,
        averageSpeedMBps: 0,
        memoryUsageMB: 0
      },
      balances: {
        EUR: 0,
        USD: 0,
        GBP: 0,
        BTC: 0,
        ETH: 0
      },
      statistics: {
        balancesFound: 0,
        transactionsFound: 0,
        accountsFound: 0,
        creditCardsFound: 0,
        usersFound: 0,
        daesDataFound: 0,
        ethereumWalletsFound: 0,
        swiftCodesFound: 0,
        ssnsFound: 0
      },
      recentData: {
        balances: [],
        transactions: [],
        accounts: [],
        creditCards: [],
        users: [],
        ethereumWallets: []
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(defaultData);

  } catch (error) {
    console.error('Error in complete scan status API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

