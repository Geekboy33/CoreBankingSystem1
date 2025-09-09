'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface EthereumConfig {
  provider: 'infura' | 'alchemy' | 'custom';
  apiKey: string;
  network: 'mainnet' | 'goerli' | 'sepolia' | 'polygon' | 'arbitrum';
  customRpcUrl: string;
  walletPrivateKey: string;
  walletAddress: string;
}

interface ConnectionStatus {
  isConnected: boolean;
  networkId: number;
  blockNumber: number;
  gasPrice: string;
  lastCheck: string;
  error?: string;
}

export default function EthereumConfigPanel() {
  const [config, setConfig] = useState<EthereumConfig>({
    provider: 'infura',
    apiKey: '',
    network: 'mainnet',
    customRpcUrl: '',
    walletPrivateKey: '',
    walletAddress: ''
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    networkId: 0,
    blockNumber: 0,
    gasPrice: '0',
    lastCheck: ''
  });

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<EthereumConfig[]>([]);

  // Cargar configuración guardada
  useEffect(() => {
    const savedConfig = localStorage.getItem('ethereum-config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Guardar configuración
  const saveConfig = () => {
    localStorage.setItem('ethereum-config', JSON.stringify(config));
    alert('Configuración guardada exitosamente');
  };

  // Probar conexión
  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/ethereum/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const result = await response.json();
        setConnectionStatus({
          isConnected: true,
          networkId: result.networkId,
          blockNumber: result.blockNumber,
          gasPrice: result.gasPrice,
          lastCheck: new Date().toISOString(),
          error: undefined
        });
      } else {
        const error = await response.json();
        setConnectionStatus({
          isConnected: false,
          networkId: 0,
          blockNumber: 0,
          gasPrice: '0',
          lastCheck: new Date().toISOString(),
          error: error.message
        });
      }
    } catch (error) {
      setConnectionStatus({
        isConnected: false,
        networkId: 0,
        blockNumber: 0,
        gasPrice: '0',
        lastCheck: new Date().toISOString(),
        error: 'Error de conexión'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Generar wallet address desde private key
  const generateWalletAddress = () => {
    if (config.walletPrivateKey) {
      // En un entorno real, usar ethers.js para generar la dirección
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
      setConfig(prev => ({ ...prev, walletAddress: mockAddress }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel Principal de Configuración */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400">⚙️ Configuración de APIs Ethereum</span>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              BLOCKCHAIN CONFIG
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selección de Provider */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">1. Seleccionar Provider</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${config.provider === 'infura' ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30' : 'border-gray-200'}`}
                onClick={() => setConfig(prev => ({ ...prev, provider: 'infura' }))}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🔗</div>
                  <div className="font-semibold">Infura</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Provider oficial</div>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all ${config.provider === 'alchemy' ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30' : 'border-gray-200'}`}
                onClick={() => setConfig(prev => ({ ...prev, provider: 'alchemy' }))}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-semibold">Alchemy</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Alto rendimiento</div>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all ${config.provider === 'custom' ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30' : 'border-gray-200'}`}
                onClick={() => setConfig(prev => ({ ...prev, provider: 'custom' }))}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🔧</div>
                  <div className="font-semibold">Custom RPC</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">URL personalizada</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Configuración de API Key */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">2. Configurar API Key</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {config.provider === 'infura' ? 'Infura Project ID' : 
                   config.provider === 'alchemy' ? 'Alchemy API Key' : 
                   'Custom RPC URL'}
                </label>
                {config.provider === 'custom' ? (
                  <input
                    type="text"
                    value={config.customRpcUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, customRpcUrl: e.target.value }))}
                    placeholder="https://your-custom-rpc-url.com"
                    className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  />
                ) : (
                  <input
                    type="text"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder={config.provider === 'infura' ? 'tu-project-id' : 'tu-api-key'}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Red</label>
                <select
                  value={config.network}
                  onChange={(e) => setConfig(prev => ({ ...prev, network: e.target.value as any }))}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  aria-label="Seleccionar red Ethereum"
                >
                  <option value="mainnet">Mainnet (Producción)</option>
                  <option value="goerli">Goerli (Testnet)</option>
                  <option value="sepolia">Sepolia (Testnet)</option>
                  <option value="polygon">Polygon</option>
                  <option value="arbitrum">Arbitrum</option>
                </select>
              </div>
            </div>
          </div>

          {/* Configuración de Wallet */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">3. Configurar Wallet</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Private Key</label>
                <input
                  type="password"
                  value={config.walletPrivateKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, walletPrivateKey: e.target.value }))}
                  placeholder="0x1234567890abcdef..."
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                />
                <div className="text-xs text-red-600 mt-1">
                  ⚠️ Solo para desarrollo. En producción usar wallet seguro.
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.walletAddress}
                    onChange={(e) => setConfig(prev => ({ ...prev, walletAddress: e.target.value }))}
                    placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
                    className="flex-1 p-3 border rounded-lg bg-white dark:bg-gray-800"
                  />
                  <Button 
                    onClick={generateWalletAddress}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                  >
                    Generar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4">
            <Button 
              onClick={saveConfig}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
            >
              💾 Guardar Configuración
            </Button>
            
            <Button 
              onClick={testConnection}
              disabled={isTestingConnection}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
            >
              {isTestingConnection ? '🔄 Probando...' : '🔍 Probar Conexión'}
            </Button>
            
            <Button 
              onClick={() => setShowManual(!showManual)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3"
            >
              📖 {showManual ? 'Ocultar' : 'Mostrar'} Manual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estado de Conexión */}
      <Card className={connectionStatus.isConnected ? "border-green-200 bg-green-50 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:bg-red-900/20"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className={connectionStatus.isConnected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {connectionStatus.isConnected ? "🟢" : "🔴"} Estado de Conexión
            </span>
            <Badge variant={connectionStatus.isConnected ? "default" : "destructive"}>
              {connectionStatus.isConnected ? "CONECTADO" : "DESCONECTADO"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectionStatus.isConnected ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {connectionStatus.networkId}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Network ID</div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {connectionStatus.blockNumber}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Block Actual</div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {parseFloat(connectionStatus.gasPrice).toFixed(2)} Gwei
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Gas Price</div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {new Date(connectionStatus.lastCheck).toLocaleTimeString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Última Verificación</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-red-600 dark:text-red-400 mb-2">
                ❌ No se pudo conectar a la red Ethereum
              </div>
              {connectionStatus.error && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Error: {connectionStatus.error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual de Configuración */}
      {showManual && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-purple-600 dark:text-purple-400">📖 Manual de Configuración</span>
              <Badge variant="outline" className="text-purple-600 border-purple-600">
                GUÍA COMPLETA
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full">
              <div className="space-y-6 pr-4">
                {/* Infura */}
                <div>
                  <h3 className="font-semibold text-lg text-blue-600 dark:text-blue-400 mb-3">🔗 Configurar Infura</h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold mb-2">Paso 1: Crear cuenta en Infura</div>
                      <div>1. Ve a <a href="https://infura.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">infura.io</a></div>
                      <div>2. Crea una cuenta gratuita</div>
                      <div>3. Verifica tu email</div>
                    </div>
                    
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold mb-2">Paso 2: Crear proyecto</div>
                      <div>1. Haz clic en "Create New Project"</div>
                      <div>2. Selecciona "Ethereum"</div>
                      <div>3. Elige la red (Mainnet, Goerli, Sepolia)</div>
                      <div>4. Copia tu Project ID</div>
                    </div>
                    
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold mb-2">Paso 3: Configurar en el dashboard</div>
                      <div>1. Selecciona "Infura" como provider</div>
                      <div>2. Pega tu Project ID en el campo API Key</div>
                      <div>3. Selecciona la red correspondiente</div>
                      <div>4. Haz clic en "Probar Conexión"</div>
                    </div>
                  </div>
                </div>

                {/* Alchemy */}
                <div>
                  <h3 className="font-semibold text-lg text-green-600 dark:text-green-400 mb-3">⚡ Configurar Alchemy</h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold mb-2">Paso 1: Crear cuenta en Alchemy</div>
                      <div>1. Ve a <a href="https://alchemy.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">alchemy.com</a></div>
                      <div>2. Crea una cuenta gratuita</div>
                      <div>3. Verifica tu email</div>
                    </div>
                    
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold mb-2">Paso 2: Crear aplicación</div>
                      <div>1. Haz clic en "Create App"</div>
                      <div>2. Selecciona "Ethereum"</div>
                      <div>3. Elige la red (Mainnet, Goerli, Sepolia)</div>
                      <div>4. Copia tu API Key</div>
                    </div>
                    
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold mb-2">Paso 3: Configurar en el dashboard</div>
                      <div>1. Selecciona "Alchemy" como provider</div>
                      <div>2. Pega tu API Key en el campo correspondiente</div>
                      <div>3. Selecciona la red correspondiente</div>
                      <div>4. Haz clic en "Probar Conexión"</div>
                    </div>
                  </div>
                </div>

                {/* Wallet */}
                <div>
                  <h3 className="font-semibold text-lg text-orange-600 dark:text-orange-400 mb-3">🔐 Configurar Wallet</h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold mb-2">⚠️ IMPORTANTE: Solo para desarrollo</div>
                      <div>• Nunca uses tu private key principal en desarrollo</div>
                      <div>• Crea una wallet separada para testing</div>
                      <div>• Usa testnets (Goerli, Sepolia) para pruebas</div>
                    </div>
                    
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold mb-2">Crear wallet de prueba</div>
                      <div>1. Usa MetaMask o similar</div>
                      <div>2. Crea una nueva wallet</div>
                      <div>3. Copia la private key</div>
                      <div>4. Obtén ETH de testnet desde faucets</div>
                    </div>
                  </div>
                </div>

                {/* Troubleshooting */}
                <div>
                  <h3 className="font-semibold text-lg text-red-600 dark:text-red-400 mb-3">🔧 Solución de Problemas</h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold mb-2">Error: "Invalid API Key"</div>
                      <div>• Verifica que copiaste correctamente el API Key</div>
                      <div>• Asegúrate de que el proyecto esté activo</div>
                      <div>• Verifica que seleccionaste la red correcta</div>
                    </div>
                    
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold mb-2">Error: "Network Error"</div>
                      <div>• Verifica tu conexión a internet</div>
                      <div>• Intenta cambiar de red (mainnet → testnet)</div>
                      <div>• Verifica que el provider esté funcionando</div>
                    </div>
                    
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold mb-2">Error: "Insufficient Funds"</div>
                      <div>• Asegúrate de tener ETH en tu wallet</div>
                      <div>• Para testnets, obtén ETH desde faucets</div>
                      <div>• Verifica que la dirección del wallet sea correcta</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Configuraciones Guardadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💾 Configuraciones Guardadas</span>
            <Badge variant="outline" className="text-gray-600 border-gray-600">
              HISTORIAL
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-400 mb-4">
              Las configuraciones se guardan automáticamente en el navegador
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              Para cambiar de configuración, modifica los campos arriba y haz clic en "Guardar Configuración"
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
