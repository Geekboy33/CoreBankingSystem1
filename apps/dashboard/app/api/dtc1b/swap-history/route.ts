import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface DTC1BSwap {
  id: string;
  originalBalance: {
    Balance: number;
    Currency: string;
    Timestamp: string;
    Block: number;
    RawValue: string;
    Position: number;
  };
  ethAmount: number;
  exchangeRate: number;
  blockchainFee: number;
  totalCost: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  blockchainTransactionHash: string;
  timestamp: string;
  walletAddress: string;
}

export async function GET() {
  try {
    const swapsPath = path.join(process.cwd(), '..', '..', 'extracted-data', 'dtc1b-swaps.json');
    
    if (!fs.existsSync(swapsPath)) {
      // Crear datos por defecto
      const defaultSwaps: DTC1BSwap[] = [
        {
          id: 'dtc1b_swap_001',
          originalBalance: {
            Balance: 5,
            Currency: 'EUR',
            Timestamp: '2025-09-05T13:16:08.000Z',
            Block: 2,
            RawValue: '5',
            Position: 50639092
          },
          ethAmount: 0.00175,
          exchangeRate: 2857.14,
          blockchainFee: 0.000021,
          totalCost: 5,
          status: 'completed',
          blockchainTransactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          timestamp: '2025-09-05T14:00:00.000Z',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
        },
        {
          id: 'dtc1b_swap_002',
          originalBalance: {
            Balance: 6,
            Currency: 'USD',
            Timestamp: '2025-09-05T13:15:16.000Z',
            Block: 0,
            RawValue: '6',
            Position: 37761817
          },
          ethAmount: 0.00228,
          exchangeRate: 2631.58,
          blockchainFee: 0.000021,
          totalCost: 6,
          status: 'completed',
          blockchainTransactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
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
      console.error('Error reading DTC1B swaps file:', error);
      return NextResponse.json([]);
    }

  } catch (error) {
    console.error('Error in DTC1B swap history API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





