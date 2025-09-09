'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatCurrency } from '../utils/formatters';

interface SwapTransaction {
  id: string;
  fromCurrency: string;
  fromAmount: number;
  toCurrency: string;
  toAmount: number;
  exchangeRate: number;
  gasFee: number;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  walletAddress: string;
}

interface SwapFormData {
  fromCurrency: string;
  fromAmount: number;
  toCurrency: string;
  slippage: number;
  gasPrice: number;
}

interface EthereumSwapProps {
  balances: Array<{
    currency: string;
    amount: number;
    change24h: number;
    changePercent: number;
  }>;
}

export default function EthereumSwap({ balances }: EthereumSwapProps) {
  const [swapForm, setSwapForm] = useState<SwapFormData>({
    fromCurrency: 'EUR',
    fromAmount: 0,
    toCurrency: 'ETH',
    slippage: 0.5,
    gasPrice: 20
  });

  const [swapTransactions, setSwapTransactions] = useState<SwapTransaction[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [realTimeRates, setRealTimeRates] = useState<{
    ETH: { EUR: number; USD: number; GBP: number };
    BTC: { EUR: number; USD: number; GBP: number };
  }>({
    ETH: { EUR: 0, USD: 0, GBP: 0 },
    BTC: { EUR: 0, USD: 0, GBP: 0 }
  });

  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(0);

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
    const interval = setInterval(fetchRealTimeRates, 10000); // Actualizar cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  // Calcular cantidad de ETH que se recibirá
  const calculateETHAmount = () => {
    if (swapForm.fromAmount <= 0 || !realTimeRates.ETH[swapForm.fromCurrency as keyof typeof realTimeRates.ETH]) {
      return 0;
    }
    
    const rate = realTimeRates.ETH[swapForm.fromCurrency as keyof typeof realTimeRates.ETH];
    const ethAmount = swapForm.fromAmount / rate;
    
    // Aplicar slippage
    const slippageAmount = ethAmount * (swapForm.slippage / 100);
    return ethAmount - slippageAmount;
  };

  // Verificar si hay suficiente balance
  const hasSufficientBalance = () => {
    const balance = balances.find(b => b.currency === swapForm.fromCurrency);
    return balance && balance.amount >= swapForm.fromAmount;
  };

  // Ejecutar swap real
  const executeSwap = async () => {
    if (!hasSufficientBalance()) {
      alert('Balance insuficiente para realizar el swap');
      return;
    }

    setIsSwapping(true);
    
    try {
      // Crear transacción de swap
      const swapTransaction: SwapTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        fromCurrency: swapForm.fromCurrency,
        fromAmount: swapForm.fromAmount,
        toCurrency: swapForm.toCurrency,
        toAmount: calculateETHAmount(),
        exchangeRate: realTimeRates.ETH[swapForm.fromCurrency as keyof typeof realTimeRates.ETH],
        gasFee: swapForm.gasPrice * 0.000021, // Gas fee estimado
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        status: 'pending',
        timestamp: new Date().toISOString(),
        walletAddress: walletAddress || '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      };

      // Enviar transacción a blockchain
      const response = await fetch('/api/ethereum/execute-swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          swapTransaction,
          walletAddress,
          gasPrice: swapForm.gasPrice
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Swap executed:', result);
        
        // Actualizar estado de la transacción
        swapTransaction.status = 'confirmed';
        swapTransaction.transactionHash = result.transactionHash;
        
        setSwapTransactions(prev => [swapTransaction, ...prev]);
        
        // Actualizar balance local
        // En un sistema real, esto vendría del backend
        alert(`Swap exitoso! Recibiste ${swapTransaction.toAmount.toFixed(8)} ETH`);
      } else {
        throw new Error('Error ejecutando swap');
      }

    } catch (error) {
      console.error('Error executing swap:', error);
      alert('Error ejecutando el swap');
    } finally {
      setIsSwapping(false);
    }
  };

  const ethAmount = calculateETHAmount();
  const gasFeeETH = swapForm.gasPrice * 0.000021;
  const totalETH = ethAmount - gasFeeETH;

  return (
    <div className="space-y-6">
      {/* Formulario de Swap */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400">🔄 Swap Real de Divisas a ETH</span>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              BLOCKCHAIN REAL
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuración de Wallet */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Configuración de Wallet Ethereum</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Dirección del Wallet</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Balance ETH</label>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {walletBalance.toFixed(8)} ETH
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Swap */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Configurar Swap</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">De (Divisa)</label>
                <select
                  value={swapForm.fromCurrency}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, fromCurrency: e.target.value }))}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  aria-label="Seleccionar divisa de origen"
                >
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dólar)</option>
                  <option value="GBP">GBP (Libra)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Cantidad</label>
                <input
                  type="number"
                  value={swapForm.fromAmount}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, fromAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Balance disponible: {balances.find(b => b.currency === swapForm.fromCurrency)?.amount.toFixed(2) || 0} {swapForm.fromCurrency}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              <div>
                <label className="block text-sm font-medium mb-2">Tasa Actual</label>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {realTimeRates.ETH[swapForm.fromCurrency as keyof typeof realTimeRates.ETH]?.toFixed(2)} {swapForm.fromCurrency}/ETH
                </div>
              </div>
            </div>
          </div>

          {/* Resumen del Swap */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400">Resumen del Swap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Envías:</span>
                <span className="font-semibold">{formatCurrency(swapForm.fromAmount, swapForm.fromCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Recibes:</span>
                <span className="font-semibold text-blue-600">{ethAmount.toFixed(8)} ETH</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Gas Fee:</span>
                <span>-{gasFeeETH.toFixed(8)} ETH</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Slippage:</span>
                <span>-{swapForm.slippage}%</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total ETH:</span>
                <span className="text-green-600">{totalETH.toFixed(8)} ETH</span>
              </div>
            </CardContent>
          </Card>

          {/* Botón de Swap */}
          <Button 
            onClick={executeSwap}
            disabled={isSwapping || !hasSufficientBalance() || swapForm.fromAmount <= 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
          >
            {isSwapping ? 'Ejecutando Swap...' : `Swap ${formatCurrency(swapForm.fromAmount, swapForm.fromCurrency)} → ${totalETH.toFixed(8)} ETH`}
          </Button>

          {!hasSufficientBalance() && swapForm.fromAmount > 0 && (
            <div className="text-red-600 text-sm text-center">
              ❌ Balance insuficiente para realizar este swap
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Swaps */}
      {swapTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋 Historial de Swaps</span>
              <Badge variant="outline" className="text-purple-600 border-purple-600">
                {swapTransactions.length} swaps
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {swapTransactions.map((tx) => (
                <div key={tx.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Swap</div>
                      <div className="font-semibold">
                        {formatCurrency(tx.fromAmount, tx.fromCurrency)} → {tx.toAmount.toFixed(8)} ETH
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Estado</div>
                      <Badge variant={tx.status === 'confirmed' ? 'default' : tx.status === 'pending' ? 'outline' : 'destructive'}>
                        {tx.status === 'confirmed' ? 'Confirmado' : tx.status === 'pending' ? 'Pendiente' : 'Fallido'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Hash</div>
                      <div className="font-mono text-xs break-all">{tx.transactionHash}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(tx.timestamp).toLocaleString()} | Gas: {tx.gasFee.toFixed(8)} ETH
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasas en Tiempo Real */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📊 Tasas de Intercambio en Tiempo Real</span>
            <Badge variant="outline" className="text-green-600 border-green-600">
              LIVE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {realTimeRates.ETH.EUR.toFixed(2)} EUR
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">por 1 ETH</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {realTimeRates.ETH.USD.toFixed(2)} USD
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">por 1 ETH</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {realTimeRates.ETH.GBP.toFixed(2)} GBP
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">por 1 ETH</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
