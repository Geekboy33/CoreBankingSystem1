'use client';
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface FileAnalysis {
  fileName: string;
  fileSize: number;
  encoding: string;
  lines: number;
  patterns: {
    accountPatterns: number;
    transactionPatterns: number;
    datePatterns: number;
    amountPatterns: number;
  };
  preview: string[];
}

export default function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeFile = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:8080/api/v1/ingest/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error al analizar archivo: ${response.statusText}`);
      }
      
      const result = await response.json();
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Error al analizar el archivo');
      console.error('Error analyzing file:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (file.name.toLowerCase().includes('dtc1b') || file.name.toLowerCase().includes('.bin')) {
      analyzeFile(file);
    } else {
      setError('Por favor selecciona un archivo DTC1B válido');
    }
  }, [analyzeFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Cargar Archivo DTC1B
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            Arrastra tu archivo DTC1B aquí o haz clic para seleccionar
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Soporta archivos .bin, .dtc1b y otros formatos binarios
          </p>
          
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".bin,.dtc1b,.dat"
            onChange={handleFileInput}
          />
          <label htmlFor="file-upload">
            <Button>
              Seleccionar Archivo
            </Button>
          </label>
        </div>

        {isAnalyzing && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analizando archivo...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {analysis && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Análisis Completado</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Archivo:</span> {analysis.fileName}
                </div>
                <div>
                  <span className="font-medium">Tamaño:</span> {(analysis.fileSize / 1024).toFixed(2)} KB
                </div>
                <div>
                  <span className="font-medium">Codificación:</span> {analysis.encoding}
                </div>
                <div>
                  <span className="font-medium">Líneas:</span> {analysis.lines}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Patrones Detectados:</h4>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {analysis.patterns.accountPatterns} Cuentas
                  </Badge>
                  <Badge variant="secondary">
                    {analysis.patterns.transactionPatterns} Transacciones
                  </Badge>
                  <Badge variant="secondary">
                    {analysis.patterns.datePatterns} Fechas
                  </Badge>
                  <Badge variant="secondary">
                    {analysis.patterns.amountPatterns} Montos
                  </Badge>
                </div>
              </div>

              {analysis.preview.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Vista Previa:</h4>
                  <div className="bg-white p-3 rounded border text-xs font-mono max-h-32 overflow-y-auto">
                    {analysis.preview.map((line, index) => (
                      <div key={index} className="text-gray-600">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
