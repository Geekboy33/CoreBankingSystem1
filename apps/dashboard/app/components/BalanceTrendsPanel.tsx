'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { formatCurrency } from '../utils/formatters';

interface BalanceTrendsData {
  scanId: string;
  mode: string;
  progress: {
    currentBlock: number;
    totalBlocks: number;
    percentage: number;
    elapsedMinutes: number;
    estimatedRemaining: number;
    bytesProcessed: number;
    totalBytes: number;
    averageSpeedMBps: number;
    memoryUsageMB: number;
  };
  balances: {
    EUR: number;
    USD: number;
    GBP: number;
    BTC: number;
    ETH: number;
  };
  statistics: {
    balancesFound: number;
    transactionsFound: number;
    accountsFound: number;
    creditCardsFound: number;
    usersFound: number;
    daesDataFound: number;
    ethereumWalletsFound: number;
    swiftCodesFound: number;
    ssnsFound: number;
  };
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

interface RealTimeRates {
  ETH: { EUR: number; USD: number; GBP: number };
  BTC: { EUR: number; USD: number; GBP: number };
}

export default function BalanceTrendsPanel() {
  const [trendsData, setTrendsData] = useState<BalanceTrendsData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [realTimeRates, setRealTimeRates] = useState<RealTimeRates>({
    ETH: { EUR: 0, USD: 0, GBP: 0 },
    BTC: { EUR: 0, USD: 0, GBP: 0 }
  });
  const [scanHistory, setScanHistory] = useState<BalanceTrendsData[]>([]);

  // Cargar datos de tendencias
  useEffect(() => {
    loadTrendsData();
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
    const interval = setInterval(fetchRealTimeRates, 30000); // Actualizar cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Cargar datos de tendencias
  const loadTrendsData = async () => {
    try {
      const response = await fetch('/api/complete-scan/status');
      if (response.ok) {
        const data = await response.json();
        setTrendsData(data);
        setScanStatus(data.progress.percentage >= 100 ? 'completed' : 'running');
        
        // Agregar a historial si es nuevo
        if (data.scanId && !scanHistory.find(h => h.scanId === data.scanId)) {
          setScanHistory(prev => [data, ...prev.slice(0, 9)]); // Mantener últimos 10
        }
      }
    } catch (error) {
      console.error('Error loading trends data:', error);
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
          scanMode: 'COMPLETE_DTC1B_SCAN',
          blockSize: 100,
          parallelJobs: 4,
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
          setTrendsData(data);
          
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
    if (!trendsData) return 0;
    
    const balances = trendsData.balances;
    const rates = realTimeRates;
    
    return balances.EUR + 
           (balances.USD * rates.ETH.USD / rates.ETH.EUR) + 
           (balances.GBP * rates.ETH.GBP / rates.ETH.EUR) +
           (balances.BTC * rates.BTC.EUR) +
           (balances.ETH * rates.ETH.EUR);
  };

  const totalValueEUR = calculateTotalValueEUR();

  // Calcular tendencias
  const calculateTrends = () => {
    if (scanHistory.length < 2) return null;
    
    const current = scanHistory[0];
    const previous = scanHistory[1];
    
    return {
      EUR: current.balances.EUR - previous.balances.EUR,
      USD: current.balances.USD - previous.balances.USD,
      GBP: current.balances.GBP - previous.balances.GBP,
      BTC: current.balances.BTC - previous.balances.BTC,
      ETH: current.balances.ETH - previous.balances.ETH,
      total: calculateTotalValueEUR() - (previous.balances.EUR + 
             (previous.balances.USD * realTimeRates.ETH.USD / realTimeRates.ETH.EUR) + 
             (previous.balances.GBP * realTimeRates.ETH.GBP / realTimeRates.ETH.EUR) +
             (previous.balances.BTC * realTimeRates.BTC.EUR) +
             (previous.balances.ETH * realTimeRates.ETH.EUR))
    };
  };

  const trends = calculateTrends();

  return (
    <div className="space-y-6">
      {/* Panel Principal de Tendencias de Balance */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400">📈 Tendencias de Balance - DTC1B 800GB</span>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              ESCANEO TOTAL
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado del Escaneo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Estado del Escaneo DTC1B</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {trendsData?.progress.percentage.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Progreso</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {trendsData?.progress.bytesProcessed ? 
                    (trendsData.progress.bytesProcessed / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : 
                    '0 GB'
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Procesado</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {trendsData?.progress.estimatedRemaining ? 
                    Math.round(trendsData.progress.estimatedRemaining) + ' min' : 
                    'N/A'
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tiempo Restante</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {trendsData?.progress.averageSpeedMBps.toFixed(2) || 0} MB/s
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Velocidad</div>
              </div>
            </div>
          </div>

          {/* Balances Totales Escaneados */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Balances Totales Escaneados del DTC1B</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(trendsData?.balances.EUR || 0, 'EUR')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">EUR Total</div>
                {trends && (
                  <div className={`text-xs ${trends.EUR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trends.EUR >= 0 ? '+' : ''}{formatCurrency(trends.EUR, 'EUR')}
                  </div>
                )}
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(trendsData?.balances.USD || 0, 'USD')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">USD Total</div>
                {trends && (
                  <div className={`text-xs ${trends.USD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trends.USD >= 0 ? '+' : ''}{formatCurrency(trends.USD, 'USD')}
                  </div>
                )}
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(trendsData?.balances.GBP || 0, 'GBP')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">GBP Total</div>
                {trends && (
                  <div className={`text-xs ${trends.GBP >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trends.GBP >= 0 ? '+' : ''}{formatCurrency(trends.GBP, 'GBP')}
                  </div>
                )}
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {(trendsData?.balances.BTC || 0).toFixed(8)} BTC
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">BTC Total</div>
                {trends && (
                  <div className={`text-xs ${trends.BTC >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trends.BTC >= 0 ? '+' : ''}{trends.BTC.toFixed(8)} BTC
                  </div>
                )}
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                  {(trendsData?.balances.ETH || 0).toFixed(8)} ETH
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ETH Total</div>
                {trends && (
                  <div className={`text-xs ${trends.ETH >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trends.ETH >= 0 ? '+' : ''}{trends.ETH.toFixed(8)} ETH
                  </div>
                )}
              </div>
            </div>
            
            {/* Valor Total en EUR */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(totalValueEUR, 'EUR')}
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400">
                Valor Total Escaneado (Convertido a EUR)
              </div>
              {trends && (
                <div className={`text-sm mt-2 ${trends.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Tendencia: {trends.total >= 0 ? '+' : ''}{formatCurrency(trends.total, 'EUR')}
                </div>
              )}
              <div className="text-sm text-gray-500 mt-2">
                Basado en tasas de cambio en tiempo real
              </div>
            </div>
          </div>

          {/* Estadísticas del Escaneo */}
          {trendsData && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Estadísticas del Escaneo DTC1B</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {trendsData.statistics.balancesFound.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Balances</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {trendsData.statistics.transactionsFound.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Transacciones</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {trendsData.statistics.accountsFound.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Cuentas</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {trendsData.statistics.ethereumWalletsFound.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Wallets ETH</div>
                </div>
              </div>
            </div>
          )}

          {/* Controles del Escaneo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Controles del Escaneo DTC1B</h3>
            <div className="flex gap-4">
              <Button 
                onClick={startCompleteScan}
                disabled={isScanning || scanStatus === 'running'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isScanning ? '🔄 Iniciando...' : '🔍 Iniciar Escaneo Completo DTC1B'}
              </Button>
              
              <Button 
                onClick={loadTrendsData}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                🔄 Actualizar Tendencias
              </Button>
            </div>
          </div>

          {/* Barra de Progreso */}
          {trendsData && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso del Escaneo DTC1B</span>
                <span>{trendsData.progress.currentBlock} / {trendsData.progress.totalBlocks} bloques</span>
              </div>
              <Progress value={trendsData.progress.percentage} className="h-4" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Velocidad: {trendsData.progress.averageSpeedMBps.toFixed(2)} MB/s</span>
                <span>Memoria: {trendsData.progress.memoryUsageMB.toFixed(0)} MB</span>
              </div>
            </div>
          )}

          {/* Historial de Escaneos */}
          {scanHistory.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Historial de Escaneos</h3>
              <div className="space-y-2">
                {scanHistory.slice(0, 5).map((scan, index) => (
                  <div key={scan.scanId} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'default' : 'outline'}>
                        {index === 0 ? 'Actual' : `#${index + 1}`}
                      </Badge>
                      <span className="text-sm font-medium">{scan.scanId}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(scan.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(scan.balances.EUR + scan.balances.USD + scan.balances.GBP, 'EUR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información del Escaneo */}
          <Card className="border-gray-200 bg-gray-50 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-600 dark:text-gray-400">Información del Escaneo DTC1B</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 dark:text-gray-400">
              <div className="space-y-2">
                <div><strong>Archivo:</strong> DTC1B (800GB)</div>
                <div><strong>Modo:</strong> Escaneo Completo de Tendencias</div>
                <div><strong>Bloques:</strong> {trendsData?.progress.totalBlocks || 16384} bloques estimados</div>
                <div><strong>Tamaño por Bloque:</strong> 100MB</div>
                <div><strong>Procesamiento:</strong> Optimizado (4 jobs simultáneos)</div>
                <div><strong>Patrones:</strong> EUR, USD, GBP, BTC, ETH, Transacciones, Cuentas, Wallets</div>
                <div><strong>Objetivo:</strong> Extraer TODOS los balances para análisis de tendencias</div>
                <div><strong>Uso:</strong> Estos balances se utilizan para realizar swaps</div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}





