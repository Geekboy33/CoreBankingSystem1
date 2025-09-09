'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatCurrency } from '../utils/formatters';

interface CompleteScanProgress {
  currentBlock: number;
  totalBlocks: number;
  percentage: number;
  elapsedMinutes: number;
  estimatedRemaining: number;
  bytesProcessed: number;
  totalBytes: number;
  averageSpeedMBps: number;
  memoryUsageMB: number;
}

interface TotalBalances {
  EUR: number;
  USD: number;
  GBP: number;
  BTC: number;
  ETH: number;
}

interface CompleteScanStatistics {
  balancesFound: number;
  transactionsFound: number;
  accountsFound: number;
  creditCardsFound: number;
  usersFound: number;
  daesDataFound: number;
  ethereumWalletsFound: number;
  swiftCodesFound: number;
  ssnsFound: number;
}

interface CompleteScanData {
  scanId: string;
  mode: string;
  progress: CompleteScanProgress;
  balances: TotalBalances;
  statistics: CompleteScanStatistics;
  recentData: {
    balances: any[];
    transactions: any[];
    accounts: any[];
    creditCards: any[];
    users: any[];
    ethereumWallets: any[];
  };
  timestamp: string;
}

export default function CompleteScanPanel() {
  const [scanData, setScanData] = useState<CompleteScanData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [realTimeRates, setRealTimeRates] = useState<{
    ETH: { EUR: number; USD: number; GBP: number };
    BTC: { EUR: number; USD: number; GBP: number };
  }>({
    ETH: { EUR: 0, USD: 0, GBP: 0 },
    BTC: { EUR: 0, USD: 0, GBP: 0 }
  });

  // Cargar datos del escaneo completo
  useEffect(() => {
    loadCompleteScanData();
    checkScanStatus();
  }, []);

  // Verificar estado real de escaneos
  const checkScanStatus = async () => {
    try {
      const response = await fetch('/api/scans/status');
      if (response.ok) {
        const status = await response.json();
        setScanStatus(status.completeScan.status);
        setIsScanning(status.completeScan.isRunning);
      }
    } catch (error) {
      console.error('Error checking scan status:', error);
    }
  };

  // Obtener tasas en tiempo real
  useEffect(() => {
    const fetchRealTimeRates = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=eur,usd,gbp');
        const data = await response.json();
        
        setRealTimeRates({
          ETH: {
            EUR: data.ethereum.eur,
            USD: data.ethereum.usd,
            GBP: data.ethereum.gbp
          },
          BTC: {
            EUR: data.bitcoin.eur,
            USD: data.bitcoin.usd,
            GBP: data.bitcoin.gbp
          }
        });
      } catch (error) {
        console.error('Error fetching real-time rates:', error);
      }
    };

    fetchRealTimeRates();
    const interval = setInterval(fetchRealTimeRates, 10000);

    return () => clearInterval(interval);
  }, []);

  // Cargar datos del escaneo completo
  const loadCompleteScanData = async () => {
    try {
      const response = await fetch('/api/complete-scan/status');
      if (response.ok) {
        const data = await response.json();
        setScanData(data);
        setScanStatus(data.progress.percentage >= 100 ? 'completed' : 'running');
      }
    } catch (error) {
      console.error('Error loading complete scan data:', error);
    }
  };

  // Iniciar escaneo completo
  const startCompleteScan = async () => {
    setIsScanning(true);
    setScanStatus('running');
    
    try {
      const response = await fetch('/api/complete-scan/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanMode: 'COMPLETE_TOTAL_BALANCES_SCAN',
          blockSize: 200,
          parallelJobs: 8,
          targetFile: 'dtc1b'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Complete scan started:', result);
        
        // Iniciar polling para actualizar progreso
        startProgressPolling();
      } else {
        throw new Error('Error iniciando escaneo completo');
      }

    } catch (error) {
      console.error('Error starting complete scan:', error);
      setScanStatus('error');
    } finally {
      setIsScanning(false);
    }
  };

  // Polling para actualizar progreso
  const startProgressPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/complete-scan/status');
        if (response.ok) {
          const data = await response.json();
          setScanData(data);
          
          if (data.progress.percentage >= 100) {
            setScanStatus('completed');
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    }, 5000);

    // Limpiar intervalo después de 2 horas
    setTimeout(() => clearInterval(interval), 7200000);
  };

  // Calcular valor total en EUR
  const calculateTotalValueEUR = () => {
    if (!scanData) return 0;
    
    const balances = scanData.balances;
    const rates = realTimeRates;
    
    return balances.EUR + 
           (balances.USD * rates.ETH.USD / rates.ETH.EUR) + 
           (balances.GBP * rates.ETH.GBP / rates.ETH.EUR) +
           (balances.BTC * rates.BTC.EUR) +
           (balances.ETH * rates.ETH.EUR);
  };

  const totalValueEUR = calculateTotalValueEUR();

  return (
    <div className="space-y-6">
      {/* Panel Principal de Escaneo Completo */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">🔍 Escaneo Completo DTC1B - Balances Totales</span>
            <Badge variant="outline" className="text-green-600 border-green-600">
              ESCANEO TOTAL
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado del Escaneo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Estado del Escaneo Completo</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {scanData?.progress.percentage.toFixed(2) || 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Progreso Total</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {scanData?.progress.bytesProcessed ? 
                    (scanData.progress.bytesProcessed / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : 
                    '0 GB'
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Procesado</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {scanData?.progress.estimatedRemaining ? 
                    Math.round(scanData.progress.estimatedRemaining) + ' min' : 
                    'N/A'
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tiempo Restante</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {scanData?.progress.averageSpeedMBps.toFixed(2) || 0} MB/s
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Velocidad</div>
              </div>
            </div>
          </div>

          {/* Balances Totales Extraídos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Balances Totales Extraídos del DTC1B</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(scanData?.balances.EUR || 0, 'EUR')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">EUR Total</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(scanData?.balances.USD || 0, 'USD')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">USD Total</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(scanData?.balances.GBP || 0, 'GBP')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">GBP Total</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {(scanData?.balances.BTC || 0).toFixed(8)} BTC
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">BTC Total</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                  {(scanData?.balances.ETH || 0).toFixed(8)} ETH
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ETH Total</div>
              </div>
            </div>
            
            {/* Valor Total en EUR */}
            <div className="text-center p-6 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalValueEUR, 'EUR')}
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400">
                Valor Total Extraído (Convertido a EUR)
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Basado en tasas de cambio en tiempo real
              </div>
            </div>
          </div>

          {/* Estadísticas del Escaneo */}
          {scanData && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Estadísticas del Escaneo Completo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {scanData.statistics.balancesFound.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Balances</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {scanData.statistics.transactionsFound.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Transacciones</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {scanData.statistics.accountsFound.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Cuentas</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {scanData.statistics.ethereumWalletsFound.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Wallets ETH</div>
                </div>
              </div>
            </div>
          )}

          {/* Controles del Escaneo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Controles del Escaneo Completo</h3>
            <div className="flex gap-4">
              <Button 
                onClick={startCompleteScan}
                disabled={isScanning || scanStatus === 'running'}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isScanning ? '🔄 Iniciando...' : '🔍 Iniciar Escaneo Completo DTC1B'}
              </Button>
              
              <Button 
                onClick={loadCompleteScanData}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                🔄 Actualizar Datos
              </Button>
            </div>
          </div>

          {/* Barra de Progreso */}
          {scanData && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso del Escaneo Completo</span>
                <span>{scanData.progress.currentBlock} / {scanData.progress.totalBlocks} bloques</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${scanData.progress.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Velocidad: {scanData.progress.averageSpeedMBps.toFixed(2)} MB/s</span>
                <span>Memoria: {scanData.progress.memoryUsageMB.toFixed(0)} MB</span>
              </div>
            </div>
          )}

          {/* Información del Escaneo */}
          <Card className="border-gray-200 bg-gray-50 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-600 dark:text-gray-400">Información del Escaneo Completo</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 dark:text-gray-400">
              <div className="space-y-2">
                <div><strong>Archivo:</strong> DTC1B (800GB)</div>
                <div><strong>Modo:</strong> Escaneo Completo de Balances Totales</div>
                <div><strong>Bloques:</strong> {scanData?.progress.totalBlocks || 16384} bloques estimados</div>
                <div><strong>Tamaño por Bloque:</strong> 200MB</div>
                <div><strong>Procesamiento:</strong> Paralelo (8 jobs simultáneos)</div>
                <div><strong>Patrones:</strong> EUR, USD, GBP, BTC, ETH, Transacciones, Cuentas, Wallets</div>
                <div><strong>Objetivo:</strong> Extraer TODOS los balances del archivo DTC1B</div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

