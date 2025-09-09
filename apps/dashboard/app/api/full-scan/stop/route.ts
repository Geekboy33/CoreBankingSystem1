import { NextResponse } from 'next/server';
import { scanData } from '../start/route';

export async function POST() {
  try {
    // Detener el proceso de escaneo
    if (scanData.isRunning) {
      scanData.isRunning = false;
      scanData.progress = 0;
      scanData.currentBlock = 0;
      scanData.totalBlocks = 0;
      scanData.processedBytes = 0;
      scanData.totalBytes = 0;
      scanData.speed = 0;
      scanData.eta = '00:00:00';
    }

    return NextResponse.json({ 
      message: 'Escaneo detenido correctamente',
      finalData: scanData
    });
  } catch (error) {
    console.error('Error deteniendo escaneo:', error);
    return NextResponse.json({ error: 'Error deteniendo escaneo' }, { status: 500 });
  }
}