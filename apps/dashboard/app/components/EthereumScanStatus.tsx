'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ScanStatus {
  isRunning: boolean;
  progress: number;
  currentBlock: number;
  totalBlocks: number;
  speed: number;
  ethereumConversions: number;
  blockchainTransactions: number;
  lastUpdate: string;
}

export default function EthereumScanStatus() {
  const [scanStatus, setScanStatus] = useState<ScanStatus>({
    isRunning: false,
    progress: 0,
    currentBlock: 0,
    totalBlocks: 0,
    speed: 0,
    ethereumConversions: 0,
    blockchainTransactions: 0,
    lastUpdate: ''
  });

  const [isStartingScan, setIsStartingScan] = useState(false);

  useEffect(() => {
    const checkScanStatus = async () => {
      try {
        const response = await fetch('/api/ethereum/scan-status');
        if (response.ok) {
          const status = await response.json();
          setScanStatus(status);
        }
      } catch (error) {
        console.error('Error checking scan status:', error);
      }
    };

    checkScanStatus();
    const interval = setInterval(checkScanStatus, 2000); // Verificar cada 2 segundos

    return () => clearInterval(interval);
  }, []);

  const startEthereumScan = async () => {
    setIsStartingScan(true);
    try {
      const response = await fetch('/api/ethereum/start-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: 'E:\\final AAAA\\dtc1b',
          blockSize: 50 * 1024 * 1024, // 50MB
          enableRealEthereum: true,
          enableRealConversion: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Scan started:', result);
        setScanStatus(prev => ({ ...prev, isRunning: true }));
      } else {
        console.error('Error starting scan');
      }
    } catch (error) {
      console.error('Error starting Ethereum scan:', error);
    } finally {
      setIsStartingScan(false);
    }
  };

  const stopEthereumScan = async () => {
    try {
      const response = await fetch('/api/ethereum/stop-scan', {
        method: 'POST',
      });

      if (response.ok) {
        setScanStatus(prev => ({ ...prev, isRunning: false }));
      }
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  };

  return (
    <Card className={scanStatus.isRunning ? "border-green-200 bg-green-50 dark:bg-green-900/20" : "border-gray-200"}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={scanStatus.isRunning ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
              {scanStatus.isRunning ? "🟢" : "⚪"} Estado del Escaneo Ethereum
            </span>
            <Badge variant={scanStatus.isRunning ? "default" : "outline"}>
              {scanStatus.isRunning ? "EJECUTANDOSE" : "DETENIDO"}
            </Badge>
          </div>
          <div className="flex gap-2">
            {!scanStatus.isRunning ? (
              <Button 
                onClick={startEthereumScan}
                disabled={isStartingScan}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isStartingScan ? 'Iniciando...' : 'Iniciar Escaneo Ethereum'}
              </Button>
            ) : (
              <Button 
                onClick={stopEthereumScan}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Detener Escaneo
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scanStatus.isRunning ? (
          <div className="space-y-4">
            {/* Barra de progreso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso del escaneo</span>
                <span>{scanStatus.progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanStatus.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Estadísticas del escaneo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {scanStatus.currentBlock}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Bloques Procesados</div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {scanStatus.speed.toFixed(2)} MB/s
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Velocidad</div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {scanStatus.ethereumConversions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Conversiones ETH</div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {scanStatus.blockchainTransactions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">TX Blockchain</div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div>Total de bloques: {scanStatus.totalBlocks}</div>
              <div>Última actualización: {scanStatus.lastUpdate}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-400 mb-4">
              El escaneo Ethereum está detenido. Haz clic en "Iniciar Escaneo Ethereum" para comenzar la extracción y conversión de datos.
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              El escaneo procesará el archivo DTC1B y convertirá automáticamente todos los balances encontrados a Ethereum y Bitcoin usando tasas en tiempo real.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
