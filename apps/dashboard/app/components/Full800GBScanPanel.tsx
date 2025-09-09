'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatCurrency } from '../utils/formatters';

interface FullScanProgress {
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

interface EstimatedBalances {
  EUR: number;
  USD: number;
  GBP: number;
  BTC: number;
  ETH: number;
  totalEstimated: number;
  confidence: number;
}

interface FullScanStatistics {
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

interface FullScanData {
  scanId: string;
  mode: string;
  progress: FullScanProgress;
  balances: EstimatedBalances;
  statistics: FullScanStatistics;
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

export default function Full800GBScanPanel() {
  const [scanData, setScanData] = useState<FullScanData | null>(null);
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
    loadFullScanData();
  }, []);

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
  const loadFullScanData = async () => {
    try {
      const response = await fetch('/api/full-scan/status');
      if (response.ok) {
        const data = await response.json();
        setScanData(data);
        setScanStatus(data.progress.percentage >= 100 ? 'completed' : 'running');
      } else {
        // Crear datos estimados para el escaneo completo de 800GB
        const estimatedData: FullScanData = {
          scanId: 'FULL_800GB_SCAN_20250905',
          mode: 'FULL_800GB_MASSIVE_SCAN',
          progress: {
            currentBlock: 0,
            totalBlocks: 16384, // Estimado para 800GB
            percentage: 0,
            elapsedMinutes: 0,
            estimatedRemaining: 0,
            bytesProcessed: 0,
            totalBytes: 800 * 1024 * 1024 * 1024, // 800GB en bytes
            averageSpeedMBps: 0,
            memoryUsageMB: 0
          },
          balances: {
            EUR: 0,
            USD: 0,
            GBP: 0,
            BTC: 0,
            ETH: 0,
            totalEstimated: 0,
            confidence: 0
          },
          statistics: {
            balancesFound: 0,
            transactionsFound: 0,
            accountsFound: 0,
            creditCardsFound: 0,
            usersFound: 0,
            daesDataFound: 0,
            ethereumWalletsFound: 0,
            swiftCodesFound: 0,
            ssnsFound: 0
          },
          recentData: {
            balances: [],
            transactions: [],
            accounts: [],
            creditCards: [],
            users: [],
            ethereumWallets: []
          },
          timestamp: new Date().toISOString()
        };
        setScanData(estimatedData);
      }
    } catch (error) {
      console.error('Error loading full scan data:', error);
    }
  };

  // Iniciar escaneo completo de 800GB
  const startFullScan = async () => {
    setIsScanning(true);
    setScanStatus('running');
    
    try {
      const response = await fetch('/api/full-scan/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanMode: 'FULL_800GB_SCAN',
          blockSize: 200, // MB por bloque
          parallelJobs: 8,
          targetFile: 'dtc1b'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Full 800GB scan started:', result);
        
        // Iniciar polling para actualizar progreso
        startProgressPolling();
      } else {
        throw new Error('Error iniciando escaneo completo');
      }

    } catch (error) {
      console.error('Error starting full scan:', error);
      setScanStatus('error');
    } finally {
      setIsScanning(false);
    }
  };

  // Detener escaneo
  const stopFullScan = async () => {
    try {
      const response = await fetch('/api/full-scan/stop', {
        method: 'POST'
      });

      if (response.ok) {
        setScanStatus('idle');
        console.log('Full scan stopped');
      }
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  };

  // Polling para actualizar progreso
  const startProgressPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/full-scan/progress');
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

    // Limpiar intervalo después de 1 hora
    setTimeout(() => clearInterval(interval), 3600000);
  };

  // Calcular balances totales estimados
  const calculateEstimatedTotals = () => {
    if (!scanData) return { EUR: 0, USD: 0, GBP: 0, BTC: 0, ETH: 0 };

    // Estimación basada en el progreso actual y datos parciales
    const progressFactor = scanData.progress.percentage / 100;
    const estimatedFactor = progressFactor > 0 ? 1 / progressFactor : 100; // Factor de estimación

    return {
      EUR: scanData.balances.EUR * estimatedFactor,
      USD: scanData.balances.USD * estimatedFactor,
      GBP: scanData.balances.GBP * estimatedFactor,
      BTC: scanData.balances.BTC * estimatedFactor,
      ETH: scanData.balances.ETH * estimatedFactor
    };
  };

  // Calcular valor total en EUR
  const calculateTotalValueEUR = () => {
    const estimated = calculateEstimatedTotals();
    const rates = realTimeRates;
    
    return estimated.EUR + 
           (estimated.USD * rates.ETH.USD / rates.ETH.EUR) + 
           (estimated.GBP * rates.ETH.GBP / rates.ETH.EUR) +
           (estimated.BTC * rates.BTC.EUR) +
           (estimated.ETH * rates.ETH.EUR);
  };

  const estimatedTotals = calculateEstimatedTotals();
  const totalValueEUR = calculateTotalValueEUR();

  return (
    <div className="space-y-6">
      {/* Panel Principal de Escaneo Completo 800GB */}
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-purple-600 dark:text-purple-400">📊 Escaneo Completo DTC1B - 800GB</span>
            <Badge variant="outline" className="text-purple-600 border-purple-600">
              ESCANEO MASIVO
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado del Escaneo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Estado del Escaneo Completo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>
          </div>

          {/* Balances Totales Estimados */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Balances Totales Estimados (800GB Completos)</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(estimatedTotals.EUR, 'EUR')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">EUR Total</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(estimatedTotals.USD, 'USD')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">USD Total</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(estimatedTotals.GBP, 'GBP')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">GBP Total</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {estimatedTotals.BTC.toFixed(8)} BTC
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">BTC Total</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                  {estimatedTotals.ETH.toFixed(8)} ETH
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ETH Total</div>
              </div>
            </div>
            
            {/* Valor Total Estimado */}
            <div className="text-center p-6 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(totalValueEUR, 'EUR')}
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400">
                Valor Total Estimado (800GB Completos)
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Basado en progreso actual: {scanData?.progress.percentage.toFixed(2) || 0}%
              </div>
            </div>
          </div>

          {/* Estadísticas del Escaneo */}
          {scanData && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Estadísticas del Escaneo</h3>
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
            <h3 className="font-semibold text-lg">Controles del Escaneo</h3>
            <div className="flex gap-4">
              <Button 
                onClick={startFullScan}
                disabled={isScanning || scanStatus === 'running'}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isScanning ? '🔄 Iniciando...' : '🚀 Iniciar Escaneo Completo 800GB'}
              </Button>
              
              <Button 
                onClick={stopFullScan}
                disabled={scanStatus !== 'running'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                ⏹️ Detener Escaneo
              </Button>
              
              <Button 
                onClick={loadFullScanData}
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
                <span>Progreso del Escaneo</span>
                <span>{scanData.progress.currentBlock} / {scanData.progress.totalBlocks} bloques</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-500"
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
                <div><strong>Modo:</strong> Escaneo Masivo Completo</div>
                <div><strong>Bloques:</strong> {scanData?.progress.totalBlocks || 16384} bloques estimados</div>
                <div><strong>Tamaño por Bloque:</strong> 200MB</div>
                <div><strong>Procesamiento:</strong> Paralelo (8 jobs simultáneos)</div>
                <div><strong>Patrones:</strong> Balances, Transacciones, Cuentas, Wallets ETH, DAES</div>
                <div><strong>Estimación:</strong> Basada en datos parciales y progreso actual</div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}





