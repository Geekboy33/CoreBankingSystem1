import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const systemStatus = {
      dashboard: {
        status: 'running',
        port: 3000,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      },
      api: {
        status: 'running',
        port: 8080,
        lastCheck: new Date().toISOString()
      },
      dataFiles: {
        totalFiles: 0,
        validFiles: 0,
        corruptedFiles: 0,
        files: []
      },
      scans: {
        active: false,
        lastScan: null,
        totalScans: 0
      },
      timestamp: new Date().toISOString()
    };

    // Verificar archivos de datos
    const dataDir = path.join(process.cwd(), '..', '..', 'extracted-data');
    const rootDir = path.join(process.cwd(), '..', '..');
    
    const dataFiles = [
      'complete-total-balances-scan.json',
      'dtc1b-scan-results.json',
      'dtc1b-robust-scan-results.json',
      'dtc1b-scan-simple-results.json'
    ];

    for (const file of dataFiles) {
      const filePath = path.join(rootDir, file);
      const fileInfo = {
        name: file,
        exists: false,
        size: 0,
        valid: false,
        lastModified: null
      };

      if (fs.existsSync(filePath)) {
        fileInfo.exists = true;
        const stats = fs.statSync(filePath);
        fileInfo.size = stats.size;
        fileInfo.lastModified = stats.mtime.toISOString();

        // Verificar si el JSON es válido
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          JSON.parse(content);
          fileInfo.valid = true;
          systemStatus.dataFiles.validFiles++;
        } catch {
          fileInfo.valid = false;
          systemStatus.dataFiles.corruptedFiles++;
        }
      }

      systemStatus.dataFiles.files.push(fileInfo);
      systemStatus.dataFiles.totalFiles++;
    }

    // Verificar si hay escaneos activos
    try {
      const progressResponse = await fetch('http://localhost:3000/api/v1/data/progress');
      const progressData = await progressResponse.json();
      
      if (progressData.status === 'active') {
        systemStatus.scans.active = true;
        systemStatus.scans.lastScan = progressData.timestamp;
      }
    } catch (error) {
      console.error('Error checking scan status:', error);
    }

    return NextResponse.json(systemStatus);

  } catch (error) {
    console.error('Error in system status API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}




