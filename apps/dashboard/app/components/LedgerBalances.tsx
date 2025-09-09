'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { formatCurrency } from '../utils/formatters';

interface LedgerBalance {
  account_id: string;
  currency: string;
  balance: string;
}

interface ConsolidatedBalance {
  currency: string;
  balance: string;
  rate_to_eur: string;
  balance_eur: string;
}

export default function LedgerBalances() {
  const [balances, setBalances] = useState<LedgerBalance[]>([]);
  const [consolidated, setConsolidated] = useState<ConsolidatedBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    setLoading(true);
    setError(null);
    try {
      const [balancesRes, consolidatedRes] = await Promise.all([
        fetch('/api/v1/ledger/balances'),
        fetch('/api/v1/ledger/consolidated-eur')
      ]);

      if (balancesRes.ok && consolidatedRes.ok) {
        const balancesData = await balancesRes.json();
        const consolidatedData = await consolidatedRes.json();
        
        setBalances(balancesData.balances || []);
        setConsolidated(consolidatedData.by_currency || []);
      } else {
        setError('Error al cargar los balances');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Cargando balances...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        {error}
        <Button onClick={fetchBalances} className="ml-2" size="sm">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Balances por Cuenta</h3>
        <Button onClick={fetchBalances} size="sm">
          Actualizar
        </Button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {balances.map((balance, index) => (
          <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
            <div>
              <div className="font-medium">{balance.account_id}</div>
              <div className="text-sm text-muted-foreground">{balance.currency}</div>
            </div>
            <div className="text-right font-semibold">
              {formatCurrency(parseFloat(balance.balance), balance.currency)}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-2">Consolidado en EUR</h4>
        <div className="space-y-2">
          {consolidated.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
              <div>
                <div className="font-medium">{item.currency}</div>
                <div className="text-sm text-muted-foreground">
                  Tasa: {parseFloat(item.rate_to_eur).toFixed(4)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {formatCurrency(parseFloat(item.balance_eur), 'EUR')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(parseFloat(item.balance), item.currency)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
