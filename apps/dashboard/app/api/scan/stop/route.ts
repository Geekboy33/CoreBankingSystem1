import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST() {
  try {
    // Detener procesos de PowerShell que ejecutan escaneos
    exec('taskkill /F /IM powershell.exe /FI "WINDOWTITLE eq scan-dtc1b*"', (error, stdout, stderr) => {
      if (error) {
        console.log('No se encontraron procesos de escaneo activos');
        return;
      }
      console.log('Procesos de escaneo detenidos:', stdout);
    });

    // También detener cualquier proceso de Node.js relacionado con escaneos
    exec('taskkill /F /IM node.exe /FI "COMMANDLINE eq *scan*"', (error, stdout, stderr) => {
      if (error) {
        console.log('No se encontraron procesos Node.js de escaneo');
        return;
      }
      console.log('Procesos Node.js de escaneo detenidos:', stdout);
    });

    return NextResponse.json({
      success: true,
      message: 'Escaneo detenido correctamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deteniendo escaneo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}




