import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const defaultDaesData = {
      totalRecords: 1250,
      processedRecords: 1100,
      pendingRecords: 150,
      errorRecords: 0,
      lastProcessed: new Date().toISOString(),
      processingStatus: 'active'
    };

    return NextResponse.json(defaultDaesData);

  } catch (error) {
    console.error('Error in DAES data API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





