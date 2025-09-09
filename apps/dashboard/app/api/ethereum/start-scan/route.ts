import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { filePath, blockSize, enableRealEthereum, enableRealConversion } = await request.json();

    // Validar parámetros
    if (!filePath) {
      return NextResponse.json(
        { error: 'Ruta del archivo es requerida' },
        { status: 400 }
      );
    }

    // Ruta al script de escaneo Ethereum
    const scriptPath = path.join(process.cwd(), '..', '..', 'scan-dtc1b-real-ethereum-clean.ps1');
    
    // Verificar que el script existe
    const fs = require('fs');
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { error: 'Script de escaneo Ethereum no encontrado' },
        { status: 404 }
      );
    }

    // Ejecutar el script de PowerShell
    const powershell = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-FilePath', filePath,
      '-BlockSize', blockSize.toString(),
      '-EnableRealEthereum', enableRealEthereum.toString(),
      '-EnableRealConversion', enableRealConversion.toString()
    ], {
      cwd: path.join(process.cwd(), '..', '..'),
      detached: true,
      stdio: 'ignore'
    });

    // No esperar a que termine, ejecutar en background
    powershell.unref();

    return NextResponse.json({
      success: true,
      message: 'Escaneo Ethereum iniciado exitosamente',
      processId: powershell.pid,
      scriptPath,
      parameters: {
        filePath,
        blockSize,
        enableRealEthereum,
        enableRealConversion
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error starting Ethereum scan:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}





