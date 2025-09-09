import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const defaultAccounts = [
      {
        id: 'acc_001',
        name: 'EUR Savings Account',
        type: 'savings',
        currency: 'EUR',
        balance: 15000.50,
        status: 'active',
        lastActivity: new Date().toISOString()
      },
      {
        id: 'acc_002',
        name: 'USD Checking Account',
        type: 'checking',
        currency: 'USD',
        balance: 12500.25,
        status: 'active',
        lastActivity: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'acc_003',
        name: 'GBP Investment Account',
        type: 'investment',
        currency: 'GBP',
        balance: 8500.75,
        status: 'active',
        lastActivity: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    return NextResponse.json(defaultAccounts);

  } catch (error) {
    console.error('Error in accounts API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





