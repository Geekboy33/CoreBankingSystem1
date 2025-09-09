import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const defaultRealtimeBalances = {
      scanId: 'REALTIME_BALANCES_20250905',
      mode: 'REALTIME_SCAN',
      progress: {
        currentBlock: 150,
        totalBlocks: 1000,
        percentage: 15.0,
        elapsedMinutes: 45,
        estimatedRemaining: 255,
        bytesProcessed: 120 * 1024 * 1024 * 1024,
        totalBytes: 800 * 1024 * 1024 * 1024,
        averageSpeedMBps: 45.2,
        memoryUsageMB: 2048
      },
      balances: {
        EUR: 21.0,
        USD: 15.0,
        GBP: 5.0,
        BTC: 0.001073,
        ETH: 0.0163
      },
      statistics: {
        balancesFound: 505,
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
        balances: [
          {
            Balance: 2,
            Currency: "GBP",
            Timestamp: "2025-09-05T13:16:13.000Z",
            Block: 2,
            RawValue: "2",
            Position: 21773255
          },
          {
            Balance: 5,
            Currency: "EUR",
            Timestamp: "2025-09-05T13:16:08.000Z",
            Block: 2,
            RawValue: "5",
            Position: 50639092
          }
        ],
        transactions: [],
        accounts: [],
        creditCards: [],
        users: [],
        ethereumWallets: []
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(defaultRealtimeBalances);

  } catch (error) {
    console.error('Error in realtime balances API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





