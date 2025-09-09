'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatCurrency } from '../utils/formatters';

interface DataModule {
  id: string;
  name: string;
  type: 'balances' | 'transactions' | 'accounts' | 'wallets' | 'users' | 'crypto';
  status: 'active' | 'processing' | 'ready' | 'error';
  dataCount: number;
  totalValue: number;
  currency: string;
  lastUpdated: string;
  swapEnabled: boolean;
  priority: number;
}

interface OrganizedData {
  modules: DataModule[];
  totalModules: number;
  activeModules: number;
  totalDataPoints: number;
  totalValue: number;
  lastOrganization: string;
}

interface ModuleSwap {
  id: string;
  moduleId: string;
  moduleName: string;
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  exchangeRate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: string;
  walletAddress: string;
}

export default function DataModulesOrganization() {
  const [organizedData, setOrganizedData] = useState<OrganizedData | null>(null);
  const [modules, setModules] = useState<DataModule[]>([]);
  const [moduleSwaps, setModuleSwaps] = useState<ModuleSwap[]>([]);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [selectedModule, setSelectedModule] = useState<DataModule | null>(null);
  const [swapForm, setSwapForm] = useState({
    amount: 0,
    walletAddress: '',
    slippage: 0.5,
    gasPrice: 20
  });

  const [realTimeRates, setRealTimeRates] = useState<{
    ETH: { EUR: number; USD: number; GBP: number };
    BTC: { EUR: number; USD: number; GBP: number };
  }>({
    ETH: { EUR: 0, USD: 0, GBP: 0 },
    BTC: { EUR: 0, USD: 0, GBP: 0 }
  });

  // Cargar datos organizados
  useEffect(() => {
    loadOrganizedData();
    loadModuleSwaps();
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

  // Cargar datos organizados
  const loadOrganizedData = async () => {
    try {
      const response = await fetch('/api/data-modules/organized');
      if (response.ok) {
        const data = await response.json();
        setOrganizedData(data);
        setModules(data.modules);
      } else {
        // Crear datos organizados basados en datos reales del DTC1B
        await createOrganizedModules();
      }
    } catch (error) {
      console.error('Error loading organized data:', error);
    }
  };

  // Crear módulos organizados
  const createOrganizedModules = async () => {
    setIsOrganizing(true);
    
    try {
      // Obtener datos reales del DTC1B
      const realDataResponse = await fetch('/api/dtc1b/massive-turbo-data');
      const realData = realDataResponse.ok ? await realDataResponse.json() : null;

      // Crear módulos basados en datos reales
      const organizedModules: DataModule[] = [
        {
          id: 'module_balances_eur',
          name: 'Balances EUR',
          type: 'balances',
          status: 'ready',
          dataCount: realData?.statistics?.balancesFound || 0,
          totalValue: realData?.balances?.EUR || 0,
          currency: 'EUR',
          lastUpdated: new Date().toISOString(),
          swapEnabled: true,
          priority: 1
        },
        {
          id: 'module_balances_usd',
          name: 'Balances USD',
          type: 'balances',
          status: 'ready',
          dataCount: realData?.statistics?.balancesFound || 0,
          totalValue: realData?.balances?.USD || 0,
          currency: 'USD',
          lastUpdated: new Date().toISOString(),
          swapEnabled: true,
          priority: 2
        },
        {
          id: 'module_balances_gbp',
          name: 'Balances GBP',
          type: 'balances',
          status: 'ready',
          dataCount: realData?.statistics?.balancesFound || 0,
          totalValue: realData?.balances?.GBP || 0,
          currency: 'GBP',
          lastUpdated: new Date().toISOString(),
          swapEnabled: true,
          priority: 3
        },
        {
          id: 'module_crypto_btc',
          name: 'Crypto BTC',
          type: 'crypto',
          status: 'ready',
          dataCount: 1,
          totalValue: realData?.balances?.BTC || 0,
          currency: 'BTC',
          lastUpdated: new Date().toISOString(),
          swapEnabled: true,
          priority: 4
        },
        {
          id: 'module_crypto_eth',
          name: 'Crypto ETH',
          type: 'crypto',
          status: 'ready',
          dataCount: 1,
          totalValue: realData?.balances?.ETH || 0,
          currency: 'ETH',
          lastUpdated: new Date().toISOString(),
          swapEnabled: true,
          priority: 5
        },
        {
          id: 'module_transactions',
          name: 'Transacciones',
          type: 'transactions',
          status: 'processing',
          dataCount: realData?.statistics?.transactionsFound || 0,
          totalValue: 0,
          currency: 'EUR',
          lastUpdated: new Date().toISOString(),
          swapEnabled: false,
          priority: 6
        },
        {
          id: 'module_accounts',
          name: 'Cuentas Bancarias',
          type: 'accounts',
          status: 'processing',
          dataCount: realData?.statistics?.accountsFound || 0,
          totalValue: 0,
          currency: 'EUR',
          lastUpdated: new Date().toISOString(),
          swapEnabled: false,
          priority: 7
        },
        {
          id: 'module_wallets',
          name: 'Wallets Ethereum',
          type: 'wallets',
          status: 'ready',
          dataCount: realData?.statistics?.ethereumWalletsFound || 0,
          totalValue: 0,
          currency: 'ETH',
          lastUpdated: new Date().toISOString(),
          swapEnabled: true,
          priority: 8
        }
      ];

      const organizedData: OrganizedData = {
        modules: organizedModules,
        totalModules: organizedModules.length,
        activeModules: organizedModules.filter(m => m.status === 'ready').length,
        totalDataPoints: organizedModules.reduce((sum, m) => sum + m.dataCount, 0),
        totalValue: organizedModules.reduce((sum, m) => sum + m.totalValue, 0),
        lastOrganization: new Date().toISOString()
      };

      setOrganizedData(organizedData);
      setModules(organizedModules);

      // Guardar datos organizados
      await saveOrganizedData(organizedData);

    } catch (error) {
      console.error('Error creating organized modules:', error);
    } finally {
      setIsOrganizing(false);
    }
  };

  // Cargar swaps de módulos
  const loadModuleSwaps = async () => {
    try {
      const response = await fetch('/api/data-modules/swaps');
      if (response.ok) {
        const swaps = await response.json();
        setModuleSwaps(swaps);
      }
    } catch (error) {
      console.error('Error loading module swaps:', error);
    }
  };

  // Guardar datos organizados
  const saveOrganizedData = async (data: OrganizedData) => {
    try {
      const response = await fetch('/api/data-modules/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        console.error('Error saving organized data');
      }
    } catch (error) {
      console.error('Error saving organized data:', error);
    }
  };

  // Calcular ETH recibido
  const calculateETHAmount = () => {
    if (!selectedModule || !realTimeRates.ETH[selectedModule.currency as keyof typeof realTimeRates.ETH]) {
      return 0;
    }
    
    const rate = realTimeRates.ETH[selectedModule.currency as keyof typeof realTimeRates.ETH];
    const ethAmount = swapForm.amount / rate;
    
    // Aplicar slippage
    const slippageAmount = ethAmount * (swapForm.slippage / 100);
    return ethAmount - slippageAmount;
  };

  // Ejecutar swap de módulo
  const executeModuleSwap = async () => {
    if (!selectedModule || !swapForm.walletAddress) {
      alert('Selecciona un módulo y proporciona una dirección de wallet');
      return;
    }

    try {
      const ethAmount = calculateETHAmount();
      const blockchainFee = swapForm.gasPrice * 0.000021;

      const moduleSwap: ModuleSwap = {
        id: Math.random().toString(36).substr(2, 9),
        moduleId: selectedModule.id,
        moduleName: selectedModule.name,
        fromAmount: swapForm.amount,
        fromCurrency: selectedModule.currency,
        toAmount: ethAmount,
        toCurrency: 'ETH',
        exchangeRate: realTimeRates.ETH[selectedModule.currency as keyof typeof realTimeRates.ETH] || 0,
        status: 'pending',
        timestamp: new Date().toISOString(),
        walletAddress: swapForm.walletAddress
      };

      const response = await fetch('/api/data-modules/execute-swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleSwap),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Module swap executed:', result);
        
        moduleSwap.status = 'completed';
        setModuleSwaps(prev => [moduleSwap, ...prev]);
        
        alert(`Swap exitoso! Convertiste ${formatCurrency(swapForm.amount, selectedModule.currency)} del módulo ${selectedModule.name} a ${ethAmount.toFixed(8)} ETH`);
        
        // Limpiar formulario
        setSwapForm(prev => ({ ...prev, amount: 0 }));
      } else {
        throw new Error('Error ejecutando swap del módulo');
      }

    } catch (error) {
      console.error('Error executing module swap:', error);
      alert('Error ejecutando el swap del módulo');
    }
  };

  const ethAmount = calculateETHAmount();

  return (
    <div className="space-y-6">
      {/* Panel Principal de Módulos Organizados */}
      <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-indigo-600 dark:text-indigo-400">🗂️ Módulos de Data Organizados</span>
            <Badge variant="outline" className="text-indigo-600 border-indigo-600">
              POST-ESCANEO
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumen de Módulos */}
          {organizedData && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Resumen de Módulos Organizados</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {organizedData.totalModules}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Módulos</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {organizedData.activeModules}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Módulos Activos</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {organizedData.totalDataPoints.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Puntos de Data</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(organizedData.totalValue, 'EUR')}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Valor Total</div>
                </div>
              </div>
            </div>
          )}

          {/* Módulos Disponibles */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Módulos Disponibles para Swap</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.filter(m => m.swapEnabled).map((module) => (
                <Card 
                  key={module.id}
                  className={`cursor-pointer transition-all ${selectedModule?.id === module.id ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' : 'border-gray-200'}`}
                  onClick={() => setSelectedModule(module)}
                >
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        {module.type === 'balances' ? '💰' : 
                         module.type === 'crypto' ? '₿' : 
                         module.type === 'wallets' ? '🔗' : '📊'}
                      </div>
                      <div className="font-semibold">{module.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(module.totalValue, module.currency)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {module.dataCount.toLocaleString()} elementos
                      </div>
                      <Badge variant={module.status === 'ready' ? 'default' : 'outline'} className="mt-2">
                        {module.status === 'ready' ? 'Listo' : 'Procesando'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Configuración de Swap */}
          {selectedModule && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Swap desde Módulo: {selectedModule.name}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cantidad a Convertir</label>
                  <input
                    type="number"
                    value={swapForm.amount}
                    onChange={(e) => setSwapForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    max={selectedModule.totalValue}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                    aria-label="Cantidad a convertir"
                  />
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Disponible: {formatCurrency(selectedModule.totalValue, selectedModule.currency)}
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

              {/* Resumen del Swap */}
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <CardHeader>
                  <CardTitle className="text-blue-600 dark:text-blue-400">Resumen del Swap de Módulo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Módulo:</span>
                    <span className="font-semibold">{selectedModule.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cantidad:</span>
                    <span className="font-semibold">{formatCurrency(swapForm.amount, selectedModule.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tasa:</span>
                    <span>{realTimeRates.ETH[selectedModule.currency as keyof typeof realTimeRates.ETH]?.toFixed(2)} {selectedModule.currency}/ETH</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>ETH a recibir:</span>
                    <span className="text-green-600">{ethAmount.toFixed(8)} ETH</span>
                  </div>
                </CardContent>
              </Card>

              {/* Botón de Swap */}
              <Button 
                onClick={executeModuleSwap}
                disabled={!swapForm.walletAddress || swapForm.amount <= 0 || swapForm.amount > selectedModule.totalValue}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg"
              >
                🗂️ Swap {formatCurrency(swapForm.amount, selectedModule.currency)} ({selectedModule.name}) → {ethAmount.toFixed(8)} ETH
              </Button>
            </div>
          )}

          {/* Controles de Organización */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Controles de Organización</h3>
            <div className="flex gap-4">
              <Button 
                onClick={createOrganizedModules}
                disabled={isOrganizing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isOrganizing ? '🔄 Organizando...' : '🗂️ Organizar Data en Módulos'}
              </Button>
              
              <Button 
                onClick={loadOrganizedData}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                🔄 Actualizar Módulos
              </Button>
            </div>
          </div>

          {/* Historial de Swaps de Módulos */}
          {moduleSwaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📋 Historial de Swaps de Módulos</span>
                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                    {moduleSwaps.length} swaps
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {moduleSwaps.slice(0, 5).map((swap) => (
                    <div key={swap.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Módulo</div>
                          <div className="font-semibold">{swap.moduleName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Swap</div>
                          <div className="font-semibold">
                            {formatCurrency(swap.fromAmount, swap.fromCurrency)} → {swap.toAmount.toFixed(8)} ETH
                          </div>
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
                        Tasa: {swap.exchangeRate.toFixed(2)} {swap.fromCurrency}/ETH
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





