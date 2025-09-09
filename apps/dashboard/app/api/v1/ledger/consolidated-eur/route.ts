import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const defaultConsolidatedEUR = {
      totalEUR: 15000.50,
      totalUSD: 12500.25,
      totalGBP: 8500.75,
      totalBTC: 0.001073,
      totalETH: 0.0163,
      eurEquivalent: 36000.50,
      lastUpdated: new Date().toISOString(),
      exchangeRates: {
        USD_EUR: 0.85,
        GBP_EUR: 1.15,
        BTC_EUR: 45000.00,
        ETH_EUR: 3000.00
      }
    };

    return NextResponse.json(defaultConsolidatedEUR);

  } catch (error) {
    console.error('Error in consolidated EUR API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





