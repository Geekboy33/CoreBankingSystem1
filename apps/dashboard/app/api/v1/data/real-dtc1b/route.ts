import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), '..', '..', 'extracted-data');
    const realData = {
      balances: [],
      transactions: [],
      accounts: [],
      timestamp: new Date().toISOString(),
      source: 'DTC1B_REAL_DATA'
    };

    // Leer archivos reales de DTC1B
    const files = [
      'complete-total-balances-scan.json',
      'dtc1b-scan-results.json',
      'dtc1b-robust-scan-results.json'
    ];

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const cleanContent = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
          const data = JSON.parse(cleanContent);
          
          // Extraer datos reales
          if (data.balances) {
            realData.balances.push(...data.balances);
          }
          if (data.transactions) {
            realData.transactions.push(...data.transactions);
          }
          if (data.accounts) {
            realData.accounts.push(...data.accounts);
          }
        } catch (error) {
          console.error(`Error reading ${file}:`, error);
        }
      }
    }

    return NextResponse.json(realData);
  } catch (error) {
    console.error('Error in real DTC1B data API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}




