import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const defaultFinancialData = {
      totalAssets: 36000.50,
      totalLiabilities: 5000.25,
      netWorth: 31000.25,
      monthlyIncome: 5000.00,
      monthlyExpenses: 3000.00,
      savingsRate: 40.0,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(defaultFinancialData);

  } catch (error) {
    console.error('Error in financial data API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





