'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface ScanProgress {
  isRunning: boolean;
  progress: number;
  currentBlock: number;
  totalBlocks: number;
  processedBytes: number;
  totalBytes: number;
  balances: Balance[];
  transactions: Transaction[];
  accounts: Account[];
  creditCards: CreditCard[];
  users: User[];
  totalEUR: number;
  totalUSD: number;
  totalGBP: number;
  startTime: string;
  elapsedTime: string;
  speed: number; // MB/s
  eta: string;
}

interface Balance {
  id: string;
  amount: number;
  currency: string;
  account: string;
  timestamp: string;
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  timestamp: string;
}

interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  currency: string;
  type: string;
}

interface CreditCard {
  id: string;
  cardNumber: string;
  cvv: string;
  expiryDate: string;
  balance: number;
  currency: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  accounts: string[];
}

export default function MassiveScanPanel() {
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    isRunning: false,
    progress: 0,
    currentBlock: 0,
    totalBlocks: 0,
    processedBytes: 0,
    totalBytes: 0,
    balances: [],
    transactions: [],
    accounts: [],
    creditCards: [],
    users: [],
    totalEUR: 0,
    totalUSD: 0,
    totalGBP: 0,
    startTime: '',
    elapsedTime: '00:00:00',
    speed: 0,
    eta: '00:00:00'
  });

  const [scanResults, setScanResults] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startScan = async () => {
    try {
      setScanProgress(prev => ({ ...prev, isRunning: true, progress: 0 }));
      
      const response = await fetch('/api/full-scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Iniciar polling para obtener progreso
        intervalRef.current = setInterval(updateProgress, 1000);
      }
    } catch (error) {
      console.error('Error iniciando escaneo:', error);
      setScanProgress(prev => ({ ...prev, isRunning: false }));
    }
  };

  const stopScan = async () => {
    try {
      await fetch('/api/full-scan/stop', { method: 'POST' });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setScanProgress(prev => ({ ...prev, isRunning: false }));
    } catch (error) {
      console.error('Error deteniendo escaneo:', error);
    }
  };

  const updateProgress = async () => {
    try {
      const response = await fetch('/api/full-scan/status');
      if (response.ok) {
        const data = await response.json();
        setScanProgress(prev => ({
          ...prev,
          ...data,
          isRunning: data.isRunning || false
        }));

        if (!data.isRunning && data.progress >= 100) {
          // Escaneo completado
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setScanResults(data);
        }
      }
    } catch (error) {
      console.error('Error obteniendo progreso:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400">🔍 Escaneo Masivo DTC1B</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controles de Escaneo */}
        <div className="flex gap-4">
          <Button 
            onClick={startScan} 
            disabled={scanProgress.isRunning}
            className="bg-green-600 hover:bg-green-700"
          >
            {scanProgress.isRunning ? 'Escaneando...' : 'Iniciar Escaneo'}
          </Button>
          <Button 
            onClick={stopScan} 
            disabled={!scanProgress.isRunning}
            variant="destructive"
          >
            Detener Escaneo
          </Button>
        </div>

        {/* Barra de Progreso */}
        {scanProgress.isRunning && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progreso del Escaneo</span>
                <span className="text-sm text-muted-foreground">
                  {scanProgress.progress.toFixed(1)}%
                </span>
              </div>
              <Progress value={scanProgress.progress} className="h-3" />
            </div>

            {/* Información Detallada */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {scanProgress.currentBlock} / {scanProgress.totalBlocks}
                </p>
                <p className="text-muted-foreground">Bloques</p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="font-semibold text-green-600 dark:text-green-400">
                  {formatBytes(scanProgress.processedBytes)}
                </p>
                <p className="text-muted-foreground">Procesados</p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="font-semibold text-purple-600 dark:text-purple-400">
                  {scanProgress.speed.toFixed(1)} MB/s
                </p>
                <p className="text-muted-foreground">Velocidad</p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="font-semibold text-orange-600 dark:text-orange-400">
                  {scanProgress.eta}
                </p>
                <p className="text-muted-foreground">ETA</p>
              </div>
            </div>
          </div>
        )}

        {/* Balance Total en Euros */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Balance Total Extraído</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">€{scanProgress.totalEUR.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
              <p className="text-sm opacity-90">Total en Euros</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">${scanProgress.totalUSD.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
              <p className="text-sm opacity-90">Total en Dólares</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">£{scanProgress.totalGBP.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
              <p className="text-sm opacity-90">Total en Libras</p>
            </div>
          </div>
        </div>

        {/* Resumen de Datos Extraídos */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {scanProgress.balances.length}
            </p>
            <p className="text-sm text-muted-foreground">Balances</p>
          </div>
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {scanProgress.transactions.length}
            </p>
            <p className="text-sm text-muted-foreground">Transacciones</p>
          </div>
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {scanProgress.accounts.length}
            </p>
            <p className="text-sm text-muted-foreground">Cuentas</p>
          </div>
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {scanProgress.creditCards.length}
            </p>
            <p className="text-sm text-muted-foreground">Tarjetas</p>
          </div>
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {scanProgress.users.length}
            </p>
            <p className="text-sm text-muted-foreground">Usuarios</p>
          </div>
        </div>

        {/* Estado del Escaneo */}
        <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              scanProgress.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="font-medium">
              {scanProgress.isRunning ? 'Escaneo en Progreso' : 'Escaneo Detenido'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Tiempo transcurrido: {scanProgress.elapsedTime}
          </div>
        </div>

        {/* Resultados del Escaneo */}
        {scanResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resultados del Escaneo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Balances Encontrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {scanResults.balances.slice(0, 10).map((balance: Balance) => (
                      <div key={balance.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">{balance.account}</span>
                        <span className="font-semibold">{formatCurrency(balance.amount, balance.currency)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Transacciones Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {scanResults.transactions.slice(0, 10).map((transaction: Transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">{transaction.from} → {transaction.to}</span>
                        <span className="font-semibold">{formatCurrency(transaction.amount, transaction.currency)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

