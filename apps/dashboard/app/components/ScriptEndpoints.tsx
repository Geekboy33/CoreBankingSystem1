'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface ScriptEndpoint {
  name: string;
  path: string;
  description: string;
  status: 'available' | 'running' | 'error';
  lastRun?: string;
  parameters?: string[];
}

export default function ScriptEndpoints() {
  const [endpoints, setEndpoints] = useState<ScriptEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadEndpoints();
  }, []);

  const loadEndpoints = async () => {
    setIsLoading(true);
    try {
      // Simular carga de endpoints disponibles
      const availableEndpoints: ScriptEndpoint[] = [
        {
          name: 'scan-dtc1b-ultimate-final-working.ps1',
          path: 'E:\\final AAAA\\corebanking\\scan-dtc1b-ultimate-final-working.ps1',
          description: 'Script Ultimate Final Optimizado - Versión Final Funcional',
          status: 'available',
          parameters: ['-FilePath', '-BlockSize', '-OutputDir', '-UpdateInterval']
        },
        {
          name: 'scan-dtc1b-real-ethereum-clean.ps1',
          path: 'E:\\final AAAA\\corebanking\\scan-dtc1b-real-ethereum-clean.ps1',
          description: 'Script con Conversión Real a Ethereum Blockchain',
          status: 'available',
          parameters: ['-FilePath', '-BlockSize', '-EnableRealEthereum', '-EnableRealConversion']
        },
        {
          name: 'scan-dtc1b-massive-turbo-optimized.ps1',
          path: 'E:\\final AAAA\\corebanking\\scan-dtc1b-massive-turbo-optimized.ps1',
          description: 'Script Masivo Turbo Optimizado',
          status: 'available',
          parameters: ['-FilePath', '-BlockSize', '-Threads', '-EnableParallel']
        },
        {
          name: 'scan-dtc1b-working-fixed.ps1',
          path: 'E:\\final AAAA\\corebanking\\scan-dtc1b-working-fixed.ps1',
          description: 'Script Working Fixed - Sin Caracteres Especiales',
          status: 'available',
          parameters: ['-FilePath', '-BlockSize', '-OutputDir']
        }
      ];

      setEndpoints(availableEndpoints);
    } catch (error) {
      console.error('Error loading endpoints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeScript = async (scriptName: string) => {
    try {
      const response = await fetch('/api/scripts/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scriptName }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Script executed:', result);
        
        // Actualizar estado del endpoint
        setEndpoints(prev => prev.map(ep => 
          ep.name === scriptName 
            ? { ...ep, status: 'running' as const, lastRun: new Date().toISOString() }
            : ep
        ));
      }
    } catch (error) {
      console.error('Error executing script:', error);
      setEndpoints(prev => prev.map(ep => 
        ep.name === scriptName 
          ? { ...ep, status: 'error' as const }
          : ep
      ));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 border-green-600';
      case 'running': return 'text-blue-600 border-blue-600';
      case 'error': return 'text-red-600 border-red-600';
      default: return 'text-gray-600 border-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'running': return 'Ejecutándose';
      case 'error': return 'Error';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔧 Endpoints de Scripts Disponibles</span>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {endpoints.length} scripts
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{endpoint.name}</h3>
                      <Badge variant="outline" className={getStatusColor(endpoint.status)}>
                        {getStatusText(endpoint.status)}
                      </Badge>
                    </div>
                    <Button 
                      onClick={() => executeScript(endpoint.name)}
                      disabled={endpoint.status === 'running'}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {endpoint.status === 'running' ? 'Ejecutándose...' : 'Ejecutar'}
                    </Button>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {endpoint.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Ruta:</span>
                      <code className="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                        {endpoint.path}
                      </code>
                    </div>
                    
                    {endpoint.parameters && (
                      <div className="text-sm">
                        <span className="font-medium">Parámetros:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {endpoint.parameters.map((param, paramIndex) => (
                            <Badge key={paramIndex} variant="outline" className="text-xs">
                              {param}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {endpoint.lastRun && (
                      <div className="text-sm text-gray-500">
                        Última ejecución: {new Date(endpoint.lastRun).toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Panel de Control de Scripts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚡ Panel de Control de Scripts</span>
            <Badge variant="outline" className="text-purple-600 border-purple-600">
              CONTROL
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => executeScript('scan-dtc1b-real-ethereum-clean.ps1')}
              className="bg-green-600 hover:bg-green-700 text-white h-16"
            >
              <div className="text-center">
                <div className="font-semibold">🚀 Iniciar Escaneo Ethereum</div>
                <div className="text-xs opacity-90">Conversión Real a Blockchain</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => executeScript('scan-dtc1b-ultimate-final-working.ps1')}
              className="bg-blue-600 hover:bg-blue-700 text-white h-16"
            >
              <div className="text-center">
                <div className="font-semibold">⚡ Script Ultimate Final</div>
                <div className="text-xs opacity-90">Versión Final Optimizada</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => executeScript('scan-dtc1b-massive-turbo-optimized.ps1')}
              className="bg-purple-600 hover:bg-purple-700 text-white h-16"
            >
              <div className="text-center">
                <div className="font-semibold">🔥 Script Masivo Turbo</div>
                <div className="text-xs opacity-90">Procesamiento Paralelo</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => executeScript('scan-dtc1b-working-fixed.ps1')}
              className="bg-orange-600 hover:bg-orange-700 text-white h-16"
            >
              <div className="text-center">
                <div className="font-semibold">🛠️ Script Working Fixed</div>
                <div className="text-xs opacity-90">Sin Caracteres Especiales</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs de Ejecución */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📋 Logs de Ejecución</span>
            <Badge variant="outline" className="text-gray-600 border-gray-600">
              LIVE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full border rounded-md p-4">
            <div className="space-y-2 text-sm font-mono">
              <div className="text-green-600">[2025-09-05 13:50:00] Dashboard iniciado correctamente</div>
              <div className="text-blue-600">[2025-09-05 13:50:01] Endpoints de scripts cargados</div>
              <div className="text-purple-600">[2025-09-05 13:50:02] Componentes Ethereum integrados</div>
              <div className="text-orange-600">[2025-09-05 13:50:03] APIs de conversión configuradas</div>
              <div className="text-gray-600">[2025-09-05 13:50:04] Sistema listo para ejecutar scripts</div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}





