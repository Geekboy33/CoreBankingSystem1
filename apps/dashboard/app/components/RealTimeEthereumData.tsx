'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { formatCurrency } from '../utils/formatters';

interface RealTimeEthereumData {
  timestamp: string;
  scanId: string;
  mode: string;
  progress: {
    currentBlock: number;
    totalBlocks: number;
    percentage: number;
    elapsedMinutes: number;
    estimatedRemaining: number;
  };
  balances: {
    EUR: number;
    USD: number;
    GBP: number;
    ETH: number;
    BTC: number;
  };
  performance: {
    averageSpeedMBps: number;
    memoryUsageMB: number;
    bytesProcessed: number;
    blocksProcessed: number;
    dataExtracted: number;
    ethereumConversions: number;
    ethereumTransactions: number;
    apiCalls: number;
  };
  statistics: {
    balancesFound: number;
    transactionsFound: number;
    accountsFound: number;
    creditCardsFound: number;
    usersFound: number;
    daesDataFound: number;
    ethereumWalletsFound: number;
    ethereumTransactionsFound: number;
  };
  recentData: {
    balances: any[];
    transactions: any[];
    accounts: any[];
    creditCards: any[];
    users: any[];
    ethereumWallets: any[];
    ethereumTransactions: any[];
  };
}

export default function RealTimeEthereumData() {
  const [data, setData] = useState<RealTimeEthereumData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        const response = await fetch('/api/ethereum/realtime-data');
        if (response.ok) {
          const realTimeData = await response.json();
          setData(realTimeData);
          setLastUpdate(new Date().toLocaleTimeString());
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error fetching real-time data:', error);
        setIsConnected(false);
      }
    };

    // Fetch initial data
    fetchRealTimeData();

    // Set up polling every 3 seconds
    const interval = setInterval(fetchRealTimeData, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-2"></div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Conectando con datos en tiempo real...
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado de Conexión */}
      <Card className={isConnected ? "border-green-200 bg-green-50 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:bg-red-900/20"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className={isConnected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {isConnected ? "🟢" : "🔴"} Datos Ethereum en Tiempo Real
            </span>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "CONECTADO" : "DESCONECTADO"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Última actualización</div>
              <div className="font-medium">{lastUpdate}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Modo</div>
              <div className="font-medium">{data.mode}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Scan ID</div>
              <div className="font-mono text-xs">{data.scanId}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progreso del Escaneo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📊 Progreso del Escaneo Ethereum</span>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {data.progress.percentage.toFixed(1)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${data.progress.percentage}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium">{data.progress.currentBlock}</div>
                <div className="text-gray-600 dark:text-gray-400">Bloques Procesados</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{data.progress.totalBlocks}</div>
                <div className="text-gray-600 dark:text-gray-400">Total Bloques</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{data.progress.elapsedMinutes.toFixed(1)} min</div>
                <div className="text-gray-600 dark:text-gray-400">Tiempo Transcurrido</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{data.progress.estimatedRemaining.toFixed(1)} min</div>
                <div className="text-gray-600 dark:text-gray-400">Tiempo Restante</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balances Totales con Ethereum */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💰 Balances Totales con Ethereum</span>
            <Badge variant="outline" className="text-green-600 border-green-600">
              REAL BLOCKCHAIN
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(data.balances.EUR, 'EUR')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">EUR</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(data.balances.USD, 'USD')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">USD</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(data.balances.GBP, 'GBP')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">GBP</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {data.balances.ETH.toFixed(8)} ETH
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ethereum</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {data.balances.BTC.toFixed(8)} BTC
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Bitcoin</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas de Extracción */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📈 Estadísticas de Extracción</span>
            <Badge variant="outline" className="text-purple-600 border-purple-600">
              {data.statistics.balancesFound + data.statistics.transactionsFound + data.statistics.accountsFound} elementos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {data.statistics.balancesFound}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Balances</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {data.statistics.transactionsFound}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Transacciones</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {data.statistics.accountsFound}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cuentas</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {data.statistics.creditCardsFound}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tarjetas</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {data.statistics.usersFound}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Usuarios</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {data.statistics.ethereumWalletsFound}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Wallets ETH</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {data.statistics.ethereumTransactionsFound}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">TX Ethereum</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                {data.statistics.daesDataFound}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Datos DAES</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rendimiento del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚡ Rendimiento del Sistema</span>
            <Badge variant="outline" className="text-green-600 border-green-600">
              {data.performance.averageSpeedMBps.toFixed(2)} MB/s
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {data.performance.averageSpeedMBps.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">MB/s</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {data.performance.memoryUsageMB.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">MB Memoria</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {data.performance.ethereumConversions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Conversiones ETH</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {data.performance.ethereumTransactions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">TX Blockchain</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos Recientes */}
      {data.recentData.balances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🔄 Datos Recientes Extraídos</span>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Últimos {data.recentData.balances.length} elementos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentData.balances.slice(0, 5).map((balance, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">
                      {formatCurrency(balance.Balance, balance.Currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Bloque {balance.Block}
                    </div>
                  </div>
                  {balance.EthereumConversion && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {balance.EthereumConversion.ETH.toFixed(8)} ETH
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}





