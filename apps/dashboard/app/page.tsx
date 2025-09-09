'use client';

import { useEffect } from 'react';
import { useStore } from './store/useStore';
import BalanceCard from './components/BalanceCard';
import Charts from './components/Charts';
import LedgerBalances from './components/LedgerBalances';
import PromoteStaging from './components/PromoteStaging';
import TransferForm from './components/TransferForm';
import TransactionsVirtualized from './components/TransactionsVirtualized';
import FileUpload from './components/FileUpload';
import DTC1BReader from './components/DTC1BReader';
import RealTimeDataViewer from './components/RealTimeDataViewer';
import EthereumConverter from './components/EthereumConverter';
import RealTimeEthereumData from './components/RealTimeEthereumData';
import EthereumScanStatus from './components/EthereumScanStatus';
import ScriptEndpoints from './components/ScriptEndpoints';
import EthereumSwap from './components/EthereumSwap';
import EthereumConfigPanel from './components/EthereumConfigPanel';
import EthereumPurchase from './components/EthereumPurchase';
import DTC1BRealDataSwap from './components/DTC1BRealDataSwap';
import Full800GBScanPanel from './components/Full800GBScanPanel';
import DataModulesOrganization from './components/DataModulesOrganization';
import CompleteScanPanel from './components/CompleteScanPanel';
import BalanceTrendsPanel from './components/BalanceTrendsPanel';
import ScanControls from './components/ScanControls';
import MassiveScanPanel from './components/MassiveScanPanel';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

export default function DashboardPage() {
  const { refreshData, balances, transactions, isLoading, error } = useStore();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <CardContent className="pt-6">
          <div className="text-red-600 dark:text-red-400">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles de Escaneo */}
      <ScanControls />

      {/* Escaneo Masivo DTC1B */}
      <MassiveScanPanel />

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {balances.map((balance) => (
          <BalanceCard key={balance.currency} balance={balance} />
        ))}
      </div>

      {/* Charts and Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tendencias de Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <Charts />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balances del Libro Mayor</CardTitle>
          </CardHeader>
          <CardContent>
            <LedgerBalances />
          </CardContent>
        </Card>
      </div>

      {/* Promote Staging */}
      <Card>
        <CardHeader>
          <CardTitle>Promoción de Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <PromoteStaging />
        </CardContent>
      </Card>

      {/* Transfer Form */}
      <Card id="transfer-form">
        <CardHeader>
          <CardTitle>Nueva Transferencia</CardTitle>
        </CardHeader>
        <CardContent>
          <TransferForm />
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
                 <CardContent>
           <TransactionsVirtualized transactions={[]} />
         </CardContent>
      </Card>

                        {/* File Upload */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Ingesta de Archivos DTC1B</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FileUpload />
                    </CardContent>
                  </Card>

                  {/* DTC1B Reader Avanzado */}
                  <DTC1BReader />

                  {/* Visor de Datos en Tiempo Real */}
                  <RealTimeDataViewer />

                  {/* Panel de Configuración de APIs Ethereum */}
                  <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-purple-600 dark:text-purple-400">⚙️ Configuración de APIs Ethereum</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EthereumConfigPanel />
                    </CardContent>
                  </Card>

                  {/* Conversión Real a Ethereum Blockchain */}
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-400">🔄 Conversión Real a Ethereum Blockchain</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EthereumConverter balances={balances} />
                    </CardContent>
                  </Card>

                  {/* Tendencias de Balance - DTC1B 800GB */}
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-400">📈 Tendencias de Balance - DTC1B 800GB</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BalanceTrendsPanel />
                    </CardContent>
                  </Card>

                  {/* Escaneo Completo DTC1B - Balances Totales */}
                  <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">🔍 Escaneo Completo DTC1B - Balances Totales</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CompleteScanPanel />
                    </CardContent>
                  </Card>

                  {/* Escaneo Completo DTC1B - 800GB */}
                  <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-purple-600 dark:text-purple-400">📊 Escaneo Completo DTC1B - 800GB</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Full800GBScanPanel />
                    </CardContent>
                  </Card>

                  {/* Módulos de Data Organizados */}
                  <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400">🗂️ Módulos de Data Organizados</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DataModulesOrganization />
                    </CardContent>
                  </Card>

                  {/* Swap Datos Reales DTC1B → Ethereum */}
                  <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-red-600 dark:text-red-400">📊 Swap Datos Reales DTC1B → Ethereum</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DTC1BRealDataSwap balances={balances} />
                    </CardContent>
                  </Card>

                  {/* Compra de Ethereum con Balances */}
                  <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">💰 Comprar Ethereum con Balances</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EthereumPurchase balances={balances} />
                    </CardContent>
                  </Card>

                  {/* Swap Real de Divisas a ETH */}
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-400">💱 Swap Real de Divisas a ETH</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EthereumSwap balances={balances} />
                    </CardContent>
                  </Card>

                  {/* Estado del Escaneo Ethereum */}
                  <EthereumScanStatus />

                  {/* Datos Ethereum en Tiempo Real */}
                  <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">⛓️ Datos Ethereum en Tiempo Real</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RealTimeEthereumData />
                    </CardContent>
                  </Card>

                  {/* Endpoints de Scripts */}
                  <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-purple-600 dark:text-purple-400">🔧 Endpoints de Scripts</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScriptEndpoints />
                    </CardContent>
                  </Card>
    </div>
  );
}
