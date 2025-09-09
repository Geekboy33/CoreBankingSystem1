'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatCurrency } from '../utils/formatters';

interface PurchaseOrder {
  id: string;
  fromCurrency: string;
  fromAmount: number;
  ethAmount: number;
  exchangeRate: number;
  fee: number;
  totalCost: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionHash: string;
  timestamp: string;
  provider: string;
}

interface EthereumPurchaseProps {
  balances: Array<{
    currency: string;
    amount: number;
    change24h: number;
    changePercent: number;
  }>;
}

export default function EthereumPurchase({ balances }: EthereumPurchaseProps) {
  const [purchaseForm, setPurchaseForm] = useState({
    fromCurrency: 'EUR',
    fromAmount: 0,
    ethAmount: 0,
    slippage: 0.5,
    provider: 'coinbase' as 'coinbase' | 'binance' | 'kraken'
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [realTimeRates, setRealTimeRates] = useState<{
    ETH: { EUR: number; USD: number; GBP: number };
  }>({
    ETH: { EUR: 0, USD: 0, GBP: 0 }
  });

  const [availableProviders, setAvailableProviders] = useState([
    { id: 'coinbase', name: 'Coinbase Pro', fee: 0.5, minAmount: 10 },
    { id: 'binance', name: 'Binance', fee: 0.1, minAmount: 5 },
    { id: 'kraken', name: 'Kraken', fee: 0.26, minAmount: 10 }
  ]);

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
    const interval = setInterval(fetchRealTimeRates, 15000); // Actualizar cada 15 segundos

    return () => clearInterval(interval);
  }, []);

  // Calcular cantidad de ETH que se puede comprar
  const calculateETHAmount = () => {
    if (purchaseForm.fromAmount <= 0 || !realTimeRates.ETH[purchaseForm.fromCurrency as keyof typeof realTimeRates.ETH]) {
      return 0;
    }
    
    const rate = realTimeRates.ETH[purchaseForm.fromCurrency as keyof typeof realTimeRates.ETH];
    const ethAmount = purchaseForm.fromAmount / rate;
    
    // Aplicar slippage
    const slippageAmount = ethAmount * (purchaseForm.slippage / 100);
    return ethAmount - slippageAmount;
  };

  // Calcular fee del provider
  const calculateFee = () => {
    const provider = availableProviders.find(p => p.id === purchaseForm.provider);
    if (!provider) return 0;
    
    return purchaseForm.fromAmount * (provider.fee / 100);
  };

  // Calcular costo total
  const calculateTotalCost = () => {
    return purchaseForm.fromAmount + calculateFee();
  };

  // Verificar si hay suficiente balance
  const hasSufficientBalance = () => {
    const balance = balances.find(b => b.currency === purchaseForm.fromCurrency);
    return balance && balance.amount >= calculateTotalCost();
  };

  // Ejecutar compra de Ethereum
  const executePurchase = async () => {
    if (!hasSufficientBalance()) {
      alert('Balance insuficiente para realizar la compra');
      return;
    }

    setIsPurchasing(true);
    
    try {
      const ethAmount = calculateETHAmount();
      const fee = calculateFee();
      const totalCost = calculateTotalCost();

      const purchaseOrder: PurchaseOrder = {
        id: Math.random().toString(36).substr(2, 9),
        fromCurrency: purchaseForm.fromCurrency,
        fromAmount: purchaseForm.fromAmount,
        ethAmount: ethAmount,
        exchangeRate: realTimeRates.ETH[purchaseForm.fromCurrency as keyof typeof realTimeRates.ETH],
        fee: fee,
        totalCost: totalCost,
        status: 'pending',
        transactionHash: '',
        timestamp: new Date().toISOString(),
        provider: purchaseForm.provider
      };

      // Enviar orden de compra a API
      const response = await fetch('/api/ethereum/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseOrder,
          provider: purchaseForm.provider
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Purchase executed:', result);
        
        // Actualizar estado de la orden
        purchaseOrder.status = 'completed';
        purchaseOrder.transactionHash = result.transactionHash;
        
        setPurchaseOrders(prev => [purchaseOrder, ...prev]);
        
        // Actualizar balance local (en un sistema real vendría del backend)
        alert(`Compra exitosa! Compraste ${purchaseOrder.ethAmount.toFixed(8)} ETH por ${formatCurrency(purchaseOrder.totalCost, purchaseOrder.fromCurrency)}`);
        
        // Limpiar formulario
        setPurchaseForm(prev => ({ ...prev, fromAmount: 0, ethAmount: 0 }));
      } else {
        throw new Error('Error ejecutando compra');
      }

    } catch (error) {
      console.error('Error executing purchase:', error);
      alert('Error ejecutando la compra');
    } finally {
      setIsPurchasing(false);
    }
  };

  const ethAmount = calculateETHAmount();
  const fee = calculateFee();
  const totalCost = calculateTotalCost();
  const selectedProvider = availableProviders.find(p => p.id === purchaseForm.provider);

  return (
    <div className="space-y-6">
      {/* Panel Principal de Compra */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">💰 Comprar Ethereum con Balances</span>
            <Badge variant="outline" className="text-green-600 border-green-600">
              COMPRA REAL
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selección de Provider */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">1. Seleccionar Exchange</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableProviders.map((provider) => (
                <Card 
                  key={provider.id}
                  className={`cursor-pointer transition-all ${purchaseForm.provider === provider.id ? 'border-green-500 bg-green-100 dark:bg-green-900/30' : 'border-gray-200'}`}
                  onClick={() => setPurchaseForm(prev => ({ ...prev, provider: provider.id as any }))}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">
                      {provider.id === 'coinbase' ? '🟦' : 
                       provider.id === 'binance' ? '🟡' : '🟠'}
                    </div>
                    <div className="font-semibold">{provider.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Fee: {provider.fee}% | Min: {provider.minAmount} {purchaseForm.fromCurrency}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Formulario de Compra */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">2. Configurar Compra</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Divisa a Usar</label>
                <select
                  value={purchaseForm.fromCurrency}
                  onChange={(e) => setPurchaseForm(prev => ({ ...prev, fromCurrency: e.target.value }))}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  aria-label="Seleccionar divisa"
                >
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dólar)</option>
                  <option value="GBP">GBP (Libra)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Cantidad a Gastar</label>
                <input
                  type="number"
                  value={purchaseForm.fromAmount}
                  onChange={(e) => setPurchaseForm(prev => ({ ...prev, fromAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  aria-label="Cantidad a gastar"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Balance disponible: {balances.find(b => b.currency === purchaseForm.fromCurrency)?.amount.toFixed(2) || 0} {purchaseForm.fromCurrency}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Slippage (%)</label>
                <input
                  type="number"
                  value={purchaseForm.slippage}
                  onChange={(e) => setPurchaseForm(prev => ({ ...prev, slippage: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="0.5"
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  aria-label="Porcentaje de slippage"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tasa Actual</label>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {realTimeRates.ETH[purchaseForm.fromCurrency as keyof typeof realTimeRates.ETH]?.toFixed(2)} {purchaseForm.fromCurrency}/ETH
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de Compra */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-blue-600 dark:text-blue-400">Resumen de Compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Cantidad a gastar:</span>
                <span className="font-semibold">{formatCurrency(purchaseForm.fromAmount, purchaseForm.fromCurrency)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Fee ({selectedProvider?.name}):</span>
                <span>-{formatCurrency(fee, purchaseForm.fromCurrency)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Slippage:</span>
                <span>-{purchaseForm.slippage}%</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total a pagar:</span>
                <span className="text-red-600">{formatCurrency(totalCost, purchaseForm.fromCurrency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>ETH a recibir:</span>
                <span className="text-green-600">{ethAmount.toFixed(8)} ETH</span>
              </div>
            </CardContent>
          </Card>

          {/* Botón de Compra */}
          <Button 
            onClick={executePurchase}
            disabled={isPurchasing || !hasSufficientBalance() || purchaseForm.fromAmount <= 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
          >
            {isPurchasing ? '🔄 Procesando Compra...' : `💳 Comprar ${ethAmount.toFixed(8)} ETH por ${formatCurrency(totalCost, purchaseForm.fromCurrency)}`}
          </Button>

          {!hasSufficientBalance() && purchaseForm.fromAmount > 0 && (
            <div className="text-red-600 text-sm text-center">
              ❌ Balance insuficiente para realizar esta compra
            </div>
          )}

          {purchaseForm.fromAmount > 0 && purchaseForm.fromAmount < (selectedProvider?.minAmount || 0) && (
            <div className="text-orange-600 text-sm text-center">
              ⚠️ Cantidad mínima requerida: {selectedProvider?.minAmount} {purchaseForm.fromCurrency}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Compras */}
      {purchaseOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋 Historial de Compras</span>
              <Badge variant="outline" className="text-purple-600 border-purple-600">
                {purchaseOrders.length} compras
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {purchaseOrders.map((order) => (
                <div key={order.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Compra</div>
                      <div className="font-semibold">
                        {formatCurrency(order.fromAmount, order.fromCurrency)} → {order.ethAmount.toFixed(8)} ETH
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Estado</div>
                      <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'outline' : 'destructive'}>
                        {order.status === 'completed' ? 'Completada' : order.status === 'pending' ? 'Pendiente' : 'Fallida'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Provider</div>
                      <div className="font-medium">{order.provider}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(order.timestamp).toLocaleString()} | Fee: {formatCurrency(order.fee, order.fromCurrency)} | Hash: {order.transactionHash}
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
            <span>📊 Tasas de Compra en Tiempo Real</span>
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

      {/* Comparación de Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚖️ Comparación de Exchanges</span>
            <Badge variant="outline" className="text-gray-600 border-gray-600">
              ANÁLISIS
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Exchange</th>
                  <th className="text-left p-2">Fee</th>
                  <th className="text-left p-2">Min. Compra</th>
                  <th className="text-left p-2">Velocidad</th>
                  <th className="text-left p-2">Seguridad</th>
                </tr>
              </thead>
              <tbody>
                {availableProviders.map((provider) => (
                  <tr key={provider.id} className="border-b">
                    <td className="p-2 font-medium">{provider.name}</td>
                    <td className="p-2">{provider.fee}%</td>
                    <td className="p-2">{provider.minAmount} {purchaseForm.fromCurrency}</td>
                    <td className="p-2">
                      {provider.id === 'binance' ? '⚡ Instantáneo' : 
                       provider.id === 'coinbase' ? '🔄 1-2 min' : '⏱️ 5-10 min'}
                    </td>
                    <td className="p-2">
                      {provider.id === 'coinbase' ? '🛡️ Alta' : 
                       provider.id === 'binance' ? '🔒 Media' : '🔐 Alta'}
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





