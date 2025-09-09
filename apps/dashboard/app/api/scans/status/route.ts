import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function GET() {
  try {
    // Verificar procesos activos de escaneo
    const checkProcesses = () => {
      return new Promise((resolve) => {
        exec('tasklist /FI "IMAGENAME eq powershell.exe" /FO CSV', (error, stdout, stderr) => {
          if (error) {
            resolve({ hasActiveProcesses: false, processes: [] });
            return;
          }
          
          const lines = stdout.split('\n').filter(line => line.includes('powershell.exe'));
          const hasActiveProcesses = lines.length > 0;
          
          resolve({ hasActiveProcesses, processes: lines });
        });
      });
    };

    const processInfo = await checkProcesses();

    // Determinar estado de escaneo basado en procesos activos
    const scanStatus = {
      completeScan: {
        isRunning: processInfo.hasActiveProcesses,
        status: processInfo.hasActiveProcesses ? 'running' : 'idle',
        lastCheck: new Date().toISOString()
      },
      full800GBScan: {
        isRunning: processInfo.hasActiveProcesses,
        status: processInfo.hasActiveProcesses ? 'running' : 'idle',
        lastCheck: new Date().toISOString()
      },
      ethereumScan: {
        isRunning: false, // Por defecto, se puede actualizar después
        status: 'idle',
        lastCheck: new Date().toISOString()
      },
      systemInfo: {
        activeProcesses: processInfo.processes.length,
        totalProcesses: processInfo.processes,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(scanStatus);

  } catch (error) {
    console.error('Error checking scan status:', error);
    return NextResponse.json(
      { error: 'Error verificando estado de escaneos' },
      { status: 500 }
    );
  }
}




