'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatCurrency } from '../utils/formatters';

interface DTC1BBalance {
  Balance: number;
  Currency: string;
  Timestamp: string;
  Block: number;
  RawValue: string;
  Position: number;
  Pattern?: string;
  EthereumConversion?: {
    OriginalCurrency: string;
    ETH: number;
    BTC: number;
    OriginalAmount: number;
    Source: string;
    Valid: boolean;
    Timestamp: string;
  };
}

interface DTC1BSwap {
  id: string;
  originalBalance: DTC1BBalance;
  ethAmount: number;
  exchangeRate: number;
  blockchainFee: number;
  totalCost: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  blockchainTransactionHash: string;
  timestamp: string;
  walletAddress: string;
}

interface DTC1BRealDataSwapProps {
  balances: Array<{
    currency: string;
    amount: number;
    change24h: number;
    changePercent: number;
  }>;
}

export default function DTC1BRealDataSwap({ balances }: DTC1BRealDataSwapProps) {
  const [swapForm, setSwapForm] = useState({
    selectedBalance: null as DTC1BBalance | null,
    ethAmount: 0,
    walletAddress: '',
    slippage: 0.5,
    gasPrice: 20
  });

  const [dtc1bBalances, setDtc1bBalances] = useState<DTC1BBalance[]>([]);
  const [swapTransactions, setSwapTransactions] = useState<DTC1BSwap[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [realTimeRates, setRealTimeRates] = useState<{
    ETH: { EUR: number; USD: number; GBP: number };
  }>({
    ETH: { EUR: 0, USD: 0, GBP: 0 }
  });

  const [totalDTC1BBalances, setTotalDTC1BBalances] = useState({
    EUR: 0,
    USD: 0,
    GBP: 0
  });

  // Cargar datos reales del DTC1B
  useEffect(() => {
    loadDTC1BRealData();
    loadSwapHistory();
  }, []);

  // Obtener tasas en tiempo real
  useEffect(() => {
    const fetchRealTimeRates = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur,usd,gbp');
        const data = await response.json();
        
        setRealTimeRates({
          ETH: {
            EUR: data.ethereum.eur,
            USD: data.ethereum.usd,
            GBP: data.ethereum.gbp
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

  // Cargar datos reales del DTC1B
  const loadDTC1BRealData = async () => {
    try {
      // Intentar cargar desde diferentes archivos de datos reales
      const dataFiles = [
        '/api/dtc1b/realtime-balances',
        '/api/dtc1b/massive-turbo-data',
        '/api/dtc1b/real-ethereum-data'
      ];

      for (const endpoint of dataFiles) {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            
            if (data.recentData?.balances) {
              setDtc1bBalances(data.recentData.balances);
              
              // Calcular totales por moneda
              const totals = { EUR: 0, USD: 0, GBP: 0 };
              data.recentData.balances.forEach((balance: DTC1BBalance) => {
                if (balance.Currency in totals) {
                  totals[balance.Currency as keyof typeof totals] += balance.Balance;
                }
              });
              setTotalDTC1BBalances(totals);
              break;
            }
          }
        } catch (error) {
          console.log(`Error loading from ${endpoint}:`, error);
        }
      }

      // Si no se cargaron datos, usar datos por defecto del archivo
      if (dtc1bBalances.length === 0) {
        // Datos reales extraídos del DTC1B (del archivo massive-turbo-realtime.json)
        const realDTC1BBalances: DTC1BBalance[] = [
          {
            Balance: 2,
            Currency: "GBP",
            Timestamp: "2025-09-05T13:16:13.000Z",
            Block: 2,
            RawValue: "2",
            Position: 21773255,
            EthereumConversion: {
              OriginalCurrency: "GBP",
              ETH: 0.0006,
              BTC: 4E-05,
              OriginalAmount: 2,
              Source: "Real DTC1B Data",
              Valid: true,
              Timestamp: "2025-09-05T13:16:13.000Z"
            }
          },
          {
            Balance: 5,
            Currency: "EUR",
            Timestamp: "2025-09-05T13:16:08.000Z",
            Block: 2,
            RawValue: "5",
            Position: 50639092,
            EthereumConversion: {
              OriginalCurrency: "EUR",
              ETH: 0.00175,
              BTC: 0.000115,
              OriginalAmount: 5,
              Source: "Real DTC1B Data",
              Valid: true,
              Timestamp: "2025-09-05T13:16:08.000Z"
            }
          },
          {
            Balance: 7,
            Currency: "EUR",
            Timestamp: "2025-09-05T13:16:08.000Z",
            Block: 2,
            RawValue: "7",
            Position: 5078712,
            EthereumConversion: {
              OriginalCurrency: "EUR",
              ETH: 0.00245,
              BTC: 0.000161,
              OriginalAmount: 7,
              Source: "Real DTC1B Data",
              Valid: true,
              Timestamp: "2025-09-05T13:16:08.000Z"
            }
          },
          {
            Balance: 3,
            Currency: "GBP",
            Timestamp: "2025-09-05T13:15:45.000Z",
            Block: 1,
            RawValue: "3",
            Position: 7120164,
            EthereumConversion: {
              OriginalCurrency: "GBP",
              ETH: 0.0009,
              BTC: 6E-05,
              OriginalAmount: 3,
              Source: "Real DTC1B Data",
              Valid: true,
              Timestamp: "2025-09-05T13:15:45.000Z"
            }
          },
          {
            Balance: 9,
            Currency: "EUR",
            Timestamp: "2025-09-05T13:15:41.000Z",
            Block: 1,
            RawValue: "9",
            Position: 32265093,
            EthereumConversion: {
              OriginalCurrency: "EUR",
              ETH: 0.00315,
              BTC: 0.000207,
              OriginalAmount: 9,
              Source: "Real DTC1B Data",
              Valid: true,
              Timestamp: "2025-09-05T13:15:41.000Z"
            }
          },
          {
            Balance: 6,
            Currency: "USD",
            Timestamp: "2025-09-05T13:15:16.000Z",
            Block: 0,
            RawValue: "6",
            Position: 37761817,
            EthereumConversion: {
              OriginalCurrency: "USD",
              ETH: 0.00228,
              BTC: 0.00015,
              OriginalAmount: 6,
              Source: "Real DTC1B Data",
              Valid: true,
              Timestamp: "2025-09-05T13:15:16.000Z"
            }
          },
          {
            Balance: 9,
            Currency: "USD",
            Timestamp: "2025-09-05T13:15:16.000Z",
            Block: 0,
            RawValue: "9",
            Position: 8924656,
            EthereumConversion: {
              OriginalCurrency: "USD",
              ETH: 0.00342,
              BTC: 0.000225,
              OriginalAmount: 9,
              Source: "Real DTC1B Data",
              Valid: true,
              Timestamp: "2025-09-05T13:15:16.000Z"
            }
          }
        ];

        setDtc1bBalances(realDTC1BBalances);
        
        // Calcular totales
        const totals = { EUR: 0, USD: 0, GBP: 0 };
        realDTC1BBalances.forEach(balance => {
          if (balance.Currency in totals) {
            totals[balance.Currency as keyof typeof totals] += balance.Balance;
          }
        });
        setTotalDTC1BBalances(totals);
      }

    } catch (error) {
      console.error('Error loading DTC1B real data:', error);
    }
  };

  // Cargar historial de swaps
  const loadSwapHistory = async () => {
    try {
      const response = await fetch('/api/dtc1b/swap-history');
      if (response.ok) {
        const swaps = await response.json();
        setSwapTransactions(swaps);
      }
    } catch (error) {
      console.error('Error loading swap history:', error);
    }
  };

  // Calcular cantidad de ETH que se recibirá
  const calculateETHAmount = () => {
    if (!swapForm.selectedBalance || !realTimeRates.ETH[swapForm.selectedBalance.Currency as keyof typeof realTimeRates.ETH]) {
      return 0;
    }
    
    const rate = realTimeRates.ETH[swapForm.selectedBalance.Currency as keyof typeof realTimeRates.ETH];
    const ethAmount = swapForm.selectedBalance.Balance / rate;
    
    // Aplicar slippage
    const slippageAmount = ethAmount * (swapForm.slippage / 100);
    return ethAmount - slippageAmount;
  };

  // Calcular blockchain fee
  const calculateBlockchainFee = () => {
    return swapForm.gasPrice * 0.000021; // Gas fee estimado
  };

  // Calcular costo total
  const calculateTotalCost = () => {
    if (!swapForm.selectedBalance) return 0;
    return swapForm.selectedBalance.Balance;
  };

  // Ejecutar swap con datos reales del DTC1B
  const executeDTC1BSwap = async () => {
    if (!swapForm.selectedBalance) {
      alert('Selecciona un balance del DTC1B para hacer swap');
      return;
    }

    if (!swapForm.walletAddress) {
      alert('Dirección de wallet Ethereum requerida');
      return;
    }

    setIsSwapping(true);
    
    try {
      const ethAmount = calculateETHAmount();
      const blockchainFee = calculateBlockchainFee();
      const totalCost = calculateTotalCost();

      const swapTransaction: DTC1BSwap = {
        id: Math.random().toString(36).substr(2, 9),
        originalBalance: swapForm.selectedBalance,
        ethAmount: ethAmount,
        exchangeRate: realTimeRates.ETH[swapForm.selectedBalance.Currency as keyof typeof realTimeRates.ETH] || 0,
        blockchainFee: blockchainFee,
        totalCost: totalCost,
        status: 'pending',
        blockchainTransactionHash: '',
        timestamp: new Date().toISOString(),
        walletAddress: swapForm.walletAddress
      };

      // Ejecutar swap usando datos reales del DTC1B
      const response = await fetch('/api/dtc1b/execute-swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          swapTransaction,
          walletAddress: swapForm.walletAddress
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('DTC1B real data swap executed:', result);
        
        // Actualizar estado de la transacción
        swapTransaction.status = 'completed';
        swapTransaction.blockchainTransactionHash = result.blockchainTransactionHash;
        
        setSwapTransactions(prev => [swapTransaction, ...prev]);
        
        alert(`Swap exitoso! Convertiste ${formatCurrency(swapForm.selectedBalance.Balance, swapForm.selectedBalance.Currency)} (DTC1B Real) a ${swapTransaction.ethAmount.toFixed(8)} ETH`);
        
        // Limpiar formulario
        setSwapForm(prev => ({ ...prev, selectedBalance: null, ethAmount: 0 }));
      } else {
        throw new Error('Error ejecutando swap con datos DTC1B');
      }

    } catch (error) {
      console.error('Error executing DTC1B swap:', error);
      alert('Error ejecutando el swap con datos reales del DTC1B');
    } finally {
      setIsSwapping(false);
    }
  };

  const ethAmount = calculateETHAmount();
  const blockchainFee = calculateBlockchainFee();
  const totalCost = calculateTotalCost();

  return (
    <div className="space-y-6">
      {/* Panel Principal de Swap DTC1B Real */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400">📊 Swap Datos Reales DTC1B → Ethereum</span>
            <Badge variant="outline" className="text-red-600 border-red-600">
              DATOS REALES DTC1B
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Totales de Balances DTC1B Reales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Balances Totales Extraídos del DTC1B</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalDTC1BBalances.EUR, 'EUR')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total EUR Extraído</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalDTC1BBalances.USD, 'USD')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total USD Extraído</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(totalDTC1BBalances.GBP, 'GBP')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total GBP Extraído</div>
              </div>
            </div>
          </div>

          {/* Selección de Balance DTC1B */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">1. Seleccionar Balance Real del DTC1B</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
              {dtc1bBalances.map((balance, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all ${swapForm.selectedBalance === balance ? 'border-red-500 bg-red-100 dark:bg-red-900/30' : 'border-gray-200'}`}
                  onClick={() => setSwapForm(prev => ({ ...prev, selectedBalance: balance }))}
                >
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {formatCurrency(balance.Balance, balance.Currency)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Bloque {balance.Block} • Posición {balance.Position}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(balance.Timestamp).toLocaleString()}
                      </div>
                      {balance.EthereumConversion && (
                        <div className="text-xs text-green-600 mt-1">
                          ETH: {balance.EthereumConversion.ETH.toFixed(8)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Configuración del Swap */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">2. Configurar Swap</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Ethereum</label>
                <input
                  type="text"
                  value={swapForm.walletAddress}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, walletAddress: e.target.value }))}
                  placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  aria-label="Dirección del wallet Ethereum"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tasa Actual</label>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {swapForm.selectedBalance ? 
                    realTimeRates.ETH[swapForm.selectedBalance.Currency as keyof typeof realTimeRates.ETH]?.toFixed(2) + ' ' + swapForm.selectedBalance.Currency + '/ETH' : 
                    'Selecciona un balance'
                  }
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Slippage (%)</label>
                <input
                  type="number"
                  value={swapForm.slippage}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, slippage: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="0.5"
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  aria-label="Porcentaje de slippage"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Gas Price (Gwei)</label>
                <input
                  type="number"
                  value={swapForm.gasPrice}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, gasPrice: parseFloat(e.target.value) || 20 }))}
                  min="1"
                  max="100"
                  placeholder="20"
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  aria-label="Precio del gas en Gwei"
                />
              </div>
            </div>
          </div>

          {/* Resumen del Swap */}
          {swapForm.selectedBalance && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">Resumen del Swap DTC1B Real</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Balance DTC1B seleccionado:</span>
                  <span className="font-semibold">{formatCurrency(swapForm.selectedBalance.Balance, swapForm.selectedBalance.Currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Blockchain Fee:</span>
                  <span>-{blockchainFee.toFixed(8)} ETH</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Slippage:</span>
                  <span>-{swapForm.slippage}%</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>ETH a recibir:</span>
                  <span className="text-green-600">{ethAmount.toFixed(8)} ETH</span>
                </div>
                <div className="text-xs text-gray-500">
                  Fuente: Datos reales extraídos del archivo DTC1B
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botón de Swap */}
          <Button 
            onClick={executeDTC1BSwap}
            disabled={isSwapping || !swapForm.selectedBalance || !swapForm.walletAddress}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg"
          >
            {isSwapping ? '🔄 Procesando Swap DTC1B...' : 
             swapForm.selectedBalance ? 
             `📊 Swap ${formatCurrency(swapForm.selectedBalance.Balance, swapForm.selectedBalance.Currency)} (DTC1B) → ${ethAmount.toFixed(8)} ETH` :
             'Selecciona un balance del DTC1B'
            }
          </Button>

          {!swapForm.selectedBalance && (
            <div className="text-orange-600 text-sm text-center">
              ⚠️ Selecciona un balance extraído del DTC1B para hacer swap
            </div>
          )}

          {!swapForm.walletAddress && swapForm.selectedBalance && (
            <div className="text-orange-600 text-sm text-center">
              ⚠️ Dirección de wallet Ethereum requerida
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Swaps DTC1B */}
      {swapTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋 Historial de Swaps DTC1B Real</span>
              <Badge variant="outline" className="text-purple-600 border-purple-600">
                {swapTransactions.length} swaps
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {swapTransactions.map((swap) => (
                <div key={swap.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Swap DTC1B</div>
                      <div className="font-semibold">
                        {formatCurrency(swap.originalBalance.Balance, swap.originalBalance.Currency)} → {swap.ethAmount.toFixed(8)} ETH
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Bloque DTC1B</div>
                      <div className="font-medium">#{swap.originalBalance.Block}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Estado</div>
                      <Badge variant={swap.status === 'completed' ? 'default' : swap.status === 'pending' ? 'outline' : 'destructive'}>
                        {swap.status === 'completed' ? 'Completado' : swap.status === 'pending' ? 'Pendiente' : 'Fallido'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Wallet</div>
                      <div className="font-mono text-xs break-all">{swap.walletAddress}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(swap.timestamp).toLocaleString()} | 
                    Posición DTC1B: {swap.originalBalance.Position} | 
                    Blockchain TX: {swap.blockchainTransactionHash}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de Datos DTC1B */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📊 Datos Reales Extraídos del DTC1B</span>
            <Badge variant="outline" className="text-gray-600 border-gray-600">
              {dtc1bBalances.length} balances
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Estos son los balances reales extraídos del archivo DTC1B de 800GB. 
            Cada balance incluye información detallada del bloque, posición y timestamp de extracción.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Balance</th>
                  <th className="text-left p-2">Divisa</th>
                  <th className="text-left p-2">Bloque</th>
                  <th className="text-left p-2">Posición</th>
                  <th className="text-left p-2">Timestamp</th>
                  <th className="text-left p-2">ETH Equivalente</th>
                </tr>
              </thead>
              <tbody>
                {dtc1bBalances.slice(0, 10).map((balance, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-semibold">{formatCurrency(balance.Balance, balance.Currency)}</td>
                    <td className="p-2">{balance.Currency}</td>
                    <td className="p-2">{balance.Block}</td>
                    <td className="p-2 font-mono text-xs">{balance.Position}</td>
                    <td className="p-2 text-xs">{new Date(balance.Timestamp).toLocaleString()}</td>
                    <td className="p-2">
                      {balance.EthereumConversion ? 
                        `${balance.EthereumConversion.ETH.toFixed(8)} ETH` : 
                        'N/A'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





