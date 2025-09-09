import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '50';

    // Datos por defecto para transacciones
    const defaultTransactions = [
      {
        id: 'tx_001',
        from: 'EUR Account',
        to: 'USD Account',
        amount: 1000.00,
        currency: 'EUR',
        timestamp: new Date().toISOString(),
        status: 'completed',
        type: 'transfer'
      },
      {
        id: 'tx_002',
        from: 'GBP Account',
        to: 'ETH Wallet',
        amount: 500.00,
        currency: 'GBP',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'completed',
        type: 'swap'
      },
      {
        id: 'tx_003',
        from: 'USD Account',
        to: 'BTC Wallet',
        amount: 750.00,
        currency: 'USD',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'pending',
        type: 'swap'
      }
    ];

    return NextResponse.json(defaultTransactions.slice(0, parseInt(limit)));

  } catch (error) {
    console.error('Error in ledger transactions API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





