import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { scriptName }: { scriptName: string } = await request.json();

    if (!scriptName) {
      return NextResponse.json(
        { error: 'Nombre del script es requerido' },
        { status: 400 }
      );
    }

    // Mapear nombres de scripts a rutas reales
    const scriptPaths: { [key: string]: string } = {
      'scan-dtc1b-ultimate-final-working.ps1': path.join(process.cwd(), '..', '..', 'scan-dtc1b-ultimate-final-working.ps1'),
      'scan-dtc1b-real-ethereum-clean.ps1': path.join(process.cwd(), '..', '..', 'scan-dtc1b-real-ethereum-clean.ps1'),
      'scan-dtc1b-massive-turbo-optimized.ps1': path.join(process.cwd(), '..', '..', 'scan-dtc1b-massive-turbo-optimized.ps1'),
      'scan-dtc1b-working-fixed.ps1': path.join(process.cwd(), '..', '..', 'scan-dtc1b-working-fixed.ps1')
    };

    const scriptPath = scriptPaths[scriptName];
    
    if (!scriptPath) {
      return NextResponse.json(
        { error: 'Script no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el script existe
    const fs = require('fs');
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { error: `Script no encontrado en: ${scriptPath}` },
        { status: 404 }
      );
    }

    // Ejecutar el script de PowerShell
    const powershell = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-FilePath', 'E:\\final AAAA\\dtc1b',
      '-BlockSize', '50MB',
      '-EnableRealEthereum', 'true',
      '-EnableRealConversion', 'true'
    ], {
      cwd: path.join(process.cwd(), '..', '..'),
      detached: true,
      stdio: 'ignore'
    });

    // No esperar a que termine, ejecutar en background
    powershell.unref();

    return NextResponse.json({
      success: true,
      message: `Script ${scriptName} iniciado exitosamente`,
      processId: powershell.pid,
      scriptPath,
      parameters: {
        filePath: 'E:\\final AAAA\\dtc1b',
        blockSize: '50MB',
        enableRealEthereum: true,
        enableRealConversion: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error executing script:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}





