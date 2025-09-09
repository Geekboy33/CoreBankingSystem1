import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ModuleSwap {
  id: string;
  moduleId: string;
  moduleName: string;
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  exchangeRate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: string;
  walletAddress: string;
}

export async function GET() {
  try {
    const swapsPath = path.join(process.cwd(), '..', '..', 'extracted-data', 'module-swaps.json');
    
    if (!fs.existsSync(swapsPath)) {
      // Crear datos por defecto
      const defaultSwaps: ModuleSwap[] = [
        {
          id: 'module_swap_001',
          moduleId: 'module_balances_eur',
          moduleName: 'Balances EUR',
          fromAmount: 100.0,
          fromCurrency: 'EUR',
          toAmount: 0.0035,
          toCurrency: 'ETH',
          exchangeRate: 28571.43,
          status: 'completed',
          timestamp: '2025-09-05T14:00:00.000Z',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
        },
        {
          id: 'module_swap_002',
          moduleId: 'module_balances_usd',
          moduleName: 'Balances USD',
          fromAmount: 150.0,
          fromCurrency: 'USD',
          toAmount: 0.0052,
          toCurrency: 'ETH',
          exchangeRate: 28846.15,
          status: 'completed',
          timestamp: '2025-09-05T13:30:00.000Z',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
        }
      ];
      return NextResponse.json(defaultSwaps);
    }

    try {
      const swaps = JSON.parse(fs.readFileSync(swapsPath, 'utf8'));
      return NextResponse.json(swaps);
    } catch (error) {
      console.error('Error reading module swaps file:', error);
      return NextResponse.json([]);
    }

  } catch (error) {
    console.error('Error in module swaps API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





