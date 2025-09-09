'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatCurrency } from '../utils/formatters';

interface CoreBankingSwap {
  id: string;
  coreAccountId: string;
  coreBalance: number;
  coreCurrency: string;
  ethAmount: number;
  exchangeRate: number;
  coreFee: number;
  blockchainFee: number;
  totalCost: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  coreTransactionId: string;
  blockchainTransactionHash: string;
  timestamp: string;
  walletAddress: string;
}

interface CoreBankingAccount {
  id: string;
  accountNumber: string;
  currency: string;
  balance: number;
  availableBalance: number;
  accountType: 'checking' | 'savings' | 'investment';
  status: 'active' | 'suspended' | 'closed';
}

interface CoreBankingSwapProps {
  balances: Array<{
    currency: string;
    amount: number;
    change24h: number;
    changePercent: number;
  }>;
}

export default function CoreBankingSwap({ balances }: CoreBankingSwapProps) {
  const [swapForm, setSwapForm] = useState({
    coreAccountId: '',
    coreAmount: 0,
    ethAmount: 0,
    walletAddress: '',
    slippage: 0.5,
    gasPrice: 20
  });

  const [coreAccounts, setCoreAccounts] = useState<CoreBankingAccount[]>([]);
  const [swapTransactions, setSwapTransactions] = useState<CoreBankingSwap[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [realTimeRates, setRealTimeRates] = useState<{
    ETH: { EUR: number; USD: number; GBP: number };
  }>({
    ETH: { EUR: 0, USD: 0, GBP: 0 }
  });

  // Cargar cuentas del Core Banking
  useEffect(() => {
    loadCoreBankingAccounts();
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

  // Cargar cuentas del Core Banking
  const loadCoreBankingAccounts = async () => {
    try {
      const response = await fetch('/api/core-banking/accounts');
      if (response.ok) {
        const accounts = await response.json();
        setCoreAccounts(accounts);
        
        // Seleccionar primera cuenta por defecto
        if (accounts.length > 0) {
          setSwapForm(prev => ({ ...prev, coreAccountId: accounts[0].id }));
        }
      } else {
        // Datos de ejemplo si no hay API
        const mockAccounts: CoreBankingAccount[] = [
          {
            id: 'core_acc_001',
            accountNumber: 'ES1234567890123456789012',
            currency: 'EUR',
            balance: 50000.00,
            availableBalance: 45000.00,
            accountType: 'checking',
            status: 'active'
          },
          {
            id: 'core_acc_002',
            accountNumber: 'US1234567890123456789012',
            currency: 'USD',
            balance: 75000.00,
            availableBalance: 70000.00,
            accountType: 'savings',
            status: 'active'
          },
          {
            id: 'core_acc_003',
            accountNumber: 'GB1234567890123456789012',
            currency: 'GBP',
            balance: 30000.00,
            availableBalance: 28000.00,
            accountType: 'investment',
            status: 'active'
          }
        ];
        setCoreAccounts(mockAccounts);
        setSwapForm(prev => ({ ...prev, coreAccountId: mockAccounts[0].id }));
      }
    } catch (error) {
      console.error('Error loading Core Banking accounts:', error);
    }
  };

  // Cargar historial de swaps
  const loadSwapHistory = async () => {
    try {
      const response = await fetch('/api/core-banking/swap-history');
      if (response.ok) {
        const swaps = await response.json();
        setSwapTransactions(swaps);
      }
    } catch (error) {
      console.error('Error loading swap history:', error);
    }
  };

  // Obtener cuenta seleccionada
  const selectedAccount = coreAccounts.find(acc => acc.id === swapForm.coreAccountId);

  // Calcular cantidad de ETH que se recibirá
  const calculateETHAmount = () => {
    if (swapForm.coreAmount <= 0 || !selectedAccount || !realTimeRates.ETH[selectedAccount.currency as keyof typeof realTimeRates.ETH]) {
      return 0;
    }
    
    const rate = realTimeRates.ETH[selectedAccount.currency as keyof typeof realTimeRates.ETH];
    const ethAmount = swapForm.coreAmount / rate;
    
    // Aplicar slippage
    const slippageAmount = ethAmount * (swapForm.slippage / 100);
    return ethAmount - slippageAmount;
  };

  // Calcular fees
  const calculateFees = () => {
    const coreFee = swapForm.coreAmount * 0.001; // 0.1% fee del Core Banking
    const blockchainFee = swapForm.gasPrice * 0.000021; // Gas fee estimado
    return { coreFee, blockchainFee };
  };

  // Calcular costo total
  const calculateTotalCost = () => {
    const fees = calculateFees();
    return swapForm.coreAmount + fees.coreFee;
  };

  // Verificar si hay suficiente balance
  const hasSufficientBalance = () => {
    if (!selectedAccount) return false;
    return selectedAccount.availableBalance >= calculateTotalCost();
  };

  // Ejecutar swap del Core Banking
  const executeCoreBankingSwap = async () => {
    if (!hasSufficientBalance()) {
      alert('Balance insuficiente en la cuenta del Core Banking');
      return;
    }

    if (!swapForm.walletAddress) {
      alert('Dirección de wallet Ethereum requerida');
      return;
    }

    setIsSwapping(true);
    
    try {
      const ethAmount = calculateETHAmount();
      const fees = calculateFees();
      const totalCost = calculateTotalCost();

      const swapTransaction: CoreBankingSwap = {
        id: Math.random().toString(36).substr(2, 9),
        coreAccountId: swapForm.coreAccountId,
        coreBalance: selectedAccount?.balance || 0,
        coreCurrency: selectedAccount?.currency || 'EUR',
        ethAmount: ethAmount,
        exchangeRate: realTimeRates.ETH[selectedAccount?.currency as keyof typeof realTimeRates.ETH] || 0,
        coreFee: fees.coreFee,
        blockchainFee: fees.blockchainFee,
        totalCost: totalCost,
        status: 'pending',
        coreTransactionId: '',
        blockchainTransactionHash: '',
        timestamp: new Date().toISOString(),
        walletAddress: swapForm.walletAddress
      };

      // Ejecutar swap a través del Core Banking
      const response = await fetch('/api/core-banking/execute-swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          swapTransaction,
          coreAccountId: swapForm.coreAccountId,
          walletAddress: swapForm.walletAddress
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Core Banking swap executed:', result);
        
        // Actualizar estado de la transacción
        swapTransaction.status = 'completed';
        swapTransaction.coreTransactionId = result.coreTransactionId;
        swapTransaction.blockchainTransactionHash = result.blockchainTransactionHash;
        
        setSwapTransactions(prev => [swapTransaction, ...prev]);
        
        // Actualizar balance de la cuenta
        if (selectedAccount) {
          selectedAccount.availableBalance -= totalCost;
          selectedAccount.balance -= totalCost;
        }
        
        alert(`Swap exitoso! Convertiste ${formatCurrency(swapForm.coreAmount, selectedAccount?.currency || 'EUR')} a ${swapTransaction.ethAmount.toFixed(8)} ETH`);
        
        // Limpiar formulario
        setSwapForm(prev => ({ ...prev, coreAmount: 0, ethAmount: 0 }));
      } else {
        throw new Error('Error ejecutando swap del Core Banking');
      }

    } catch (error) {
      console.error('Error executing Core Banking swap:', error);
      alert('Error ejecutando el swap del Core Banking');
    } finally {
      setIsSwapping(false);
    }
  };

  const ethAmount = calculateETHAmount();
  const fees = calculateFees();
  const totalCost = calculateTotalCost();

  return (
    <div className="space-y-6">
      {/* Panel Principal de Swap Core Banking */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-orange-600 dark:text-orange-400">🏦 Swap Core Banking → Ethereum</span>
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              CORE BANKING
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selección de Cuenta Core Banking */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">1. Seleccionar Cuenta Core Banking</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coreAccounts.map((account) => (
                <Card 
                  key={account.id}
                  className={`cursor-pointer transition-all ${swapForm.coreAccountId === account.id ? 'border-orange-500 bg-orange-100 dark:bg-orange-900/30' : 'border-gray-200'}`}
                  onClick={() => setSwapForm(prev => ({ ...prev, coreAccountId: account.id }))}
                >
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🏦</div>
                      <div className="font-semibold">{account.accountNumber}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(account.availableBalance, account.currency)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {account.accountType} • {account.status}
                      </div>
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
                <label className="block text-sm font-medium mb-2">Cantidad a Convertir</label>
                <input
                  type="number"
                  value={swapForm.coreAmount}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, coreAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  aria-label="Cantidad a convertir"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Balance disponible: {selectedAccount ? formatCurrency(selectedAccount.availableBalance, selectedAccount.currency) : 'N/A'}
                </div>
              </div>
              
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
                  {selectedAccount ? realTimeRates.ETH[selectedAccount.currency as keyof typeof realTimeRates.ETH]?.toFixed(2) : '0.00'} {selectedAccount?.currency}/ETH
                </div>
              </div>
            </div>
          </div>

          {/* Resumen del Swap */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-blue-600 dark:text-blue-400">Resumen del Swap Core Banking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Cantidad a convertir:</span>
                <span className="font-semibold">{formatCurrency(swapForm.coreAmount, selectedAccount?.currency || 'EUR')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Fee Core Banking (0.1%):</span>
                <span>-{formatCurrency(fees.coreFee, selectedAccount?.currency || 'EUR')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Blockchain Fee:</span>
                <span>-{fees.blockchainFee.toFixed(8)} ETH</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Slippage:</span>
                <span>-{swapForm.slippage}%</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total a debitar:</span>
                <span className="text-red-600">{formatCurrency(totalCost, selectedAccount?.currency || 'EUR')}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>ETH a recibir:</span>
                <span className="text-green-600">{ethAmount.toFixed(8)} ETH</span>
              </div>
            </CardContent>
          </Card>

          {/* Botón de Swap */}
          <Button 
            onClick={executeCoreBankingSwap}
            disabled={isSwapping || !hasSufficientBalance() || swapForm.coreAmount <= 0 || !swapForm.walletAddress}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg"
          >
            {isSwapping ? '🔄 Procesando Swap Core Banking...' : `🏦 Swap ${formatCurrency(swapForm.coreAmount, selectedAccount?.currency || 'EUR')} → ${ethAmount.toFixed(8)} ETH`}
          </Button>

          {!hasSufficientBalance() && swapForm.coreAmount > 0 && (
            <div className="text-red-600 text-sm text-center">
              ❌ Balance insuficiente en la cuenta del Core Banking
            </div>
          )}

          {!swapForm.walletAddress && swapForm.coreAmount > 0 && (
            <div className="text-orange-600 text-sm text-center">
              ⚠️ Dirección de wallet Ethereum requerida
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Swaps Core Banking */}
      {swapTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋 Historial de Swaps Core Banking</span>
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
                      <div className="text-sm text-gray-600 dark:text-gray-400">Swap</div>
                      <div className="font-semibold">
                        {formatCurrency(swap.coreBalance, swap.coreCurrency)} → {swap.ethAmount.toFixed(8)} ETH
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Cuenta Core</div>
                      <div className="font-medium">{swap.coreAccountId}</div>
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
                    Core TX: {swap.coreTransactionId} | 
                    Blockchain TX: {swap.blockchainTransactionHash}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de Cuentas Core Banking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏦 Cuentas Core Banking Disponibles</span>
            <Badge variant="outline" className="text-gray-600 border-gray-600">
              {coreAccounts.length} cuentas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Cuenta</th>
                  <th className="text-left p-2">Divisa</th>
                  <th className="text-left p-2">Balance Total</th>
                  <th className="text-left p-2">Balance Disponible</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {coreAccounts.map((account) => (
                  <tr key={account.id} className="border-b">
                    <td className="p-2 font-mono text-xs">{account.accountNumber}</td>
                    <td className="p-2">{account.currency}</td>
                    <td className="p-2">{formatCurrency(account.balance, account.currency)}</td>
                    <td className="p-2 font-semibold">{formatCurrency(account.availableBalance, account.currency)}</td>
                    <td className="p-2">{account.accountType}</td>
                    <td className="p-2">
                      <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                        {account.status}
                      </Badge>
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





