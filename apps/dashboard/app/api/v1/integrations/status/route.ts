import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const defaultIntegrationsStatus = {
      ethereum: {
        status: 'connected',
        lastSync: new Date().toISOString(),
        network: 'mainnet',
        blockNumber: 18500000
      },
      coreBanking: {
        status: 'active',
        lastSync: new Date().toISOString(),
        accounts: 3,
        transactions: 150
      },
      dtc1b: {
        status: 'scanning',
        lastSync: new Date().toISOString(),
        progress: 15.5,
        recordsProcessed: 125000
      }
    };

    return NextResponse.json(defaultIntegrationsStatus);

  } catch (error) {
    console.error('Error in integrations status API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





