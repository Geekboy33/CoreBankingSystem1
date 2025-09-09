'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

interface Account {
  id: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'investment';
  balance: number;
  currency: string;
  status: 'active' | 'inactive' | 'suspended';
  lastTransaction: string;
  owner: string;
}

export default function CuentasPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    // Simular carga de datos reales de dtc1b
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/v1/accounts');
        if (response.ok) {
          const data = await response.json();
          setAccounts(data.accounts || []);
        } else {
          // Datos de ejemplo basados en dtc1b
          setAccounts([
            {
              id: '1',
              accountNumber: 'DTC1B-001-USD',
              accountType: 'checking',
              balance: 125000.50,
              currency: 'USD',
              status: 'active',
              lastTransaction: '2024-01-15T10:30:00Z',
              owner: 'Cliente Principal'
            },
            {
              id: '2',
              accountNumber: 'DTC1B-002-EUR',
              accountType: 'savings',
              balance: 85000.75,
              currency: 'EUR',
              status: 'active',
              lastTransaction: '2024-01-14T15:45:00Z',
              owner: 'Cliente Corporativo'
            },
            {
              id: '3',
              accountNumber: 'DTC1B-003-BTC',
              accountType: 'investment',
              balance: 2.5,
              currency: 'BTC',
              status: 'active',
              lastTransaction: '2024-01-13T09:20:00Z',
              owner: 'Inversor Institucional'
            }
          ]);
        }
      } catch (error) {
        console.error('Error cargando cuentas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'checking': return 'Cuenta Corriente';
      case 'savings': return 'Cuenta de Ahorros';
      case 'investment': return 'Cuenta de Inversión';
      default: return type;
    }
  };

  const formatBalance = (balance: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency === 'BTC' ? 'USD' : currency,
      minimumFractionDigits: currency === 'BTC' ? 8 : 2
    }).format(balance);
  };

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
        <h1 className="text-3xl font-bold">Cuentas Bancarias</h1>
        <Button className="bg-brand hover:bg-brand/90">
          Nueva Cuenta
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Cuentas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Cuentas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedAccount(account)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{account.accountNumber}</h3>
                        <p className="text-sm text-muted-foreground">{account.owner}</p>
                        <p className="text-sm text-muted-foreground">
                          {getAccountTypeLabel(account.accountType)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {formatBalance(account.balance, account.currency)}
                        </p>
                        <Badge className={getStatusColor(account.status)}>
                          {account.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalles de Cuenta Seleccionada */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAccount ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Número de Cuenta</label>
                    <p className="font-semibold">{selectedAccount.accountNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Titular</label>
                    <p>{selectedAccount.owner}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                    <p>{getAccountTypeLabel(selectedAccount.accountType)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Balance</label>
                    <p className="text-2xl font-bold text-brand">
                      {formatBalance(selectedAccount.balance, selectedAccount.currency)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                    <Badge className={getStatusColor(selectedAccount.status)}>
                      {selectedAccount.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Última Transacción</label>
                    <p>{new Date(selectedAccount.lastTransaction).toLocaleString('es-ES')}</p>
                  </div>
                  <div className="pt-4 space-y-2">
                    <Button className="w-full" variant="outline">
                      Ver Historial
                    </Button>
                    <Button className="w-full" variant="outline">
                      Nueva Transferencia
                    </Button>
                    <Button className="w-full" variant="outline">
                      Configurar Alertas
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Selecciona una cuenta para ver los detalles
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resumen de Cuentas */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Cuentas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {accounts.filter(a => a.status === 'active').length}
              </p>
              <p className="text-sm text-muted-foreground">Cuentas Activas</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {accounts.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Cuentas</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {accounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString('es-ES')}
              </p>
              <p className="text-sm text-muted-foreground">Balance Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


