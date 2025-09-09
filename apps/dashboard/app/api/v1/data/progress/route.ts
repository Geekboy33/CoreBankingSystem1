import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Buscar archivos de progreso en diferentes ubicaciones
    const possiblePaths = [
      path.join(process.cwd(), '..', '..', 'extracted-data', 'scan-progress.json'),
      path.join(process.cwd(), '..', '..', 'extracted-data', 'complete-total-balances-scan.json'),
      path.join(process.cwd(), '..', '..', 'dtc1b-scan-results.json'),
      path.join(process.cwd(), '..', '..', 'dtc1b-robust-scan-results.json')
    ];

    for (const scanDataPath of possiblePaths) {
      if (fs.existsSync(scanDataPath)) {
        try {
          const rawData = fs.readFileSync(scanDataPath, 'utf8');
          
          // Limpiar datos más agresivamente
          const cleanData = rawData
            .replace(/^\uFEFF/, '') // Remover BOM
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remover caracteres de control
            .replace(/\r\n/g, '\n') // Normalizar saltos de línea
            .replace(/\r/g, '\n') // Normalizar saltos de línea
            .trim();
          
          // Verificar que el archivo no esté vacío después de la limpieza
          if (cleanData.length === 0) {
            console.log(`Archivo vacío después de limpieza: ${scanDataPath}`);
            continue;
          }
          
          const data = JSON.parse(cleanData);
          
          // Extraer información de progreso del archivo
          const progress = {
            scanId: data.scanId || 'UNKNOWN_SCAN',
            mode: data.mode || 'UNKNOWN_MODE',
            progress: data.progress || {
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
            balances: data.balances || {
              EUR: 0,
              USD: 0,
              GBP: 0,
              BTC: 0,
              ETH: 0
            },
            statistics: data.statistics || {
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
            timestamp: data.timestamp || new Date().toISOString(),
            status: 'active'
          };

          return NextResponse.json(progress);
        } catch (error) {
          console.error(`Error parsing file ${scanDataPath}:`, error);
          console.error(`File size: ${fs.statSync(scanDataPath).size} bytes`);
          console.error(`First 100 chars: ${fs.readFileSync(scanDataPath, 'utf8').substring(0, 100)}`);
          continue;
        }
      }
    }

    // Datos por defecto si no se encuentra ningún archivo
    const defaultProgress = {
      scanId: 'NO_SCAN_ACTIVE',
      mode: 'IDLE',
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
      timestamp: new Date().toISOString(),
      status: 'idle'
    };

    return NextResponse.json(defaultProgress);

  } catch (error) {
    console.error('Error in progress API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
