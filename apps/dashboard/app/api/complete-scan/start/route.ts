import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), '..', '..', 'scan-dtc1b-working-fixed.ps1');
    
    // Verificar que el script existe
    const fs = require('fs');
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { error: 'Script de escaneo completo no encontrado' },
        { status: 404 }
      );
    }

    // Ejecutar el script de escaneo completo en segundo plano
    exec(`powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error ejecutando script completo:', error);
        return;
      }
      if (stderr) {
        console.error('Stderr:', stderr);
        return;
      }
      console.log('Script completo ejecutado exitosamente:', stdout);
    });

    return NextResponse.json({
      success: true,
      message: 'Escaneo completo iniciado correctamente',
      scanId: `COMPLETE_SCAN_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'started'
    });

  } catch (error) {
    console.error('Error iniciando escaneo completo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}