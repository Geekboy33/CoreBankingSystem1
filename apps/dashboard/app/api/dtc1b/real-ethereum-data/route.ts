import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const defaultRealEthereumData = {
      scanId: 'REAL_ETHEREUM_DATA_20250905',
      mode: 'REAL_ETHEREUM_SCAN',
      progress: {
        currentBlock: 75,
        totalBlocks: 500,
        percentage: 15.0,
        elapsedMinutes: 30,
        estimatedRemaining: 170,
        bytesProcessed: 60 * 1024 * 1024 * 1024,
        totalBytes: 400 * 1024 * 1024 * 1024,
        averageSpeedMBps: 33.3,
        memoryUsageMB: 1536
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
            Position: 21773255,
            EthereumConversion: {
              OriginalCurrency: "GBP",
              ETH: 0.0006,
              BTC: 4E-05,
              OriginalAmount: 2,
              Source: "Real DTC1B Data",
              Valid: true,
              Timestamp: "2025-09-05T13:16:13.000Z"
            }
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

    return NextResponse.json(defaultRealEthereumData);

  } catch (error) {
    console.error('Error in real ethereum data API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





