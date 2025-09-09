'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

interface Transaction {
  id: string;
  transactionId: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  type: 'transfer' | 'deposit' | 'withdrawal' | 'swap' | 'purchase';
  status: 'completed' | 'pending' | 'failed' | 'processing';
  timestamp: string;
  description: string;
  fee?: number;
  exchangeRate?: number;
}

export default function TransaccionesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: '7d'
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/v1/ledger/transactions?limit=100');
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions || []);
        } else {
          // Datos de ejemplo basados en dtc1b
          setTransactions([
            {
              id: '1',
              transactionId: 'TXN-DTC1B-001',
              fromAccount: 'DTC1B-001-USD',
              toAccount: 'DTC1B-002-EUR',
              amount: 5000.00,
              currency: 'USD',
              type: 'transfer',
              status: 'completed',
              timestamp: '2024-01-15T10:30:00Z',
              description: 'Transferencia internacional USD a EUR',
              fee: 25.00,
              exchangeRate: 0.85
            },
            {
              id: '2',
              transactionId: 'TXN-DTC1B-002',
              fromAccount: 'DTC1B-003-BTC',
              toAccount: 'DTC1B-001-USD',
              amount: 0.5,
              currency: 'BTC',
              type: 'swap',
              status: 'completed',
              timestamp: '2024-01-14T15:45:00Z',
              description: 'Swap BTC a USD',
              fee: 0.001,
              exchangeRate: 42000
            },
            {
              id: '3',
              transactionId: 'TXN-DTC1B-003',
              fromAccount: 'External',
              toAccount: 'DTC1B-001-USD',
              amount: 10000.00,
              currency: 'USD',
              type: 'deposit',
              status: 'completed',
              timestamp: '2024-01-13T09:20:00Z',
              description: 'Depósito bancario externo',
              fee: 0
            },
            {
              id: '4',
              transactionId: 'TXN-DTC1B-004',
              fromAccount: 'DTC1B-002-EUR',
              toAccount: 'External',
              amount: 2500.00,
              currency: 'EUR',
              type: 'withdrawal',
              status: 'pending',
              timestamp: '2024-01-12T14:15:00Z',
              description: 'Retiro a cuenta externa',
              fee: 15.00
            },
            {
              id: '5',
              transactionId: 'TXN-DTC1B-005',
              fromAccount: 'DTC1B-001-USD',
              toAccount: 'ETH-Wallet',
              amount: 1000.00,
              currency: 'USD',
              type: 'purchase',
              status: 'processing',
              timestamp: '2024-01-11T11:30:00Z',
              description: 'Compra de Ethereum',
              fee: 10.00,
              exchangeRate: 0.0004
            }
          ]);
        }
      } catch (error) {
        console.error('Error cargando transacciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transfer': return 'Transferencia';
      case 'deposit': return 'Depósito';
      case 'withdrawal': return 'Retiro';
      case 'swap': return 'Swap';
      case 'purchase': return 'Compra';
      default: return type;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency === 'BTC' ? 'USD' : currency,
      minimumFractionDigits: currency === 'BTC' ? 8 : 2
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filters.type !== 'all' && transaction.type !== filters.type) return false;
    if (filters.status !== 'all' && transaction.status !== filters.status) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transacciones</h1>
        <Button className="bg-brand hover:bg-brand/90">
          Nueva Transacción
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
              >
                <option value="all">Todos</option>
                <option value="transfer">Transferencia</option>
                <option value="deposit">Depósito</option>
                <option value="withdrawal">Retiro</option>
                <option value="swap">Swap</option>
                <option value="purchase">Compra</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">Todos</option>
                <option value="completed">Completado</option>
                <option value="pending">Pendiente</option>
                <option value="processing">Procesando</option>
                <option value="failed">Fallido</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Período</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="all">Todo</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Transacciones */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Transacciones ({filteredTransactions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{transaction.transactionId}</h3>
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.fromAccount} → {transaction.toAccount}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.timestamp).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </p>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getTypeLabel(transaction.type)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalles de Transacción Seleccionada */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de Transacción</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTransaction ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID de Transacción</label>
                    <p className="font-semibold">{selectedTransaction.transactionId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                    <p>{selectedTransaction.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                    <p>{getTypeLabel(selectedTransaction.type)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Monto</label>
                    <p className="text-2xl font-bold text-brand">
                      {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                    <Badge className={getStatusColor(selectedTransaction.status)}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cuenta Origen</label>
                    <p>{selectedTransaction.fromAccount}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cuenta Destino</label>
                    <p>{selectedTransaction.toAccount}</p>
                  </div>
                  {selectedTransaction.fee && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Comisión</label>
                      <p>{formatAmount(selectedTransaction.fee, selectedTransaction.currency)}</p>
                    </div>
                  )}
                  {selectedTransaction.exchangeRate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo de Cambio</label>
                      <p>{selectedTransaction.exchangeRate}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fecha y Hora</label>
                    <p>{new Date(selectedTransaction.timestamp).toLocaleString('es-ES')}</p>
                  </div>
                  <div className="pt-4 space-y-2">
                    <Button className="w-full" variant="outline">
                      Ver Comprobante
                    </Button>
                    <Button className="w-full" variant="outline">
                      Exportar PDF
                    </Button>
                    <Button className="w-full" variant="outline">
                      Reportar Problema
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Selecciona una transacción para ver los detalles
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resumen de Transacciones */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {transactions.filter(t => t.status === 'completed').length}
              </p>
              <p className="text-sm text-muted-foreground">Completadas</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {transactions.filter(t => t.status === 'pending').length}
              </p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {transactions.filter(t => t.status === 'processing').length}
              </p>
              <p className="text-sm text-muted-foreground">Procesando</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {transactions.length}
              </p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


