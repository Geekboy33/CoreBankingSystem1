import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Verificar que es un archivo DTC1B
    const fileName = file.name.toLowerCase();
    if (!fileName.includes('dtc1b') && !fileName.endsWith('.bin') && !fileName.endsWith('.dat')) {
      return NextResponse.json(
        { error: 'Archivo no es formato DTC1B válido' },
        { status: 400 }
      );
    }

    // Crear directorio de uploads si no existe
    const uploadDir = path.join(process.cwd(), '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Guardar archivo
    const filePath = path.join(uploadDir, `dtc1b_${Date.now()}_${file.name}`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    // Analizar archivo
    const analysis = {
      fileName: file.name,
      fileSize: file.size,
      fileSizeGB: (file.size / (1024 * 1024 * 1024)).toFixed(2),
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      savedPath: filePath,
      isBinary: true,
      analysis: {
        firstBytes: Array.from(buffer.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        nullBytes: Array.from(buffer.slice(0, 1024)).filter(b => b === 0).length,
        printableChars: Array.from(buffer.slice(0, 1024)).filter(b => b >= 32 && b <= 126).length,
        controlChars: Array.from(buffer.slice(0, 1024)).filter(b => b < 32 && b !== 9 && b !== 10 && b !== 13).length
      }
    };

    // Crear entrada en log de archivos procesados
    const logPath = path.join(process.cwd(), '..', '..', 'extracted-data', 'file-processing-log.json');
    let logData = [];
    
    if (fs.existsSync(logPath)) {
      try {
        const logContent = fs.readFileSync(logPath, 'utf8');
        logData = JSON.parse(logContent);
      } catch (error) {
        console.error('Error reading log file:', error);
      }
    }

    logData.push({
      id: `FILE_${Date.now()}`,
      ...analysis,
      status: 'uploaded',
      processingStatus: 'pending'
    });

    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Archivo DTC1B cargado correctamente',
      analysis,
      nextSteps: [
        'Archivo guardado para procesamiento',
        'Usar endpoint /api/dtc1b/analyze para análisis detallado',
        'Iniciar escaneo con /api/dtc1b/analyze POST'
      ]
    });

  } catch (error) {
    console.error('Error uploading DTC1B file:', error);
    return NextResponse.json(
      { error: 'Error cargando archivo DTC1B' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const logPath = path.join(process.cwd(), '..', '..', 'extracted-data', 'file-processing-log.json');
    
    if (!fs.existsSync(logPath)) {
      return NextResponse.json({
        files: [],
        totalFiles: 0,
        message: 'No hay archivos DTC1B procesados'
      });
    }

    const logContent = fs.readFileSync(logPath, 'utf8');
    const logData = JSON.parse(logContent);

    return NextResponse.json({
      files: logData,
      totalFiles: logData.length,
      message: 'Archivos DTC1B encontrados'
    });

  } catch (error) {
    console.error('Error reading DTC1B files:', error);
    return NextResponse.json(
      { error: 'Error leyendo archivos DTC1B' },
      { status: 500 }
    );
  }
}




