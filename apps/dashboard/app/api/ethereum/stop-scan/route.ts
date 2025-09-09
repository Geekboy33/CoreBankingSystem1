import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Detener procesos de PowerShell que ejecuten el script de escaneo Ethereum
    const command = `taskkill /F /IM powershell.exe /FI "WINDOWTITLE eq *scan-dtc1b-real-ethereum*"`;
    
    try {
      await execAsync(command);
      
      return NextResponse.json({
        success: true,
        message: 'Escaneo Ethereum detenido exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (killError) {
      // Si no hay procesos para matar, no es un error crítico
      console.log('No se encontraron procesos de escaneo Ethereum para detener');
      
      return NextResponse.json({
        success: true,
        message: 'No se encontraron procesos de escaneo Ethereum ejecutándose',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error stopping Ethereum scan:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}





