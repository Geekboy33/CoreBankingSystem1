import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const defaultBinaryData = {
      totalFiles: 5,
      totalSize: '800GB',
      processedFiles: 2,
      pendingFiles: 3,
      lastProcessed: new Date().toISOString(),
      processingStatus: 'active',
      files: [
        {
          name: 'dtc1b',
          size: '800GB',
          status: 'processing',
          progress: 15.5
        },
        {
          name: 'dtc1b_backup',
          size: '800GB',
          status: 'pending',
          progress: 0
        }
      ]
    };

    return NextResponse.json(defaultBinaryData);

  } catch (error) {
    console.error('Error in binary data API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





