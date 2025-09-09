import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Datos por defecto para balances del ledger
    const defaultBalances = [
      {
        currency: 'EUR',
        amount: 15000.50,
        change24h: 250.75,
        changePercent: 1.7
      },
      {
        currency: 'USD',
        amount: 12500.25,
        change24h: -150.30,
        changePercent: -1.2
      },
      {
        currency: 'GBP',
        amount: 8500.75,
        change24h: 100.50,
        changePercent: 1.2
      }
    ];

    return NextResponse.json(defaultBalances);

  } catch (error) {
    console.error('Error in ledger balances API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





