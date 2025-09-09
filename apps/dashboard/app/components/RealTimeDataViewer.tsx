'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { RefreshCw, Database, CreditCard, Users, Euro, DollarSign, PoundSterling } from 'lucide-react';
import { safePercentage } from './ErrorBoundary';

interface FinancialData {
  balances: Array<{
    Block: number;
    Balance: number;
    Currency: string;
    Position: number;
    RawValue: string;
  }>;
  transactions: Array<{
    Block: number;
    Amount: number;
    Currency: string;
    Position: number;
  }>;
  accounts: Array<{
    Block: number;
    AccountNumber: string;
    Position: number;
  }>;
  creditCards: Array<{
    Block: number;
    CardNumber: string;
    CVV: string;
    Position: number;
  }>;
  users: Array<{
    Block: number;
    Username: string;
    Position: number;
  }>;
  totals: {
    EUR: number;
    USD: number;
    GBP: number;
  };
  lastUpdate: string;
}

interface DAESData {
  Type: string;
  Original: string;
  Decoded: string;
  Block: number;
  Position: number;
}

interface BinaryData {
  Type: string;
  Data: string;
  Block: number;
}

export default function RealTimeDataViewer() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [daesData, setDaesData] = useState<DAESData[]>([]);
  const [binaryData, setBinaryData] = useState<BinaryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [scanProgress, setScanProgress] = useState<number>(0);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar datos financieros
      const financialResponse = await fetch('/api/v1/data/financial');
      if (financialResponse.ok) {
        const financial = await financialResponse.json();
        setFinancialData(financial);
        setLastUpdate(new Date(financial.lastUpdate));
      }

      // Cargar datos DAES
      const daesResponse = await fetch('/api/v1/data/daes');
      if (daesResponse.ok) {
        const daes = await daesResponse.json();
        setDaesData(daes);
      }

      // Cargar datos binarios
      const binaryResponse = await fetch('/api/v1/data/binary');
      if (binaryResponse.ok) {
        const binary = await binaryResponse.json();
        setBinaryData(binary);
      }

      // Simular progreso del escaneo
      const progressResponse = await fetch('/api/v1/data/progress');
      if (progressResponse.ok) {
        const progress = await progressResponse.json();
        setScanProgress(progress.progress?.percentage || 0);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    const symbols = {
      EUR: '€',
      USD: '$',
      GBP: '£'
    };
    return `${symbols[currency as keyof typeof symbols] || currency}${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCardNumber = (cardNumber: string) => {
    return cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'EUR': return <Euro className="h-4 w-4" />;
      case 'USD': return <DollarSign className="h-4 w-4" />;
      case 'GBP': return <PoundSterling className="h-4 w-4" />;
      default: return <Euro className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Visor de Datos en Tiempo Real - DTC1B
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button onClick={loadData} disabled={loading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              {lastUpdate && (
                <span className="text-sm text-muted-foreground">
                  Última actualización: {lastUpdate.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Progreso del escaneo:</span>
              <Badge variant="outline">{safePercentage(scanProgress)}</Badge>
            </div>
          </div>

          <Tabs defaultValue="balances" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="balances">Balances</TabsTrigger>
              <TabsTrigger value="transactions">Transacciones</TabsTrigger>
              <TabsTrigger value="accounts">Cuentas</TabsTrigger>
              <TabsTrigger value="cards">Tarjetas</TabsTrigger>
              <TabsTrigger value="decoded">Decodificado</TabsTrigger>
            </TabsList>

            <TabsContent value="balances" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {financialData?.totals && (
                  <>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Euro className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">Total EUR</p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(financialData.totals.EUR, 'EUR')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">Total USD</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatCurrency(financialData.totals.USD, 'USD')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <PoundSterling className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium">Total GBP</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {formatCurrency(financialData.totals.GBP, 'GBP')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {Array.isArray(financialData?.balances) && financialData.balances.map((balance, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getCurrencyIcon(balance.Currency)}
                        <div>
                          <p className="font-medium">{formatCurrency(balance.Balance, balance.Currency)}</p>
                          <p className="text-sm text-muted-foreground">
                            Bloque {balance.Block} • Posición {balance.Position}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{balance.Currency}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {Array.isArray(financialData?.transactions) && financialData.transactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getCurrencyIcon(transaction.Currency)}
                        <div>
                          <p className="font-medium">{formatCurrency(transaction.Amount, transaction.Currency)}</p>
                          <p className="text-sm text-muted-foreground">
                            Bloque {transaction.Block} • Posición {transaction.Position}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{transaction.Currency}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="accounts" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {Array.isArray(financialData?.accounts) && financialData.accounts.map((account, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="h-4 w-4" />
                        <div>
                          <p className="font-medium font-mono">{account.AccountNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            Bloque {account.Block} • Posición {account.Position}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Cuenta</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="cards" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {Array.isArray(financialData?.creditCards) && financialData.creditCards.map((card, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4" />
                        <div>
                          <p className="font-medium font-mono">{formatCardNumber(card.CardNumber)}</p>
                          <p className="text-sm text-muted-foreground">
                            CVV: {card.CVV} • Bloque {card.Block}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Tarjeta</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="decoded" className="space-y-4">
              <Tabs defaultValue="daes" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="daes">Datos DAES</TabsTrigger>
                  <TabsTrigger value="binary">Datos Binarios</TabsTrigger>
                </TabsList>

                <TabsContent value="daes" className="space-y-4">
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {Array.isArray(daesData) && daesData.map((daes, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{daes.Type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              Bloque {daes.Block}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">Original:</p>
                              <p className="text-xs font-mono bg-muted p-2 rounded">
                                {daes.Original.substring(0, 100)}...
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Decodificado:</p>
                              <p className="text-xs font-mono bg-muted p-2 rounded">
                                {daes.Decoded.substring(0, 100)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="binary" className="space-y-4">
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {Array.isArray(binaryData) && binaryData.map((binary, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{binary.Type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              Bloque {binary.Block}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Datos:</p>
                            <p className="text-xs font-mono bg-muted p-2 rounded">
                              {binary.Data.substring(0, 200)}...
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
